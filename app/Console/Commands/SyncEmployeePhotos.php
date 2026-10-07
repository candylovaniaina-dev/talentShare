<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\ProfessionalProfile;
use Illuminate\Console\Command;

class SyncEmployeePhotos extends Command
{
    protected $signature = 'sync:employee-photos';
    protected $description = 'Synchronise employees.photo_path vers professional_profiles.avatar_path';

    public function handle()
    {
        $employees = Employee::whereNotNull('user_id')
            ->whereNotNull('photo_path')
            ->get();

        $synced = 0;
        foreach ($employees as $emp) {
            $profile = ProfessionalProfile::where('user_id', $emp->user_id)->first();
            if ($profile && !$profile->avatar_path) {
                $profile->update(['avatar_path' => $emp->photo_path]);
                $this->info("✅ Synced: user_id={$emp->user_id} → {$emp->photo_path}");
                $synced++;
            }
        }

        $this->info("Terminé. {$synced} profil(s) synchronisé(s).");
    }
}