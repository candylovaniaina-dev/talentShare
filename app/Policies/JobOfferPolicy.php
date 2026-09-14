<?php

namespace App\Policies;

use App\Models\JobOffer;
use App\Models\User;

class JobOfferPolicy
{
    public function update(User $user, JobOffer $jobOffer): bool
    {
        return $user->id === $jobOffer->company->owner_user_id;
    }

    public function delete(User $user, JobOffer $jobOffer): bool
    {
        return $user->id === $jobOffer->company->owner_user_id || $user->isAdmin();
    }

    public function viewApplications(User $user, JobOffer $jobOffer): bool
    {
        return $user->id === $jobOffer->company->owner_user_id;
    }
}