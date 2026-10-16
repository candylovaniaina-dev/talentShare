<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * ✅ Providers autorisés
     */
    private const ALLOWED = ['google', 'linkedin-openid', 'facebook'];

    /**
     * ✅ Redirection vers le provider
     * GET /api/auth/{provider}/redirect
     */
    public function redirect(string $provider)
    {
        abort_unless(in_array($provider, self::ALLOWED), 404, 'Provider non supporté.');

        return Socialite::driver($provider)
            ->stateless()
            ->redirect();
    }

    /**
     * ✅ Callback OAuth
     * GET /api/auth/{provider}/callback
     */
    public function callback(string $provider)
    {
        abort_unless(in_array($provider, self::ALLOWED), 404, 'Provider non supporté.');

        $frontendUrl = config('services.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));

        try {
            // ✅ Récupérer le user depuis le provider
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            \Log::error("OAuth callback error ({$provider}): " . $e->getMessage());

            return redirect($frontendUrl . '/auth/callback?error=' . urlencode('Échec de la connexion au provider.'));
        }

        try {
            // ✅ Mapping provider pour stockage
            $providerKey = match ($provider) {
                'linkedin-openid' => 'linkedin',
                default => $provider,
            };

            // ✅ Chercher par provider_id d'abord
            $user = User::where('provider', $providerKey)
                ->where('provider_id', $socialUser->getId())
                ->first();

            // ✅ Sinon chercher par email
            if (!$user && $socialUser->getEmail()) {
                $user = User::where('email', $socialUser->getEmail())->first();

                // Si l'user existe déjà par email → on lie le provider
                if ($user) {
                    $user->update([
                        'provider'    => $providerKey,
                        'provider_id' => $socialUser->getId(),
                    ]);
                }
            }

            // ✅ Sinon créer un nouveau user
            if (!$user) {
                $user = User::create([
                    'name'              => $socialUser->getName() ?: 'Utilisateur',
                    'email'             => $socialUser->getEmail(),
                    'password'          => Hash::make(Str::random(32)), // password aléatoire
                    'role'              => 'student',                    // rôle par défaut
                    'status'            => 'active',
                    'email_verified_at' => now(),                        // email vérifié par le provider
                    'provider'          => $providerKey,
                    'provider_id'       => $socialUser->getId(),
                ]);
            }

            // ✅ Vérifier que le compte est actif
            if ($user->status !== 'active') {
                return redirect($frontendUrl . '/auth/callback?error=' . urlencode('Compte désactivé.'));
            }

            // ✅ Générer un token Sanctum
            $token = $user->createToken('talentshare')->plainTextToken;

            // ✅ Charger les relations
            $user->load(['professionalProfile', 'companies']);

            // ✅ Rediriger vers le frontend avec le token + user en JSON encodé
            $payload = urlencode(base64_encode(json_encode([
                'token' => $token,
                'user'  => $user,
            ])));

            return redirect($frontendUrl . '/auth/callback?data=' . $payload);

        } catch (\Exception $e) {
            \Log::error("OAuth process error ({$provider}): " . $e->getMessage());

            return redirect($frontendUrl . '/auth/callback?error=' . urlencode('Erreur lors de la création du compte.'));
        }
    }
}