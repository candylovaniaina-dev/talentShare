<?php

namespace App\Policies;

use App\Models\Company;
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
        return $this->hasRole($user, $company, ['owner', 'admin']);
    }

    public function delete(User $user, Company $company): bool
    {
        return $this->hasRole($user, $company, ['owner']);
    }

    public function manageMembers(User $user, Company $company): bool
    {
        return $this->hasRole($user, $company, ['owner', 'admin']);
    }

    /**
     * Admin de la plateforme et propriétaire (owner_user_id) toujours autorisés,
     * sinon on regarde le rôle dans company_members.
     */
    private function hasRole(User $user, Company $company, array $roles): bool
    {
        if ($user->role === 'admin' || $company->owner_user_id === $user->id) {
            return true;
        }

        $member = $company->members()->where('user_id', $user->id)->first();

        return $member && in_array($member->role, $roles);
    }
}