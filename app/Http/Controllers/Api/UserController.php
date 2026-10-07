<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * ✅ Recherche d'utilisateurs (pour créer une conversation / ajouter salarié)
     */
    public function search(Request $request)
    {
        $query = User::query()
            ->where('id', '!=', $request->user()->id);

        // ✅ Recherche par email (exact)
        if ($request->filled('email')) {
            try {
                // Charge le profil SANS colonnes spécifiques (évite les erreurs 500)
                $user = $query
                    ->with('professionalProfile')
                    ->where('email', $request->email)
                    ->first();
            } catch (\Exception $e) {
                \Log::error('users/search failed: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Erreur lors de la recherche',
                    'debug' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }

            if (!$user) {
                return response()->json(['message' => 'Utilisateur introuvable.'], 404);
            }

            // ✅ Fallback intelligent pour first_name / last_name vides
            $nameParts = explode(' ', trim($user->name ?? ''), 2);
            $fallbackFirst = $nameParts[0] ?? '';
            $fallbackLast = $nameParts[1] ?? '';

            $profile = $user->professionalProfile;

            return response()->json([
                'id'            => $user->id,
                'name'          => $user->name,
                'first_name'    => $user->first_name ?: $fallbackFirst,
                'last_name'     => $user->last_name ?: $fallbackLast,
                'email'         => $user->email,
                'phone'         => $user->phone ?? $profile?->phone,
                'country'       => $user->country,
                'role'          => $user->role,
                'avatar_path'   => $profile?->avatar_path,
                'headline'      => $profile?->headline,
                'bio'           => $profile?->bio,
                'portfolio_url' => $profile?->portfolio_url,
                'linkedin_url'  => $profile?->linkedin_url,
                'github_url'    => $profile?->github_url,
            ]);
        }

        // ✅ Recherche par nom / email (like)
        if ($request->filled('q')) {
            $term = '%' . $request->q . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'ilike', $term)
                  ->orWhere('email', 'ilike', $term)
                  ->orWhere('first_name', 'ilike', $term)
                  ->orWhere('last_name', 'ilike', $term);
            });
        }

        return response()->json(
            $query->select('id', 'name', 'first_name', 'last_name', 'email', 'avatar_path', 'role')
                  ->limit(20)
                  ->get()
        );
    }

    /**
     * ✅ Suggestions d'utilisateurs
     */
    public function suggestions(Request $request)
    {
        $limit = (int) $request->get('limit', 10);

        return User::query()
            ->where('id', '!=', $request->user()->id)
            ->where('status', 'active')
            ->select('id', 'name', 'email', 'avatar_path', 'role', 'created_at')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }
}