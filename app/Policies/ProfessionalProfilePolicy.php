<?php

namespace App\Policies;

use App\Models\ProfessionalProfile;
use App\Models\User;

class ProfessionalProfilePolicy
{
    /**
     * ✅ Voir un profil selon sa visibilité (FB-like)
     */
    public function view(?User $user, ProfessionalProfile $profile): bool
    {
        // 1) Owner → toujours
        if ($user && $user->id === $profile->user_id) {
            return true;
        }

        // 2) Admin → toujours
        if ($user && $user->isAdmin()) {
            return true;
        }

        // 3) Public → toujours
        if ($profile->visibility === 'public') {
            return true;
        }

        // 4) Network → seulement si connecté
        if ($profile->visibility === 'network') {
            return $user !== null;
        }

        // 5) Private → seulement si relation existante
        if ($profile->visibility === 'private') {
            if (!$user) return false;

            // Check : mission commune ?
            $hasMission = \App\Models\Mission::where('professional_profile_id', $profile->id)
                ->where(function ($q) use ($user) {
                    $companyIds = $user->companies()->pluck('id');
                    $q->whereIn('supplying_company_id', $companyIds)
                      ->orWhereIn('requesting_company_id', $companyIds);
                })
                ->exists();

            if ($hasMission) return true;

            // Check : conversation existante ?
            $hasConversation = \App\Models\Conversation::whereHas('participants', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->whereHas('participants', function ($q) use ($profile) {
                $q->where('users.id', $profile->user_id);
            })->exists();

            if ($hasConversation) return true;

            return false;
        }

        return false;
    }

    /**
     * ✅ Mettre à jour son propre profil uniquement
     */
    public function update(User $user, ProfessionalProfile $profile): bool
    {
        return $user->id === $profile->user_id;
    }

    /**
     * ✅ Supprimer son propre profil uniquement
     */
    public function delete(User $user, ProfessionalProfile $profile): bool
    {
        return $user->id === $profile->user_id;
    }
}