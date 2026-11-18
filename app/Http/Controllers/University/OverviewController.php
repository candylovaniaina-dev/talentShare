<?php

namespace App\Http\Controllers\University;

use App\Models\UniversityConvention;
use App\Models\UniversityMember;
use App\Models\UniversityPartnership;
use App\Models\UniversityProgram;
use App\Models\UniversityResourceInterest;
use App\Models\UniversityResourceOffer;
use App\Models\UniversityStudent;
use Illuminate\Http\Request;

/** Onglet « Accueil » et colonne latérale du profil : indicateurs, activité, complétude de la fiche. */
class OverviewController extends BaseUniversityController
{
    /** Exécute un calcul sans jamais faire échouer toute la réponse (une erreur isolée => valeur par défaut). */
    private function safe(callable $fn, $default = 0)
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            \Log::warning('Overview université : ' . $e->getMessage());
            return $default;
        }
    }

    public function show(Request $r)
    {
        $uni = $this->uni($r);
        $uid = $uni->id;

        $kpis = [
            'resources_published' => $this->safe(fn () => UniversityResourceOffer::where('university_id', $uid)->where('status', 'published')->count()),
            'requests_pending'    => $this->safe(fn () => UniversityResourceInterest::where('status', 'pending')->whereHas('offer', fn ($q) => $q->where('university_id', $uid))->count()),
            'students_verified'   => $this->safe(fn () => UniversityStudent::where('university_id', $uid)->where('verification_status', 'verified')->count()),
            'students_total'      => $this->safe(fn () => UniversityStudent::where('university_id', $uid)->count()),
            'students_pending'    => $this->safe(fn () => UniversityStudent::where('university_id', $uid)->where('verification_status', 'pending')->count()),
            'partners_active'     => $this->safe(fn () => UniversityPartnership::where('university_id', $uid)->where('status', 'active')->count()),
            'conventions_open'    => $this->safe(fn () => UniversityConvention::where('university_id', $uid)->whereIn('status', ['draft', 'to_sign'])->count()),
            'team'                => $this->safe(fn () => UniversityMember::where('university_id', $uid)->count()) + 1,
        ];

        $feed = collect();

        $this->safe(function () use ($uid, $feed) {
            UniversityResourceInterest::with(['company', 'offer'])->whereHas('offer', fn ($q) => $q->where('university_id', $uid))
                ->latest()->limit(8)->get()->each(fn ($i) => $feed->push([
                    'kind' => 'request', 'label' => 'Demande',
                    'title' => $i->offer?->title,
                    'sub' => 'Avec ' . ($i->company?->getAttribute('name') ?? 'une entreprise'),
                    'status' => $i->status, 'at' => $i->created_at,
                ]));
        });

        $this->safe(function () use ($uid, $feed) {
            UniversityResourceOffer::withCount('students')->where('university_id', $uid)->latest()->limit(8)->get()
                ->each(fn ($o) => $feed->push([
                    'kind' => 'resource', 'label' => 'Ressource',
                    'title' => $o->title,
                    'sub' => $o->students_count . ' étudiant' . ($o->students_count > 1 ? 's' : ''),
                    'status' => $o->status, 'at' => $o->created_at,
                ]));
        });

        $this->safe(function () use ($uid, $feed) {
            UniversityPartnership::with('company')->where('university_id', $uid)->latest('updated_at')->limit(6)->get()
                ->each(fn ($p) => $feed->push([
                    'kind' => 'partnership', 'label' => 'Partenariat',
                    'title' => $p->company?->getAttribute('name') ?? 'Entreprise',
                    'sub' => $p->initiated_by === 'company' ? "Demande de l'entreprise" : 'Invitation envoyée',
                    'status' => $p->status, 'at' => $p->updated_at,
                ]));
        });

        $this->safe(function () use ($uid, $feed) {
            UniversityConvention::with('student:id,full_name')->where('university_id', $uid)->latest()->limit(6)->get()
                ->each(fn ($c) => $feed->push([
                    'kind' => 'convention', 'label' => 'Convention',
                    'title' => $c->title,
                    'sub' => $c->student?->full_name,
                    'status' => $c->status, 'at' => $c->created_at,
                ]));
        });

        $checks = [
            ['key' => 'logo',        'label' => "Logo de l'établissement", 'done' => (bool) $uni->logo_path],
            ['key' => 'description', 'label' => 'Présentation',            'done' => strlen((string) $uni->description) >= 40],
            ['key' => 'contact',     'label' => 'Coordonnées',             'done' => (bool) ($uni->contact_email && $uni->phone)],
            ['key' => 'website',     'label' => 'Site web',                'done' => (bool) $uni->website],
            ['key' => 'location',    'label' => 'Géolocalisation',         'done' => $uni->latitude !== null && $uni->longitude !== null],
            ['key' => 'academic',    'label' => 'Offre académique',        'done' => (bool) $this->safe(fn () => UniversityProgram::where('university_id', $uid)->exists(), false)],
            ['key' => 'team',        'label' => 'Équipe',                  'done' => $kpis['team'] > 1],
            ['key' => 'students',    'label' => 'Étudiants rattachés',     'done' => $kpis['students_total'] > 0],
        ];
        $done = collect($checks)->where('done', true)->count();

        return [
            'kpis'         => $kpis,
            'activity'     => $feed->sortByDesc('at')->take(14)->values(),
            'completeness' => ['percent' => (int) round($done / count($checks) * 100), 'items' => $checks],
        ];
    }
}
