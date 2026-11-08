<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Application\ApplicationRequest;
use App\Mail\InterviewScheduled;
use App\Mail\ApplicationShortlisted;
use App\Mail\ApplicationAccepted;
use App\Mail\ApplicationRejected;
use App\Models\Application;
use App\Models\Notification;
use App\Models\Employee;
use App\Models\Mission;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon; // ✅ Import de Carbon pour le fuseau horaire
use App\Services\ContractService;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        if (!$profile) return response()->json([]);

        return Application::forProfile($profile->id)
            ->with(['jobOffer.company:id,name,logo_path,city,country', 'portfolio:id,title,public_slug'])
            ->when($request->status, fn($q, $v) => $q->byStatus($v))
            ->latest()
            ->get();
    }

    public function stats(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        if (!$profile) return response()->json(['total' => 0]);

        $counts = Application::forProfile($profile->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'total'       => array_sum($counts),
            'sent'        => $counts['sent'] ?? 0,
            'viewed'      => $counts['viewed'] ?? 0,
            'shortlisted' => $counts['shortlisted'] ?? 0,
            'interview'   => $counts['interview'] ?? 0,
            'accepted'    => $counts['accepted'] ?? 0,
            'rejected'    => $counts['rejected'] ?? 0,
        ]);
    }

    public function show(Request $request, Application $application)
    {
        $profile = $request->user()->professionalProfile;
        $isOwner = $profile && $application->professional_profile_id === $profile->id;
        $isRecruiter = $request->user()->companies()
            ->where('id', $application->jobOffer->company_id)->exists();

        abort_unless($isOwner || $isRecruiter, 403);

        $application->load([
            'jobOffer.company',
            'jobOffer.skills',
            'profile.user',
            'profile.skills',
            'profile.educations',
            'portfolio',
        ]);

        if (empty($application->cv_path) && $application->profile) {
            $application->cv_path = $application->profile->cv_path;
        }

        return response()->json($application);
    }

    public function store(ApplicationRequest $request)
    {
        if ($request->user()->role === "company") {
            return response()->json(['message' => 'Une entreprise ne peut pas postuler.'], 403);
        }

        $profile = $request->user()->professionalProfile;
        if (!$profile) return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);

        $existing = Application::where('job_offer_id', $request->job_offer_id)
            ->where('professional_profile_id', $profile->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Vous avez déjà postulé à cette offre.',
                'application_id' => $existing->id,
            ], 409);
        }

        $data = $request->validated();
        $data['professional_profile_id'] = $profile->id;
        $data['status'] = 'sent';

        if (!empty($data['portfolio_id'])) {
            if ($profile->portfolio?->id !== (int) $data['portfolio_id']) {
                return response()->json(['message' => 'Ce portfolio ne vous appartient pas.'], 403);
            }
        } else {
            $data['portfolio_id'] = $profile->portfolio?->id;
        }

        if (empty($data['cv_path'])) {
            $data['cv_path'] = $profile->cv_path;
        }

        $application = Application::create($data);
        $application->load('jobOffer.company', 'profile.user');

        try {
            $company = $application->jobOffer->company;
            $offer = $application->jobOffer;
            $applicant = $profile->user;

            if ($company && $company->owner_user_id) {
                Notification::create([
                    'user_id' => $company->owner_user_id,
                    'type' => 'new_application',
                    'title' => '📥 Nouvelle candidature reçue',
                    'body' => "{$applicant->name} a postulé à « {$offer->title} »",
                    'subject_type' => Application::class,
                    'subject_id' => $application->id,
                    'data' => [
                        'url' => "/job-offers/{$offer->id}/applications",
                        'application_id' => $application->id,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur notification new_application: ' . $e->getMessage());
        }

        return response()->json($application->load('jobOffer.company'), 201);
    }

    public function withdraw(Request $request, Application $application)
    {
        $profile = $request->user()->professionalProfile;
        abort_unless($profile && $application->professional_profile_id === $profile->id, 403);

        abort_if(in_array($application->status, ['accepted', 'rejected']), 422, 'Impossible de retirer cette candidature.');

        $application->delete();
        return response()->json(['message' => 'Candidature retirée.']);
    }

    public function updateStatus(Request $request, Application $application)
    {
        $isOwnerCompany = $request->user()->companies()
            ->where('id', $application->jobOffer->company_id)->exists();

        abort_unless($isOwnerCompany, 403, 'Non autorisé.');

        $data = $request->validate([
            'status'          => ['required', 'in:viewed,shortlisted,interview,accepted,rejected'],
            'recruiter_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($data['status'] === 'interview') {
            return response()->json(['message' => 'Utilisez la programmation d\'entretien.'], 422);
        }

        $previousStatus = $application->status;
        $createdMission = null;

           if ($data['status'] === 'accepted' && $previousStatus !== 'accepted') {
            $applicant = $application->profile->user;

            try {
                Mail::to($applicant->email)->send(new ApplicationAccepted($application->fresh()));
            } catch (\Exception $e) {
                $application->update(['status' => 'shortlisted']);
                return response()->json([
                    'message' => "L'acceptation a échoué car l'email n'a pas pu être envoyé. Le statut reste 'Présélectionnée'.",
                    'error' => $e->getMessage()
                ], 500);
            }

            $offer     = $application->jobOffer;
            $company   = $offer->company;
            $recruiter = $company->owner;

            // ✅ Contrat calculé automatiquement selon le type de recrutement
            $contract = ContractService::build($offer);

            try {
                Employee::updateOrCreate(
                    ['company_id' => $company->id, 'user_id' => $applicant->id],
                    [
                        'position'      => $offer->title,
                        'status'        => $contract['is_trial'] ? 'trial' : 'active',
                        'contract_type' => $contract['contract_type'],
                        'start_date'    => $contract['start_at'],
                        'end_date'      => $contract['end_at'],
                        'has_account'   => true,
                        'first_name'    => $applicant->first_name ?? explode(' ', $applicant->name)[0] ?? '',
                        'last_name'     => $applicant->last_name ?? explode(' ', $applicant->name)[1] ?? '',
                        'email'         => $applicant->email,
                        'phone'         => $applicant->phone,
                    ]
                );
            } catch (\Exception $e) {
                \Log::error('Erreur création employé : ' . $e->getMessage());
            }

            try {
                $createdMission = Mission::create([
                    'proposal_id'             => null,
                    'job_offer_id'            => $offer->id,
                    'title'                   => $offer->title,
                    'requesting_company_id'   => $company->id,
                    'supplying_company_id'    => null,
                    'professional_profile_id' => $application->professional_profile_id,
                    'contract_type'           => $contract['contract_type'],
                    'start_at'                => $contract['start_at'],
                    'end_at'                  => $contract['end_at'],          // null seulement pour un CDI
                    'is_trial'                => $contract['is_trial'],
                    'trial_ends_at'           => $contract['trial_ends_at'],
                    'workload_percent'        => 100,
                    'remote'                  => $offer->remote ?? false,
                    // Stage / CDD : démarre aujourd'hui. CDI avec essai : statut "trial".
                    'status'                  => $contract['is_trial'] ? 'trial' : 'active',
                ]);
            } catch (\Exception $e) {
                \Log::error('Erreur création mission: ' . $e->getMessage());
            }

            // ✅ On récupère les autres candidats AVANT de les passer en "refusé"
            //    (sinon les anciens refusés recevaient un 2e email de refus)
            $otherApps = collect();
            try {
                $otherApps = Application::where('job_offer_id', $offer->id)
                    ->where('id', '!=', $application->id)
                    ->whereNotIn('status', ['rejected', 'accepted'])
                    ->with('profile.user')
                    ->get();

                $offer->update(['status' => 'closed']);

                if ($otherApps->isNotEmpty()) {
                    Application::whereIn('id', $otherApps->pluck('id'))
                        ->update(['status' => 'rejected', 'decided_at' => now()]);
                }
            } catch (\Exception $e) {
                \Log::error('Erreur fermeture offre: ' . $e->getMessage());
            }

            try {
                $conversation = Conversation::where('subject_type', 'App\Models\Company')
                    ->where('subject_id', $company->id)
                    ->whereHas('participants', fn($q) => $q->where('user_id', $applicant->id))
                    ->first();

                if (!$conversation) {
                    $conversation = Conversation::create([
                        'subject_type' => 'App\Models\Company',
                        'subject_id'   => $company->id,
                        'title'        => "Collaboration – {$offer->title}",
                    ]);
                    $conversation->participants()->attach([$recruiter->id, $applicant->id]);
                }

                Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id'       => $recruiter->id,
                    'body'            => "Bienvenue dans l'équipe ! 🎉\n\n"
                        . "Nous sommes ravis de vous compter parmi nous pour le poste de « {$offer->title} ».\n\n"
                        . "N'hésitez pas à nous contacter ici pour discuter des détails pratiques (date de début, matériel, etc.).\n\n"
                        . "À très vite !",
                ]);
            } catch (\Exception $e) {
                \Log::error('Erreur création conversation: ' . $e->getMessage());
            }

            foreach ($otherApps as $rejApp) {
                try {
                    $rejUser = $rejApp->profile?->user;
                    if ($rejUser) {
                        Mail::to($rejUser->email)->send(new ApplicationRejected($rejApp));
                    }
                } catch (\Exception $e) {
                    \Log::error('Erreur email refus: ' . $e->getMessage());
                }
            }
        }

        $application->transitionTo($data['status']);

        if (array_key_exists('recruiter_notes', $data)) {
            $application->update(['recruiter_notes' => $data['recruiter_notes']]);
        }

        try {
            $fresh = $application->fresh();
            $applicant = $fresh->profile?->user;
            $offer = $fresh->jobOffer;
            $company = $offer?->company;

            $notifiableStatuses = ['shortlisted', 'accepted', 'rejected'];

            if ($applicant && in_array($data['status'], $notifiableStatuses)) {
                $config = [
                    'shortlisted' => [
                        'type' => 'application_shortlisted',
                        'title' => '🎉 Vous êtes présélectionné(e) !',
                        'body' => "{$company?->name} a présélectionné votre candidature pour « {$offer?->title} »",
                    ],
                    'accepted' => [
                        'type' => 'application_accepted',
                        'title' => '✅ Candidature acceptée',
                        'body' => "Félicitations ! {$company?->name} a accepté votre candidature pour « {$offer?->title} ». Bienvenue dans l'équipe !",
                    ],
                    'rejected' => [
                        'type' => 'application_rejected',
                        'title' => '❌ Candidature refusée',
                        'body' => "Votre candidature pour « {$offer?->title} » n'a pas été retenue",
                    ],
                ];

                $cfg = $config[$data['status']];

                Notification::create([
                    'user_id' => $applicant->id,
                    'type' => $cfg['type'],
                    'title' => $cfg['title'],
                    'body' => $cfg['body'],
                    'subject_type' => Application::class,
                    'subject_id' => $fresh->id,
                    'data' => [
                        'url' => "/applications/{$fresh->id}",
                        'application_id' => $fresh->id,
                        'status' => $data['status'],
                    ],
                ]);

                if ($data['status'] === 'shortlisted' && $previousStatus !== 'shortlisted') {
                    try {
                        Mail::to($applicant->email)->send(new ApplicationShortlisted($fresh));
                    } catch (\Exception $e) {
                        \Log::error("Erreur email présélection: " . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur notification updateStatus: ' . $e->getMessage());
        }

        return response()->json([
            'message' => $data['status'] === 'accepted' ? 'Candidature acceptée. Le talent a été ajouté à votre équipe et la mission a été créée.' : 'Statut mis à jour.',
            'application' => $application->fresh(),
            'mission_id' => $createdMission?->id ?? null,
        ]);
    }

    public function scheduleInterview(Request $request, Application $application)
    {
        $isOwnerCompany = $request->user()->companies()
            ->where('id', $application->jobOffer->company_id)->exists();

        abort_unless($isOwnerCompany, 403, 'Non autorisé.');

        $data = $request->validate([
            'interview_at' => ['required', 'date', 'after:now'],
        ]);

        $application->load('jobOffer.company', 'profile.user');
        $applicant = $application->profile?->user;

        if (!$applicant) {
            return response()->json(['message' => 'Candidat introuvable.'], 422);
        }

        $emailValidation = Validator::make(
            ['email' => $applicant->email],
            ['email' => 'required|email:rfc,dns']
        );

        if ($emailValidation->fails()) {
            return response()->json([
                'message' => "L'adresse email du candidat est invalide.",
                'errors' => $emailValidation->errors(),
            ], 422);
        }

        $emailDomain = substr(strrchr($applicant->email, "@"), 1);
        $hasMxRecord = false;

        try {
            if (function_exists('checkdnsrr')) {
                $hasMxRecord = checkdnsrr($emailDomain, 'MX');
            }
        } catch (\Exception $e) {
            \Log::warning("Erreur checkdnsrr pour {$emailDomain}: " . $e->getMessage());
        }

        if (!$hasMxRecord) {
            try {
                if (function_exists('checkdnsrr')) {
                    $hasMxRecord = checkdnsrr($emailDomain, 'A');
                }
            } catch (\Exception $e) {}
        }

        if (!$hasMxRecord) {
            return response()->json([
                'message' => "Le domaine « {$emailDomain} » ne peut pas recevoir d'emails.",
            ], 422);
        }

        $emailNotVerified = !$applicant->email_verified_at;

      // ✅ NOUVEAU : On génère un ID de salle propre
$candidateName = Str::slug($applicant->name);
$offerTitle = Str::slug($application->jobOffer->title);
$roomId = "TalentShare-Entretien-{$candidateName}-{$offerTitle}";

// ✅ On génère le lien vers TA page React (et non Jitsi direct)
$frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
$meetLink = "{$frontendUrl}/interview/{$roomId}?name=" . urlencode($applicant->name) . "&email=" . urlencode($applicant->email);

        // ✅ On force la date dans le fuseau de Madagascar
        $interviewDate = Carbon::parse($data['interview_at'], 'Indian/Antananarivo');

        $application->update([
            'status' => 'interview',
            'interview_at' => $interviewDate, 
            'interview_link' => $meetLink,
        ]);

        $emailSent = false;
        $emailError = null;
        $waitingForVerification = false;

        if ($emailNotVerified) {
            $waitingForVerification = true;
            try {
                Mail::to($applicant->email)->send(
                    new \App\Mail\InterviewScheduledVerificationNeeded($application->fresh())
                );
            } catch (\Exception $e) {
                $emailError = $e->getMessage();
            }
        } else {
            try {
                Mail::to($applicant->email)->send(
                    new InterviewScheduled($application->fresh(), false)
                );
                $emailSent = true;
            } catch (\Exception $e) {
                $emailError = $e->getMessage();
            }
        }

        $smsSent = false;

        if (!$emailNotVerified && !empty($applicant->phone)) {
            try {
                $interviewDate = $application->interview_at
                    ->locale('fr')
                    ->isoFormat('dddd D MMMM [à] HH:mm');

                $smsMessage = "🎉 Félicitations {$applicant->name} ! "
                    . "Votre entretien avec {$application->jobOffer->company?->name} "
                    . "est prévu le {$interviewDate}. "
                    . "Lien visio : {$meetLink}";

                $smsSent = \App\Services\SmsService::send($applicant->phone, $smsMessage);
            } catch (\Exception $e) {
                \Log::error("❌ Erreur SMS entretien: " . $e->getMessage());
            }
        }

        try {
            $company = $application->jobOffer->company;
            if ($company && $company->owner_user_id) {
                $recruiter = \App\Models\User::find($company->owner_user_id);
                if ($recruiter) {
                    Mail::to($recruiter->email)->send(
                        new \App\Mail\InterviewScheduledRecruiter($application->fresh(), $recruiter->name)
                    );
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur envoi email recruteur: ' . $e->getMessage());
        }

        try {
            Notification::create([
                'user_id' => $applicant->id,
                'type' => 'application_interview',
                'title' => '📅 Entretien programmé',
                'body' => "{$application->jobOffer->company?->name} vous propose un entretien pour « {$application->jobOffer->title} »",
                'subject_type' => Application::class,
                'subject_id' => $application->id,
                'data' => [
                    'url' => "/applications/{$application->id}",
                    'interview_at' => $application->interview_at,
                    'interview_link' => $meetLink,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::warning('Erreur notification interview: ' . $e->getMessage());
        }

        if ($waitingForVerification) {
            return response()->json([
                'message' => "Entretien programmé. Le candidat doit vérifier son email.",
                'application' => $application->fresh(),
                'waiting_for_verification' => true,
            ], 202);
        }

        if (!$emailSent) {
            return response()->json([
                'message' => "L'entretien a été enregistré mais l'email n'a pas pu être envoyé.",
                'error' => $emailError,
                'application' => $application->fresh(),
            ], 207);
        }

        return response()->json([
            'message' => 'Entretien programmé et invitation envoyée.',
            'application' => $application->fresh(),
            'email_sent_to' => $applicant->email,
            'sms_sent' => $smsSent,
        ]);
    }

    public function markAsViewed(Request $request, Application $application)
    {
        $isOwnerCompany = $request->user()->companies()
            ->where('id', $application->jobOffer->company_id)->exists();

        abort_unless($isOwnerCompany, 403);

        if ($application->status === 'sent') {
            $application->transitionTo('viewed');
        }

        return response()->json(['message' => 'Consultée']);
    }
}