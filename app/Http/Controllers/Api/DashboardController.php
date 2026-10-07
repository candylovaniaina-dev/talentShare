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

        $activeMissions = Mission::where(function ($q) use ($companyIds) {
                $q->whereIn('requesting_company_id', $companyIds)
                  ->orWhereIn('supplying_company_id', $companyIds);
            })
            ->where('status', 'active')
            ->count();

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
            'active_missions'         => $activeMissions,
            'pending_missions'        => $pendingMissions,
            'job_offers_open'         => \App\Models\JobOffer::whereIn('company_id', $companyIds)->where('status', 'published')->count(),
        ]);
    }

    private function talentDashboard($user)
    {
        $profile = $user->professionalProfile;

        $activeMissions = $profile
            ? Mission::where('professional_profile_id', $profile->id)
                ->where('status', 'active')
                ->count()
            : 0;

        $pendingMissions = $profile
            ? Mission::where('professional_profile_id', $profile->id)
                ->where('status', 'pending_employee')
                ->count()
            : 0;

        // ✅ CALCULER LA COMPLÉTION RÉELLE
        $completion = $this->calculateProfileCompletion($profile);

        return response()->json([
            'has_profile'          => (bool) $profile,
            'has_portfolio'        => (bool) $profile?->portfolio,
            'skills_count'         => $profile?->skills()->count() ?? 0,
            'applications_count'   => $profile?->applications()->count() ?? 0,
            'active_missions'      => $activeMissions,
            'pending_missions'     => $pendingMissions,
            'proposals_pending'    => $profile
                ? Proposal::where('professional_profile_id', $profile->id)
                    ->whereIn('status', ['sent', 'viewed'])
                    ->count()
                : 0,

            // ✅ NOUVEAU : Complétion + détails
            'completion'           => $completion['score'],
            'completion_breakdown' => $completion['breakdown'],
            'completion_next_step' => $completion['next_step'],
        ]);
    }

    /**
     * ✅ Calcule la complétion réelle du profil
     * Retourne : score global, détails par section, prochaine action suggérée
     */
    private function calculateProfileCompletion($profile)
    {
        if (!$profile) {
            return [
                'score' => 0,
                'breakdown' => [],
                'next_step' => 'Créer votre profil professionnel',
            ];
        }

        // ✅ Poids de chaque section (total = 100)
        $sections = [
            'identity' => [
                'label' => 'Identité de base',
                'weight' => 15,
                'done' => (bool) ($profile->headline && $profile->user?->name),
                'action' => 'Ajouter un titre professionnel',
            ],
            'avatar' => [
                'label' => 'Photo de profil',
                'weight' => 10,
                'done' => (bool) $profile->avatar_path,
                'action' => 'Ajouter une photo de profil',
            ],
            'bio' => [
                'label' => 'Bio / Présentation',
                'weight' => 10,
                'done' => (bool) ($profile->bio && strlen($profile->bio) > 30),
                'action' => 'Rédiger une bio (30+ caractères)',
            ],
            'location' => [
                'label' => 'Localisation',
                'weight' => 5,
                'done' => (bool) ($profile->city || $profile->country),
                'action' => 'Renseigner votre ville',
            ],
            'cv' => [
                'label' => 'CV',
                'weight' => 10,
                'done' => (bool) $profile->cv_path,
                'action' => 'Téléverser votre CV',
            ],
            'skills' => [
                'label' => 'Compétences (3 minimum)',
                'weight' => 15,
                'done' => $profile->skills()->count() >= 3,
                'action' => 'Ajouter au moins 3 compétences',
            ],
            'experiences' => [
                'label' => 'Expériences',
                'weight' => 10,
                'done' => $profile->experiences()->count() > 0,
                'action' => 'Ajouter une expérience (projets universitaires comptent)',
            ],
            'educations' => [
                'label' => 'Formations',
                'weight' => 10,
                'done' => $profile->educations()->count() > 0,
                'action' => 'Ajouter une formation',
            ],
            'portfolio' => [
                'label' => 'Portfolio créé',
                'weight' => 10,
                'done' => (bool) $profile->portfolio,
                'action' => 'Créer votre portfolio',
            ],
            'availability' => [
                'label' => 'Disponibilités',
                'weight' => 5,
                'done' => $profile->availabilityWindows()->count() > 0,
                'action' => 'Ajouter vos disponibilités',
            ],
        ];

        // ✅ Calcul du score
        $totalWeight = array_sum(array_column($sections, 'weight'));
        $earnedWeight = 0;
        $breakdown = [];

        foreach ($sections as $key => $section) {
            if ($section['done']) {
                $earnedWeight += $section['weight'];
            }
            $breakdown[] = [
                'key' => $key,
                'label' => $section['label'],
                'done' => $section['done'],
                'weight' => $section['weight'],
                'action' => $section['action'],
            ];
        }

        $score = $totalWeight > 0 ? round(($earnedWeight / $totalWeight) * 100) : 0;

        // ✅ Prochaine action prioritaire (première section non complétée)
        $nextStep = null;
        foreach ($breakdown as $section) {
            if (!$section['done']) {
                $nextStep = $section['action'];
                break;
            }
        }

        return [
            'score' => $score,
            'breakdown' => $breakdown,
            'next_step' => $nextStep ?? 'Votre profil est complet ! 🎉',
        ];
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