<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Company $company): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['company', 'admin']);
    }

    public function update(User $user, Company $company): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $member = $company->members()->where('user_id', $user->id)->first();
        return $member && in_array($member->role, ['owner', 'admin']);
    }

    public function delete(User $user, Company $company): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $member = $company->members()->where('user_id', $user->id)->first();
        return $member && $member->role === 'owner';
    }

    // 👇 AJOUTE CETTE MÉTHODE
    public function manageMembers(User $user, Company $company): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $member = $company->members()->where('user_id', $user->id)->first();
        return $member && in_array($member->role, ['owner', 'admin']);
    }
}