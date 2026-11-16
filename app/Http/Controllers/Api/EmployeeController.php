<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Mission;
use App\Models\User;
use App\Services\ContractService;
use App\Services\TalentMarketService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    private const TYPES = ['internship', 'apprenticeship', 'fixed_term', 'permanent'];

    /**
     * Liste des salariés (les contrats terminés sont masqués sauf ?with_ended=1)
     * ✅ Ajout de la synchronisation prêteur / emprunteur
     */
    public function index(Request $request, Company $company)
    {
        $this->authorizeCompany($request, $company);

        $employees = $company->employees()
            ->with('user.professionalProfile')
            ->when(!$request->boolean('with_ended'), function ($q) {
                // ✅ On masque les employés "inactive" (au lieu de "ended")
                $q->where(fn ($qq) => $qq->whereNull('status')->orWhere('status', '!=', 'inactive'));
            })
            ->latest()
            ->get();

        // ✅ On récupère l'ID du profil pro pour chaque salarié
        $employees->each(fn ($e) => $e->professional_profile_id = $e->user?->professionalProfile?->id);

        // ✅ SYNCHRO : On récupère les missions de prêt pour ces profils
        $market = app(TalentMarketService::class);
        $pids   = $employees->pluck('professional_profile_id')->filter()->unique()->values()->all();
        $loans  = $pids ? $market->missionsByProfile($pids, true) : collect();

        // ✅ On injecte les infos de prêt dans chaque salarié
        $employees->each(function ($e) use ($market, $loans) {
            if (!$e->professional_profile_id) return;
            
            $info = $market->resolve($loans->get($e->professional_profile_id));
            $m    = $info['mission'] ?? null;
            
            if ($m && $info['state'] !== 'available') {
                $e->setAttribute('on_loan_to', $m->requestingCompany?->name ?? 'Entreprise externe');
                $e->setAttribute('on_loan_until', $m->end_at?->toDateString());
                $e->setAttribute('on_loan_state', $info['state']);
            }
        });

        return response()->json(['data' => $employees]);
    }

  public function store(Request $request, Company $company)
{
    $this->authorizeCompany($request, $company);

    $data = $request->validate([
        'email'         => ['required', 'email', 'max:255'],
        'first_name'    => ['required', 'string', 'max:100'],
        'last_name'     => ['required', 'string', 'max:100'],
        'position'      => ['nullable', 'string', 'max:150'],
        'phone'         => ['nullable', 'string', 'max:30'],
        'contract_type' => ['nullable', Rule::in(self::TYPES)],
        'start_date'    => ['nullable', 'date'],
        'end_date'      => ['nullable', 'date'],
        'photo'         => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // ✅ AJOUT
    ]);

    $type  = $data['contract_type'] ?? 'permanent';
    $start = Carbon::parse($data['start_date'] ?? now())->startOfDay();

    if ($type === 'permanent') {
        $end = null;
    } elseif (!empty($data['end_date'])) {
        $end = Carbon::parse($data['end_date'])->startOfDay();
        if ($end->lt($start)) {
            return response()->json(['message' => 'La date de fin doit être après la date de début.'], 422);
        }
    } else {
        $end = $start->copy()->addMonths(ContractService::DEFAULT_MONTHS[$type]);
    }

    $user = User::where('email', $data['email'])->first();

    $existingEmployee = $company->employees()
        ->withTrashed()
        ->where(function ($q) use ($data, $user) {
            $q->where('email', $data['email']);
            if ($user) $q->orWhere('user_id', $user->id);
        })
        ->first();

    if ($existingEmployee) {
        if ($existingEmployee->trashed()) {
            $existingEmployee->restore();
            
            // ✅ Sauvegarde de la photo si elle est envoyée
            $photoPath = $existingEmployee->photo_path;
            if ($request->hasFile('photo')) {
                if ($photoPath) Storage::disk('public')->delete($photoPath); // Supprime l'ancienne
                $photoPath = $request->file('photo')->store('employees/photos', 'public');
            }

            $existingEmployee->update([
                'first_name'    => $data['first_name'],
                'last_name'     => $data['last_name'],
                'position'      => $data['position'] ?: ($user?->professionalProfile?->headline ?: 'Collaborateur'),
                'phone'         => $data['phone'] ?? null,
                'contract_type' => $type,
                'start_date'    => $start->toDateString(),
                'end_date'      => $end?->toDateString(),
                'status'        => 'active',
                'photo_path'    => $photoPath, // ✅ Mise à jour
            ]);
            
            return response()->json([
                'message' => 'Salarié réintégré avec succès.',
                'data'    => $existingEmployee->load('user.professionalProfile'),
            ], 200);
        }

        return response()->json(['message' => 'Ce salarié fait déjà partie de votre équipe active.'], 409);
    }

    // ✅ Sauvegarde de la photo
    $photoPath = null;
    if ($request->hasFile('photo')) {
        $photoPath = $request->file('photo')->store('employees/photos', 'public');
    }

    $employee = $company->employees()->create([
        'user_id'       => $user?->id,
        'has_account'   => (bool) $user,
        'email'         => $data['email'],
        'first_name'    => $data['first_name'],
        'last_name'     => $data['last_name'],
        'position'      => $data['position'] ?? null,
        'phone'         => $data['phone'] ?? null,
        'status'        => 'active',
        'contract_type' => $type,
        'start_date'    => $start->toDateString(),
        'end_date'      => $end?->toDateString(),
        'photo_path'    => $photoPath, // ✅ Enregistrement en base
    ]);

    return response()->json([
        'message' => 'Salarié ajouté.',
        'data'    => $employee->load('user.professionalProfile'),
    ], 201);
}
    public function update(Request $request, Company $company, Employee $employee)
    {
        $this->authorizeCompany($request, $company);
        $this->ensureBelongs($company, $employee);

        $data = $request->validate([
            'position'      => ['sometimes', 'nullable', 'string', 'max:150'],
            'phone'         => ['sometimes', 'nullable', 'string', 'max:30'],
            'first_name'    => ['sometimes', 'string', 'max:100'],
            'last_name'     => ['sometimes', 'string', 'max:100'],
            // ✅ On autorise 'inactive' (au lieu de 'ended')
            'status'        => ['sometimes', Rule::in(['active', 'trial', 'inactive'])],
            'contract_type' => ['sometimes', Rule::in(self::TYPES)],
            'start_date'    => ['sometimes', 'nullable', 'date'],
            'end_date'      => ['sometimes', 'nullable', 'date'],
        ]);

        $type  = $data['contract_type'] ?? $employee->contract_type ?? 'permanent';
        $start = $data['start_date'] ?? $employee->start_date;

        if ($type === 'permanent') {
            $data['end_date'] = null;
        } elseif (!array_key_exists('end_date', $data) && isset($data['contract_type']) && $start) {
            $data['end_date'] = Carbon::parse($start)
                ->addMonths(ContractService::DEFAULT_MONTHS[$type])
                ->toDateString();
        }

        $employee->update($data);

        return response()->json([
            'message' => 'Salarié mis à jour.',
            'data'    => $employee->fresh('user.professionalProfile'),
        ]);
    }

    public function destroy(Request $request, Company $company, Employee $employee)
    {
        $this->authorizeCompany($request, $company);
        $this->ensureBelongs($company, $employee);

        $employee->delete();

        return response()->json(['message' => 'Salarié retiré.']);
    }

    public function uploadPhoto(Request $request, Company $company, Employee $employee)
    {
        $this->authorizeCompany($request, $company);
        $this->ensureBelongs($company, $employee);

        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($employee->photo_path) {
            Storage::disk('public')->delete($employee->photo_path);
        }

        $path = $request->file('photo')->store('employees/photos', 'public');
        
        // 1. On met à jour l'employé
        $employee->update(['photo_path' => $path]);

        // 2. ✅ On met à jour l'utilisateur associé (avatar_path)
        if ($employee->user_id) {
            $user = User::find($employee->user_id);
            if ($user) {
                $oldAvatar = $user->avatar_path;
                $user->update(['avatar_path' => $path]);
                
                // Nettoyage de l'ancienne photo si différente
                if ($oldAvatar && $oldAvatar !== $path && Storage::disk('public')->exists($oldAvatar)) {
                    Storage::disk('public')->delete($oldAvatar);
                }
            }
        }

        return response()->json([
            'message' => 'Photo mise à jour.',
            'data'    => $employee->fresh(),
        ]);
    }

    /**
     * ✅ Talents empruntés par cette entreprise (point de vue de l'EMPRUNTEUR).
     * Renvoie tout ce qu'il faut pour la section « Talents empruntés » et sa modale.
     */
    public function borrowed(Request $request, Company $company)
    {
        $this->authorizeCompany($request, $company);

        $data = Mission::where('requesting_company_id', $company->id)
            ->whereNotNull('supplying_company_id')
            ->whereIn('status', TalentMarketService::OCCUPYING)
            ->with([
                'profile.user:id,name',
                'profile.portfolio',
                'supplyingCompany:id,name,logo_path,city,owner_user_id',
                'resourceOffer',
            ])
            ->latest()->get()
            ->map(function ($m) {
                $profile = $m->profile;
                $user    = $profile?->user;
                $name    = (string) $user?->name;
                $offer   = $m->resourceOffer;

                // Vrai poste dans l'entreprise prêteuse (et jamais le nom de la personne)
                $position = $user
                    ? Employee::where('company_id', $m->supplying_company_id)->where('user_id', $user->id)->value('position')
                    : null;

                $clean = function ($v) use ($name) {
                    $v = trim((string) $v);
                    return ($v !== '' && strcasecmp($v, $name) !== 0 && $v !== 'Professionnel') ? $v : null;
                };

                $headline = $clean($position) ?? $clean($profile?->headline) ?? $clean($m->title);

                $pf = $profile?->portfolio;
                $portfolioSlug = ($pf && $pf->public_slug && $pf->visibility === 'public') ? $pf->public_slug : null;

                return [
                    'id'               => $m->id,
                    'title'            => $m->title,
                    'status'           => $m->status,
                    'lender'           => $m->supplyingCompany?->name,          // gardé pour compatibilité
                    'lender_company'   => [
                        'id'            => $m->supplyingCompany?->id,
                        'name'          => $m->supplyingCompany?->name,
                        'logo_url'      => $m->supplyingCompany?->logo_url,
                        'city'          => $m->supplyingCompany?->city,
                        'owner_user_id' => $m->supplyingCompany?->owner_user_id,
                    ],
                    'start_at'         => $m->start_at?->toDateString(),
                    'end_at'           => $m->end_at?->toDateString(),
                    'workload_percent' => $m->workload_percent,
                    'remote'           => (bool) $m->remote,
                    'offer_id'         => $offer?->id,
                    'daily_rate'       => $offer?->daily_rate,
                    'location_type'    => $offer?->location_type,
                    'location_city'    => $offer?->location_city,
                    'conditions'       => $offer?->conditions,
                    'talent'           => [
                        'profile_id'     => $profile?->id,
                        'name'           => $user?->name,
                        'headline'       => $headline,
                        'avatar_url'     => $profile?->avatar_path ? url('/storage/' . $profile->avatar_path) : null,
                        'portfolio_slug' => $portfolioSlug,
                    ],
                ];
            })->values();

        return response()->json(['data' => $data]);
    }

    private function authorizeCompany(Request $request, Company $company): void
    {
        abort_unless(
            $request->user()->companies()->where('id', $company->id)->exists(),
            403,
            'Vous ne gérez pas cette entreprise.'
        );
    }

    private function ensureBelongs(Company $company, Employee $employee): void
    {
        abort_unless($employee->company_id === $company->id, 404);
    }
}