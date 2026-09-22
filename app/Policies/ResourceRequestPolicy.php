<?php

namespace App\Policies;

use App\Models\ResourceRequest;
use App\Models\User;

class ResourceRequestPolicy
{
    /**
     * ✅ Voir une demande (public si publiée, sinon propriétaire)
     */
    public function view(?User $user, ResourceRequest $resourceRequest): bool
    {
        if ($resourceRequest->display_status === 'published') return true;
        if (!$user) return false;
        return $user->id === $resourceRequest->company?->owner_user_id
            || $user->isAdmin();
    }

    /**
     * ✅ Mettre à jour (propriétaire uniquement)
     */
    public function update(User $user, ResourceRequest $resourceRequest): bool
    {
        return $user->id === $resourceRequest->company?->owner_user_id
            || $user->isAdmin();
    }

    /**
     * ✅ Supprimer (propriétaire ou admin)
     */
    public function delete(User $user, ResourceRequest $resourceRequest): bool
    {
        return $user->id === $resourceRequest->company?->owner_user_id
            || $user->isAdmin();
    }

    /**
     * ✅ Voir les candidats (propriétaire uniquement)
     */
    public function viewCandidates(User $user, ResourceRequest $resourceRequest): bool
    {
        return $user->id === $resourceRequest->company?->owner_user_id
            || $user->isAdmin();
    }

    /**
     * ✅ Actions de statut (propriétaire uniquement)
     */
    public function changeStatus(User $user, ResourceRequest $resourceRequest): bool
    {
        return $user->id === $resourceRequest->company?->owner_user_id;
    }
}