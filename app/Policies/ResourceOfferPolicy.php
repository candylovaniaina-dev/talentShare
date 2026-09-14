<?php

namespace App\Policies;

use App\Models\ResourceOffer;
use App\Models\User;

class ResourceOfferPolicy
{
    public function update(User $user, ResourceOffer $offer): bool
    {
        return $user->id === $offer->company->owner_user_id;
    }

    public function delete(User $user, ResourceOffer $offer): bool
    {
        return $user->id === $offer->company->owner_user_id || $user->isAdmin();
    }
}