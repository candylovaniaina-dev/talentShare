<?php

namespace App\Policies;

use App\Models\University;
use App\Models\User;

class UniversityPolicy
{
    /**
     * Peut voir la liste des universités : tout le monde.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Peut voir une université : tout le monde.
     */
    public function view(?User $user, University $university): bool
    {
        return true;
    }

    /**
     * Peut créer une université : tout utilisateur authentifié.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Peut modifier une université : uniquement le propriétaire.
     */
    public function update(User $user, University $university): bool
    {
        return $user->id === $university->owner_user_id;
    }

    /**
     * Peut supprimer une université : uniquement le propriétaire.
     */
    public function delete(User $user, University $university): bool
    {
        return $user->id === $university->owner_user_id;
    }

    /**
     * Peut restaurer une université (soft delete).
     */
    public function restore(User $user, University $university): bool
    {
        return $user->id === $university->owner_user_id;
    }

    /**
     * Peut supprimer définitivement : personne (sauf admin plus tard).
     */
    public function forceDelete(User $user, University $university): bool
    {
        return false;
    }
}