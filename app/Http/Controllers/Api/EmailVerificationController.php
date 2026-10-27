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

    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return $this->renderResult(false, "Lien invalide", "Le lien de vérification est invalide ou a expiré.");
    }

    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // ✅ Envoie le mail d'entretien + SMS
    $this->sendPendingInterviewEmails($user);

    return $this->renderResult(true, "Adresse vérifiée !", "Votre email est confirmé. L'invitation à l'entretien vient de vous être envoyée par email.");
}

private function renderResult(bool $success, string $title, string $message)
{
    $color = $success ? '#34D399' : '#F87171';
    $icon = $success ? '✓' : '✕';
    $frontend = env('FRONTEND_URL', 'http://localhost:5173');

    return response(<<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>{$title} | TalentShare</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; background: #0B1F33; color: #fff; padding: 24px; }
  .card { max-width: 480px; width: 100%; background: #111B35; border-radius: 24px; padding: 48px 32px; text-align: center; border: 1px solid rgba(255,255,255,0.08); }
  .icon { width: 72px; height: 72px; margin: 0 auto 24px; border-radius: 50%; background: {$color}22; color: {$color}; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; }
  h1 { font-size: 24px; margin: 0 0 12px; font-weight: 700; }
  p { color: #94A3B8; font-size: 14px; line-height: 1.7; }
  .btn { display: inline-block; margin-top: 28px; padding: 14px 32px; background: #34D399; color: #0A1229 !important; text-decoration: none; font-weight: 700; border-radius: 999px; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">{$icon}</div>
    <h1>{$title}</h1>
    <p>{$message}</p>
    <a href="{$frontend}/login" class="btn">Continuer vers la connexion</a>
  </div>
</body>
</html>
HTML
    );
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