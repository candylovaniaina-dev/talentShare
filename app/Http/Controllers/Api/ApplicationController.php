<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Application\ApplicationRequest;
use App\Mail\InterviewScheduled;
use App\Mail\ApplicationShortlisted;
use App\Models\Application;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ApplicationController extends Controller
{
    /**
     * Liste les candidatures de l'utilisateur connecté (Young Talent)
     */
    public function index(Request $request)
    {
        $profile = $request->user()->professionalProfile;

        if (!$profile) {
            return response()->json([]);
        }

        return Application::forProfile($profile->id)
            ->with(['jobOffer.company:id,name,logo_path,city,country', 'portfolio:id,title,public_slug'])
            ->when($request->status, fn($q, $v) => $q->byStatus($v))
            ->latest()
            ->get();
    }

    /**
     * Stats rapides pour le dashboard
     */
    public function stats(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        if (!$profile) {
            return response()->json(['total' => 0]);
        }

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

    /**
     * Détail d'une candidature
     */
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

        return $application;
    }

    /**
     * Créer une candidature (Young Talent)
     */
    public function store(ApplicationRequest $request)
    {
        if ($request->user()->role === "company") {
            return response()->json([
                'message' => 'Une entreprise ne peut pas postuler à une offre. Utilisez la messagerie.',
            ], 403);
        }

        $profile = $request->user()->professionalProfile;

        if (!$profile) {
            return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);
        }

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

        return response()->json(
            $application->load('jobOffer.company'),
            201
        );
    }

    /**
     * Retirer une candidature (candidat)
     */
    public function withdraw(Request $request, Application $application)
    {
        $profile = $request->user()->professionalProfile;
        abort_unless($profile && $application->professional_profile_id === $profile->id, 403);

        abort_if(in_array($application->status, ['accepted', 'rejected']), 422, 'Impossible de retirer cette candidature.');

        $application->delete();

        return response()->json(['message' => 'Candidature retirée.']);
    }

    /**
     * Changer le statut (recruteur uniquement)
     */
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
            return response()->json([
                'message' => 'Utilisez la programmation d\'entretien pour ce statut (date + lien requis).',
            ], 422);
        }

        $previousStatus = $application->status;

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
                        'body' => "{$company?->name} a accepté votre candidature pour « {$offer?->title} »",
                    ],
                    'rejected' => [
                        'type' => 'application_rejected',
                        'title' => '❌ Candidature refusée',
                        'body' => "Votre candidature pour « {$offer?->title} » n'a pas été retenue",
                    ],
                ];

                $cfg = $config[$data['status']];

                // 📬 Notification interne (cloche)
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

                // 📧 EMAIL : Présélection (uniquement si on passe à ce statut pour la première fois)
                if ($data['status'] === 'shortlisted' && $previousStatus !== 'shortlisted') {
                    try {
                        Mail::to($applicant->email)
                            ->send(new ApplicationShortlisted($fresh));
                        \Log::info("✅ Email présélection envoyé à {$applicant->email}");
                    } catch (\Exception $e) {
                        \Log::error("❌ Erreur envoi email présélection: " . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur notification updateStatus: ' . $e->getMessage());
        }

        return $application->fresh();
    }

    /**
     * ✅ Programme un entretien avec vérification automatique de l'email
     */
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

        // Vérification email (RFC + MX)
        $emailValidation = Validator::make(
            ['email' => $applicant->email],
            ['email' => 'required|email:rfc,dns']
        );

        if ($emailValidation->fails()) {
            return response()->json([
                'message' => "L'adresse email du candidat « {$applicant->email} » est invalide.",
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

        // ═══════════════════════════════════════════════
        // ÉTAPE CLÉ : On détecte si l'email est vérifié ou non
        // ═══════════════════════════════════════════════
        $emailNotVerified = !$applicant->email_verified_at;

        // Génération lien visio
        $roomId = 'talentshare-' . $application->id . '-' . Str::random(10);
        $meetLink = "https://meet.jit.si/{$roomId}";

        $application->update([
            'status' => 'interview',
            'interview_at' => $data['interview_at'],
            'interview_link' => $meetLink,
        ]);

        $emailSent = false;
        $emailError = null;
        $waitingForVerification = false;

        // ═══════════════════════════════════════════════
        // 🔴 CAS 1 : Email NON VÉRIFIÉ → on n'envoie PAS l'email d'entretien
        // ═══════════════════════════════════════════════
        if ($emailNotVerified) {
            $waitingForVerification = true;

            // On envoie SEULEMENT un email "Vérifiez votre email"
            try {
                Mail::to($applicant->email)->send(
                    new \App\Mail\InterviewScheduledVerificationNeeded($application->fresh())
                );
                \Log::info("⏳ Email d'entretien EN ATTENTE de vérification pour {$applicant->email}");
            } catch (\Exception $e) {
                \Log::error('❌ Erreur envoi email "vérification requise": ' . $e->getMessage());
                $emailError = $e->getMessage();
            }

            // Pas d'email d'entretien tant que pas vérifié → on saute
            // Le mail d'entretien partira automatiquement quand l'email sera vérifié

        } else {
            // ═══════════════════════════════════════════════
            // 🟢 CAS 2 : Email VÉRIFIÉ → on envoie normalement
            // ═══════════════════════════════════════════════
            try {
                Mail::to($applicant->email)->send(
                    new InterviewScheduled($application->fresh(), false)
                );
                $emailSent = true;
                \Log::info("✅ Email entretien envoyé à {$applicant->email}");
            } catch (\Exception $e) {
                \Log::error('❌ Erreur envoi email entretien: ' . $e->getMessage());
                $emailError = $e->getMessage();
            }
        }

        // ═══════════════════════════════════════════════
        // SMS — envoyé UNIQUEMENT si l'email est vérifié
        // ═══════════════════════════════════════════════
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

        // Email au recruteur (toujours envoyé)
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

        // Notification interne (cloche)
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

        // ═══════════════════════════════════════════════
        // RÉPONSE FINALE
        // ═══════════════════════════════════════════════
        if ($waitingForVerification) {
            return response()->json([
                'message' => "Entretien programmé. Le candidat n'a pas encore vérifié son email — un email de vérification lui a été envoyé. L'invitation d'entretien partira automatiquement après vérification.",
                'warning' => "Le candidat doit confirmer son adresse email pour recevoir l'invitation.",
                'application' => $application->fresh(),
                'waiting_for_verification' => true,
            ], 202); // 202 Accepted
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
            'sms_sent_to' => $smsSent ? $applicant->phone : null,
        ]);
    }

    /**
     * Marquer comme consultée
     */
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