<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Envoie un SMS via Brevo (même compte que tes emails)
     */
    public static function send(string $phone, string $message): bool
    {
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