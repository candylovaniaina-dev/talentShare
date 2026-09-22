<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\CompanyRequest;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\Employee;
use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    /**
     * Liste des entreprises (public)
     */
    public function index()
    {
        return Company::query()
            ->latest()
            ->paginate(request('per_page', 15));
    }

    /**
     * Détails d'une entreprise (public)
     */
    public function show(Company $company)
    {
        return $company->load(['owner', 'members.user']);
    }

    /**
     * ✅ Récupérer MON entreprise (la plus récente)
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié'], 401);
        }

        $company = Company::where('owner_user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$company) {
            return response()->json(['message' => 'Entreprise non trouvée'], 404);
        }

        return response()->json($company);
    }

    /**
     * ✅ NOUVEAU : Toutes MES entreprises
     * Route : GET /companies/my/all
     */
    public function myCompanies(Request $request)
    {
        return $request->user()->companies()
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * ✅ NOUVEAU : Tous MES salariés (toutes mes entreprises)
     * Route : GET /companies/me/employees
     */
    public function myEmployees(Request $request)
    {
        try {
            $user = $request->user();
            $companyIds = $user->companies()->pluck('id')->toArray();

            if (empty($companyIds)) {
                return response()->json(['data' => []]);
            }

            $employees = Employee::whereIn('company_id', $companyIds)
                ->with([
                    'user:id,name,email',
                    'user.professionalProfile:id,user_id,headline,avatar_path',
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json(['data' => $employees]);
        } catch (\Exception $e) {
            \Log::error('myEmployees failed: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'error'   => $e->getMessage(),
                'file'    => basename($e->getFile()),
                'line'    => $e->getLine(),
            ], 500);
        }
    }

    /**
     * Créer une entreprise
     */
    public function store(CompanyRequest $request)
    {
        $data = $request->validated();
        $data['owner_user_id'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['name']);

        $company = Company::create($data);

        $company->members()->create([
            'user_id' => $request->user()->id,
            'role'    => 'owner',
            'status'  => 'active',
        ]);

        return response()->json($company, 201);
    }

    /**
     * Mettre à jour une entreprise
     */
    public function update(CompanyRequest $request, Company $company)
    {
        $this->authorize('update', $company);

        $data = $request->validated();
        if ($data['name'] !== $company->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $company->id);
        }

        $company->update($data);

        return $company;
    }

    /**
     * Upload du logo
     */
    public function uploadLogo(Request $request, Company $company)
    {
        $this->authorize('update', $company);

        $validator = Validator::make($request->all(), [
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
        }

        $path = $request->file('logo')->store('company-logos', 'public');
        $company->update(['logo_path' => $path]);

        return response()->json([
            'message' => 'Logo mis à jour avec succès ✅',
            'data'    => $company,
        ]);
    }

    /**
     * Lister les membres
     */
    public function members(Company $company)
    {
        return response()->json([
            'data' => $company->members()->with('user')->get(),
        ]);
    }

    /**
     * Ajouter un membre
     */
    public function addMember(Request $request, Company $company)
    {
        $this->authorize('manageMembers', $company);

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role'    => 'required|string|in:admin,member,viewer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($company->members()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'Cet utilisateur est déjà membre'], 409);
        }

        $member = $company->members()->create([
            'user_id' => $request->user_id,
            'role'    => $request->role,
            'status'  => 'active',
        ]);

        return response()->json([
            'message' => 'Membre ajouté avec succès ✅',
            'data'    => $member->load('user'),
        ], 201);
    }

    /**
     * Retirer un membre
     */
    public function removeMember(Request $request, Company $company, $memberId)
    {
        $this->authorize('manageMembers', $company);

        $member = $company->members()->where('id', $memberId)->first();
        if (!$member) {
            return response()->json(['message' => 'Membre non trouvé'], 404);
        }

        if ($member->role === 'owner') {
            return response()->json(['message' => 'Impossible de retirer le propriétaire'], 403);
        }

        $member->delete();

        return response()->json(['message' => 'Membre retiré avec succès ✅']);
    }

    /**
     * Demander la vérification
     */
    public function requestVerification(Request $request, Company $company)
    {
        $this->authorize('update', $company);

        if ($company->is_verified) {
            return response()->json(['message' => 'Cette entreprise est déjà vérifiée'], 409);
        }

        $existing = VerificationRequest::where('verifiable_type', Company::class)
            ->where('verifiable_id', $company->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Une demande est déjà en cours'], 409);
        }

        $verification = VerificationRequest::create([
            'verifiable_type' => Company::class,
            'verifiable_id'   => $company->id,
            'requested_by'    => $request->user()->id,
            'status'          => 'pending',
        ]);

        return response()->json([
            'message' => 'Demande envoyée ✅',
            'data'    => $verification,
        ]);
    }

    /**
     * Lister les salariés d'UNE entreprise (par id)
     */
    public function employees(Company $company)
    {
        return response()->json([
            'data' => $company->employees()
                ->with(['user.professionalProfile'])
                ->orderBy('created_at', 'desc')
                ->get(),
        ]);
    }

    /**
     * Ajouter un salarié
     */
    public function addEmployee(Request $request, Company $company)
    {
        $this->authorize('update', $company);

        $request->validate([
            'email'      => 'required|email',
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'position'   => 'nullable|string|max:100',
            'phone'      => 'nullable|string|max:30',
        ]);

        $user = User::where('email', $request->email)->first();
        $hasAccount = (bool) $user;

        $existingEmployee = $company->employees()
            ->where(function ($query) use ($request, $user) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('email', $request->email);
                }
            })
            ->exists();

        if ($existingEmployee) {
            return response()->json(['message' => 'Ce salarié est déjà dans l\'entreprise'], 409);
        }

        $employee = $company->employees()->create([
            'company_id' => $company->id,
            'position'   => $request->position,
            'status'     => 'active',
            'email'      => $request->email,
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'phone'      => $request->phone,
            'has_account'=> $hasAccount,
            'user_id'    => $user?->id,
        ]);

        if ($user) {
            $existingMember = $company->members()->where('user_id', $user->id)->exists();
            if (!$existingMember) {
                $company->members()->create([
                    'user_id' => $user->id,
                    'role'    => 'member',
                    'status'  => 'active',
                ]);
            }
        }

        return response()->json([
            'message' => $hasAccount ? '✅ Salarié ajouté (avec compte)' : '✅ Salarié ajouté',
            'data'    => $employee->load('user'),
        ], 201);
    }

    /**
     * Retirer un salarié
     */
    public function removeEmployee(Request $request, Company $company, $employeeId)
    {
        $this->authorize('update', $company);

        $employee = $company->employees()->where('id', $employeeId)->first();
        if (!$employee) {
            return response()->json(['message' => 'Salarié non trouvé'], 404);
        }

        $employee->delete();

        return response()->json(['message' => 'Salarié retiré avec succès ✅']);
    }

    /**
     * Générer un slug unique
     */
    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            Company::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-" . $i++;
        }

        return $slug;
    }
}