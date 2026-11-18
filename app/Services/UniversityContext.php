<?php

namespace App\Services;

use App\Models\University;
use App\Models\UniversityMember;
use App\Models\User;

class UniversityContext
{
    /**
     * Retourne ['university' => University, 'role' => 'owner'|'admin'|'internship_office'|'teacher'|'viewer']
     * ou null si le compte n'est rattaché à aucun établissement.
     */
    public static function resolve(User $user): ?array
    {
        $owned = University::where('user_id', $user->id)->first();
        if ($owned) {
            return ['university' => $owned, 'role' => 'owner'];
        }

        $member = UniversityMember::with('university')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        return ($member && $member->university)
            ? ['university' => $member->university, 'role' => $member->role]
            : null;
    }
}
