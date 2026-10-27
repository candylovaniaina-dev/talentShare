<?php

namespace App\Policies;

use App\Models\ResourceRequest;
use App\Models\User;

class ResourceRequestPolicy
{
    /**
     * ✅ Voir une demande
     */
    public function view(?User $user, ResourceRequest $resourceRequest): bool
    {
        if ($resourceRequest->display_status === 'published') return true;
        if (!$user) return false;
        
        return $this->isOwner($user, $resourceRequest) || $user->isAdmin();
    }

    /**
     * ✅ Mettre à jour (propriétaire uniquement)
     */
    public function update(User $user, ResourceRequest $resourceRequest): bool
    {
        return $this->isOwner($user, $resourceRequest) || $user->isAdmin();
    }

    /**
     * ✅ Supprimer (propriétaire ou admin)
     */
    public function delete(User $user, ResourceRequest $resourceRequest): bool
    {
        return $this->isOwner($user, $resourceRequest) || $user->isAdmin();
    }

    /**
     * ✅ Voir les candidats (propriétaire uniquement)
     */
    public function viewCandidates(User $user, ResourceRequest $resourceRequest): bool
    {
        return $this->isOwner($user, $resourceRequest) || $user->isAdmin();
    }

    /**
     * ✅ Actions de statut (propriétaire uniquement)
     */
    public function changeStatus(User $user, ResourceRequest $resourceRequest): bool
    {
        return $this->isOwner($user, $resourceRequest);
    }

    /**
     * ✅ Helper : vérifie si l'utilisateur est le créateur OU le propriétaire de l'entreprise
     */
    private function isOwner(User $user, ResourceRequest $resourceRequest): bool
    {
        // 1. Si c'est un talent qui a créé la demande
        if ($user->id === $resourceRequest->created_by) {
            return true;
        }

        // 2. Si c'est une entreprise qui possède la demande
        if ($resourceRequest->company && $user->id === $resourceRequest->company->owner_user_id) {
            return true;
        }

        return false;
    }
}