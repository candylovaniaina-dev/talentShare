<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * ⚠️ Flag global : passe à true quand tu veux activer les SMS
     *    - false = SMS désactivés (aucun envoi, juste un log)
     *    - true  = SMS activés (envoi via Brevo)
     */
    private static $enabled = false;

    /**
     * ✅ Activer / désactiver les SMS dynamiquement
     */
    public static function setEnabled(bool $enabled): void
    {
        self::$enabled = $enabled;
    }

    /**
     * ✅ Vérifie si les SMS sont activés
     */
    public static function isEnabled(): bool
    {
        return self::$enabled;
    }

    /**
     * Envoie un SMS via Brevo
     */
    public static function send(string $phone, string $message): bool
    {
        // ✅ Si désactivé → on n'envoie rien, juste un log
        if (!self::$enabled) {
            Log::info("📱 SMS désactivé (flag). Destinataire: {$phone} | Message: " . mb_substr($message, 0, 50));
            return false;
        }

        $apiKey = env('BREVO_API_KEY');

        if (!$apiKey) {
            Log::warning('SMS non envoyé : BREVO_API_KEY manquante dans .env');
            return false;
        }

        // Normaliser le numéro (retirer espaces, tirets, parenthèses)
        $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // Ajouter indicatif Madagascar si absent (ex: 034xxxxxxx → +26134xxxxxxx)
        if (preg_match('/^0/', $phone)) {
            $phone = '+261' . substr($phone, 1);
        } elseif (!preg_match('/^\+/', $phone)) {
            $phone = '+261' . $phone;
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post('https://api.brevo.com/v3/transactionalSMS/sms', [
                'sender' => 'TalentShare',
                'recipient' => $phone,
                'content' => $message,
                'type' => 'transactional',
            ]);

            if ($response->successful()) {
                Log::info("✅ SMS envoyé à {$phone}");
                return true;
            }

            Log::error("❌ Erreur SMS Brevo: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("❌ Exception SMS: " . $e->getMessage());
            return false;
        }
    }
}