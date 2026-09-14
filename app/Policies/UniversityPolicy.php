<?php

namespace App\Policies;

use App\Models\University;
use App\Models\User;

class UniversityPolicy
{
    public function update(User $user, University $university): bool
    {
        return $user->id === $university->owner_user_id;
    }

    public function delete(User $user, University $university): bool
    {
        return $user->id === $university->owner_user_id || $user->isAdmin();
    }
}