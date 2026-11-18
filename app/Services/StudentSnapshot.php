<?php

namespace App\Services;

use App\Models\UniversityStudent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Vue consolidée du profil d'un étudiant rattaché (profil, compétences, disponibilité, portfolio, missions).
 * Défensif : une section reste vide si la table ou la colonne n'existe pas.
 */
class StudentSnapshot
{
    public static function for(UniversityStudent $student): array
    {
        $out = ['profile' => null, 'skills' => [], 'availability' => null, 'portfolio_slug' => null, 'missions' => ['count' => 0, 'recent' => []]];
        if (! $student->user_id || ! Schema::hasTable('professional_profiles')) {
            return $out;
        }

        $profile = DB::table('professional_profiles')->where('user_id', $student->user_id)->first();
        if (! $profile) {
            return $out;
        }
        $out['profile'] = (array) $profile;
        $pid = $profile->id;

        // Compétences
        if (Schema::hasTable('profile_skills') && Schema::hasTable('skills')
            && Schema::hasColumn('profile_skills', 'professional_profile_id') && Schema::hasColumn('profile_skills', 'skill_id')) {
            $out['skills'] = DB::table('profile_skills')->join('skills', 'skills.id', '=', 'profile_skills.skill_id')
                ->where('profile_skills.professional_profile_id', $pid)->limit(30)->pluck('skills.name')->all();
        }

        // Disponibilité et portfolio : tables annexes, sondées sans supposer leurs colonnes exactes
        foreach (['availabilities', 'availability'] as $t) {
            if (Schema::hasTable($t) && Schema::hasColumn($t, 'professional_profile_id')) {
                $row = DB::table($t)->where('professional_profile_id', $pid)->orderByDesc('id')->first();
                $out['availability'] = $row ? (array) $row : null;
                break;
            }
        }
        foreach (['portfolios', 'portfolio'] as $t) {
            if (Schema::hasTable($t) && Schema::hasColumn($t, 'professional_profile_id') && Schema::hasColumn($t, 'public_slug')) {
                $out['portfolio_slug'] = DB::table($t)->where('professional_profile_id', $pid)->value('public_slug');
                break;
            }
        }

        // Missions / stages (table missions : professional_profile_id, start_at, end_at, status)
        if (Schema::hasTable('missions') && Schema::hasColumn('missions', 'professional_profile_id')) {
            $q = DB::table('missions')->where('professional_profile_id', $pid);
            $out['missions']['count'] = (clone $q)->count();
            $names = DB::table('companies')->pluck('name', 'id');
            $out['missions']['recent'] = $q->orderByDesc('id')->limit(5)->get()->map(fn ($m) => [
                'id'         => $m->id,
                'title'      => 'Mission chez ' . ($names[$m->requesting_company_id ?? 0] ?? 'une entreprise'),
                'status'     => $m->status ?? null,
                'start_date' => $m->start_at ?? null,
                'end_date'   => $m->end_at ?? null,
            ])->all();
        }

        return $out;
    }
}
