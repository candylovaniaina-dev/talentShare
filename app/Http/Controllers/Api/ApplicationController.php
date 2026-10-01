<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Application\ApplicationRequest;
use App\Mail\InterviewScheduled;
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
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur notification updateStatus: ' . $e->getMessage());
        }

        return $application->fresh();
    }

    /**
     * ✅ Programme un entretien avec vérification automatique de l'email
     *
     * Logique :
     * 1. Valide le format de l'email (RFC)
     * 2. Vérifie que le domaine a un enregistrement MX (le serveur peut recevoir des emails)
     * 3. Si email VÉRIFIÉ → envoie l'invitation normale avec .ics
     * 4. Si email NON VÉRIFIÉ → envoie quand même l'invitation + lien de vérification
     * 5. Si email INVALIDE → refuse et informe le recruteur
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

        // ═══════════════════════════════════════════════
        // ✅ VÉRIFICATION 1 : Format de l'email (RFC)
        // ═══════════════════════════════════════════════
        $emailValidation = Validator::make(
            ['email' => $applicant->email],
            ['email' => 'required|email:rfc,dns']
        );

        if ($emailValidation->fails()) {
            return response()->json([
                'message' => "L'adresse email du candidat « {$applicant->email} » est invalide. Impossible d'envoyer l'invitation.",
                'errors' => $emailValidation->errors(),
            ], 422);
        }

        // ═══════════════════════════════════════════════
        // ✅ VÉRIFICATION 2 : Domaine a un MX record (peut recevoir emails)
        // ═══════════════════════════════════════════════
        $emailDomain = substr(strrchr($applicant->email, "@"), 1);
        $hasMxRecord = false;

        try {
            if (function_exists('checkdnsrr')) {
                $hasMxRecord = checkdnsrr($emailDomain, 'MX');
            }
        } catch (\Exception $e) {
            \Log::warning("Erreur checkdnsrr pour {$emailDomain}: " . $e->getMessage());
        }

        // Si le domaine n'a pas de MX, c'est très probablement une fausse adresse
        if (!$hasMxRecord) {
            // Fallback : essayer avec A record (certains domaines ne déclarent pas MX)
            try {
                if (function_exists('checkdnsrr')) {
                    $hasARecord = checkdnsrr($emailDomain, 'A');
                    if ($hasARecord) {
                        $hasMxRecord = true;
                    }
                }
            } catch (\Exception $e) {
                // ignorer
            }
        }

        if (!$hasMxRecord) {
            return response()->json([
                'message' => "Le domaine « {$emailDomain} » ne peut pas recevoir d'emails. L'adresse « {$applicant->email} » est probablement invalide.",
            ], 422);
        }

        // ═══════════════════════════════════════════════
        // ✅ VÉRIFICATION 3 : Email vérifié ou non
        // ═══════════════════════════════════════════════
        $emailNotVerified = !$applicant->email_verified_at;

        // ═══════════════════════════════════════════════
        // ✅ GÉNÉRATION DU LIEN VISIO
        // ═══════════════════════════════════════════════
        $roomId = 'talentshare-' . $application->id . '-' . Str::random(10);
        $meetLink = "https://meet.jit.si/{$roomId}";

        $application->update([
            'status' => 'interview',
            'interview_at' => $data['interview_at'],
            'interview_link' => $meetLink,
        ]);

        // ═══════════════════════════════════════════════
        // ✅ ENVOI DE L'EMAIL
        // ═══════════════════════════════════════════════
               $emailSent = false;
        $emailError = null;

        try {
            // ✅ $emailNotVerified passé directement au constructeur
            $mailable = new InterviewScheduled($application->fresh(), $emailNotVerified);

            Mail::to($applicant->email)->send($mailable);
                $emailSent = true;
            \Log::info("✅ Email entretien envoyé à {$applicant->email} (vérifié: " . ($emailNotVerified ? 'NON' : 'OUI') . ")");
        } catch (\Exception $e) {
            \Log::error('❌ Erreur envoi email entretien: ' . $e->getMessage());
            $emailError = $e->getMessage();
        }
                // Envoi au recruteur (si trouvé)
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
            \Log::warning('Erreur envoi email recruteur entretien: ' . $e->getMessage());
        }

        // ═══════════════════════════════════════════════
        // ✅ NOTIFICATION INTERNE (cloche)
        // ═══════════════════════════════════════════════
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
        // ✅ RÉPONSE FINALE
        // ═══════════════════════════════════════════════
        if (!$emailSent) {
            return response()->json([
                'message' => "L'entretien a été enregistré mais l'email n'a pas pu être envoyé.",
                'error' => $emailError,
                'application' => $application->fresh(),
            ], 207); // 207 Multi-Status
        }

        return response()->json([
            'message' => $emailNotVerified
                ? "Entretien programmé. L'invitation a été envoyée à {$applicant->email} — le candidat devra confirmer son adresse email pour recevoir les prochaines communications."
                : 'Entretien programmé et invitation envoyée.',
            'warning' => $emailNotVerified ? "L'email du candidat n'est pas encore vérifié. Un rappel de vérification est inclus dans l'invitation." : null,
            'application' => $application->fresh(),
            'email_sent_to' => $applicant->email,
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