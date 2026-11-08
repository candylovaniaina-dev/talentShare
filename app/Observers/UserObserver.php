<?php

namespace App\Observers;

use App\Models\User;
use App\Models\ProfessionalProfile;

class UserObserver
{
    public function created(User $user): void
    {
        // ✅ firstOrCreate = S'il existe déjà, on ne fait rien. S'il n'existe pas, on le crée.
        ProfessionalProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'profile_type' => 'employee',
                'headline'     => $user->name ?? 'Professionnel',
                'visibility'   => 'network',
            ]
        );
    }
}