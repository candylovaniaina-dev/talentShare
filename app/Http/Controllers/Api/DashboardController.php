<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Proposal;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return match ($user->role) {
            'company' => $this->companyDashboard($user),
            'employee', 'student' => $this->talentDashboard($user),
            'university' => $this->universityDashboard($user),
            'admin' => $this->adminDashboard(),
            default => response()->json(['message' => 'Rôle non pris en charge.'], 400),
        };
    }

    private function companyDashboard($user)
    {
        $companyIds = $user->companies()->pluck('id');

        // ✅ FIX : regrouper la condition OR avant d'appliquer le WHERE status
        $activeMissions = Mission::where(function ($q) use ($companyIds) {
                $q->whereIn('requesting_company_id', $companyIds)
                  ->orWhereIn('supplying_company_id', $companyIds);
            })
            ->where('status', 'active')
            ->count();

        // ✅ NOUVEAU : missions en attente (pour l'entreprise)
        $pendingMissions = Mission::where(function ($q) use ($companyIds) {
                $q->whereIn('requesting_company_id', $companyIds)
                  ->orWhereIn('supplying_company_id', $companyIds);
            })
            ->whereIn('status', ['pending_employee', 'planned'])
            ->count();

        return response()->json([
            'companies_count'         => $companyIds->count(),
            'resource_requests_open'  => \App\Models\ResourceRequest::whereIn('company_id', $companyIds)->where('status', 'published')->count(),
            'proposals_received'      => Proposal::whereHas('resourceRequest', fn ($q) => $q->whereIn('company_id', $companyIds))->count(),
            'active_missions'         => $activeMissions,       // ✅ Corrigé
            'pending_missions'        => $pendingMissions,      // ✅ Nouveau
            'job_offers_open'         => \App\Models\JobOffer::whereIn('company_id', $companyIds)->where('status', 'published')->count(),
        ]);
    }

    private function talentDashboard($user)
    {
        $profile = $user->professionalProfile;

        // ✅ FIX : regrouper la condition
        $activeMissions = $profile
            ? Mission::where('professional_profile_id', $profile->id)
                ->where('status', 'active')
                ->count()
            : 0;

        // ✅ NOUVEAU : missions en attente d'acceptation par le salarié
        $pendingMissions = $profile
            ? Mission::where('professional_profile_id', $profile->id)
                ->where('status', 'pending_employee')
                ->count()
            : 0;

        return response()->json([
            'has_profile'          => (bool) $profile,
            'has_portfolio'        => (bool) $profile?->portfolio,
            'skills_count'         => $profile?->skills()->count() ?? 0,
            'applications_count'   => $profile?->applications()->count() ?? 0,
            'active_missions'      => $activeMissions,
            'pending_missions'     => $pendingMissions,   // ✅ Nouveau (badge "action requise")
            'proposals_pending'    => $profile
                ? Proposal::where('professional_profile_id', $profile->id)
                    ->whereIn('status', ['sent', 'viewed'])
                    ->count()
                : 0,
        ]);
    }

    private function universityDashboard($user)
    {
        $universityIds = $user->universities()->pluck('id');

        return response()->json([
            'universities_count' => $universityIds->count(),
        ]);
    }

    private function adminDashboard()
    {
        return response()->json([
            'users_count'           => \App\Models\User::count(),
            'companies_count'       => \App\Models\Company::count(),
            'universities_count'    => \App\Models\University::count(),
            'missions_count'        => Mission::count(),
            'pending_verifications' => \App\Models\VerificationRequest::where('status', 'pending')->count(),
        ]);
    }
}