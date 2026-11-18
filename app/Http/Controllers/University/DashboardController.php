<?php

namespace App\Http\Controllers\University;

use App\Models\UniversityConvention;
use App\Models\UniversityOpportunity;
use App\Models\UniversityPartnership;
use App\Models\UniversityStudent;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** P0-19 — Dashboard Université */
class DashboardController extends BaseUniversityController
{
    public function show(Request $r)
    {
        $uni = $this->uni($r);
        $uid = $uni->id;
        $students = fn () => UniversityStudent::where('university_students.university_id', $uid);

        $total    = $students()->count();
        $verified = $students()->where('verification_status', 'verified')->count();
        $pending  = $students()->where('verification_status', 'pending')->count();
        $placed   = $students()->where('verification_status', 'verified')->whereIn('placement_status', ['internship', 'employed'])->count();
        $internships = $students()->where('placement_status', 'internship')->count();
        $employed    = $students()->where('placement_status', 'employed')->count();

        // 12 derniers mois
        $months = collect(range(11, 0))->map(fn ($i) => Carbon::now()->startOfMonth()->subMonths($i));
        $newByMonth = $students()->where('created_at', '>=', $months->first())
            ->selectRaw("to_char(created_at, 'YYYY-MM') as m, count(*) as c")->groupBy('m')->pluck('c', 'm');
        $placedByMonth = $students()->whereNotNull('placement_start')->where('placement_start', '>=', $months->first())
            ->whereIn('placement_status', ['internship', 'employed'])
            ->selectRaw("to_char(placement_start, 'YYYY-MM') as m, count(*) as c")->groupBy('m')->pluck('c', 'm');

        $trend = $months->map(fn ($d) => [
            'month'   => $d->locale('fr')->isoFormat('MMM'),
            'students' => (int) ($newByMonth[$d->format('Y-m')] ?? 0),
            'placements' => (int) ($placedByMonth[$d->format('Y-m')] ?? 0),
        ])->values();

        $byStatus = $students()->where('verification_status', 'verified')
            ->selectRaw('placement_status as status, count(*) as value')->groupBy('placement_status')->get();

        $byProgram = $students()->leftJoin('university_programs as p', 'p.id', '=', 'university_students.program_id')
            ->selectRaw("coalesce(p.name, 'Sans filière') as name, count(*) as students, sum(case when placement_status in ('internship','employed') then 1 else 0 end) as placed")
            ->groupBy('name')->orderByDesc('students')->limit(8)->get()
            ->map(fn ($x) => ['name' => $x->name, 'students' => (int) $x->students, 'placed' => (int) $x->placed]);

        $topCompanies = $students()->whereNotNull('placement_company_name')
            ->selectRaw('placement_company_name as name, count(*) as value')->groupBy('placement_company_name')
            ->orderByDesc('value')->limit(5)->get();

        // P0-19 : suivi des candidatures et missions de nos étudiants vérifiés
        $track = ['applications_sent' => 0, 'missions_active' => 0, 'missions_completed' => 0];
        try {
            $profileIds = DB::table('university_students')
                ->join('professional_profiles', 'professional_profiles.user_id', '=', 'university_students.user_id')
                ->where('university_students.university_id', $uid)
                ->where('university_students.verification_status', 'verified')
                ->pluck('professional_profiles.id');
            if ($profileIds->isNotEmpty()) {
                $track['applications_sent'] = DB::table('proposals')->whereIn('professional_profile_id', $profileIds)
                    ->whereNull('proposed_by_company_id')->where('status', '!=', 'draft')->count();
                $track['missions_active'] = DB::table('missions')->whereIn('professional_profile_id', $profileIds)
                    ->whereIn('status', ['planned', 'active', 'trial'])->count();
                $track['missions_completed'] = DB::table('missions')->whereIn('professional_profile_id', $profileIds)
                    ->where('status', 'completed')->count();
            }
        } catch (\Throwable $e) { \Log::warning('Suivi insertion: ' . $e->getMessage()); }

        return [
            'university' => ['id' => $uni->id, 'name' => $uni->name],
            'kpis' => [
                ...$track,
                'students_total'   => $total,
                'students_verified' => $verified,
                'students_pending' => $pending,
                'placed'           => $placed,
                'internships'      => $internships,
                'employed'         => $employed,
                'placement_rate'   => $verified > 0 ? round($placed / $verified * 100) : 0,
                'partners_active'  => UniversityPartnership::where('university_id', $uid)->where('status', 'active')->count(),
                'partners_pending' => UniversityPartnership::where('university_id', $uid)->where('status', 'pending')->count(),
                'opportunities'    => UniversityOpportunity::where('university_id', $uid)->where('status', 'published')->count(),
                'conventions_open' => UniversityConvention::where('university_id', $uid)->whereIn('status', ['draft', 'to_sign'])->count(),
                'conventions_signed' => UniversityConvention::where('university_id', $uid)->where('status', 'signed')->count(),
            ],
            'trend'         => $trend,
            'placement'     => $byStatus,
            'by_program'    => $byProgram,
            'top_companies' => $topCompanies,
            'pending_students' => $students()->where('verification_status', 'pending')->with('program:id,name')->latest()->limit(5)->get(['id', 'full_name', 'email', 'program_id', 'created_at']),
            'recent_students'  => $students()->with('program:id,name')->latest()->limit(6)->get(['id', 'full_name', 'program_id', 'verification_status', 'placement_status', 'created_at']),
        ];
    }
}
