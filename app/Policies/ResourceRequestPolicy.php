<?php

namespace App\Policies;

use App\Models\ResourceRequest;
use App\Models\User;

class ResourceRequestPolicy
{
    public function update(User $user, ResourceRequest $resourceRequest): bool
    {
        return $user->id === $resourceRequest->company->owner_user_id;
    }

    public function delete(User $user, ResourceRequest $resourceRequest): bool
    {
        return $user->id === $resourceRequest->company->owner_user_id || $user->isAdmin();
    }

    public function viewCandidates(User $user, ResourceRequest $resourceRequest): bool
    {
        return $user->id === $resourceRequest->company->owner_user_id;
    }
}