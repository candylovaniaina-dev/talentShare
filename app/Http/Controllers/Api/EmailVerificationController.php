<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\InterviewScheduled;
use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        // Vérifie le hash
        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Lien invalide.'], 403);
        }

        // Marque comme vérifié
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        // ═══════════════════════════════════════════════
        // ✅ ÉTAPE CLÉ : Envoyer les emails d'entretien EN ATTENTE
        // ═══════════════════════════════════════════════
        $this->sendPendingInterviewEmails($user);

        return response()->json(['message' => 'Email vérifié.']);
    }

    /**
     * Envoie tous les emails d'entretien en attente pour cet utilisateur
     */
    protected function sendPendingInterviewEmails(User $user)
    {
        // Récupère les candidatures du user où un entretien est programmé
        // et dont l'email n'a pas encore été envoyé
        $pendingApplications = Application::whereHas('profile', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->where('status', 'interview')
        ->whereNotNull('interview_at')
        ->whereNotNull('interview_link')
        ->get();

        foreach ($pendingApplications as $application) {
            try {
                $application->load('jobOffer.company', 'profile.user');

                Mail::to($user->email)->send(
                    new InterviewScheduled($application, false)   // false = email vérifié
                );

                \Log::info("✅ Email entretien (post-vérif) envoyé à {$user->email} pour candidature #{$application->id}");

                // SMS si téléphone
                if (!empty($user->phone)) {
                    $interviewDate = $application->interview_at
                        ->locale('fr')
                        ->isoFormat('dddd D MMMM [à] HH:mm');

                    $smsMessage = "🎉 Félicitations {$user->name} ! "
                        . "Votre entretien avec {$application->jobOffer->company?->name} "
                        . "est prévu le {$interviewDate}. "
                        . "Lien visio : {$application->interview_link}";

                    \App\Services\SmsService::send($user->phone, $smsMessage);
                }

            } catch (\Exception $e) {
                \Log::error("❌ Erreur envoi email entretien post-vérif pour app #{$application->id}: " . $e->getMessage());
            }
        }
    }

    public function resend(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email déjà vérifié.']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email de vérification renvoyé.']);
    }
}