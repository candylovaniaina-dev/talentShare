<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\CompanyRequest;
use App\Models\Company;
use App\Models\CompanyMember;
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
     * Récupérer l'entreprise de l'utilisateur connecté
     */
   public function me(Request $request)
{
    // Récupérer l'utilisateur connecté
    $user = $request->user();
    
    // Vérifier que l'utilisateur est authentifié
    if (!$user) {
        return response()->json([
            'message' => 'Utilisateur non authentifié'
        ], 401);
    }
    
    // Récupérer l'entreprise (la plus récente)
    $company = Company::where('owner_user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->first();
    
    if (!$company) {
        return response()->json([
            'message' => 'Entreprise non trouvée'
        ], 404);
    }
    
    return response()->json($company);
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

        // Ajouter le propriétaire comme membre
        $company->members()->create([
            'user_id' => $request->user()->id,
            'role' => 'owner',
            'status' => 'active',
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
     * Upload du logo de l'entreprise
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

        // Supprimer l'ancien logo
        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
        }

        $path = $request->file('logo')->store('company-logos', 'public');
        $company->update(['logo_path' => $path]);

        return response()->json([
            'message' => 'Logo mis à jour avec succès ✅',
            'data' => $company
        ]);
    }

    /**
     * Lister les membres de l'entreprise
     */
    public function members(Company $company)
    {
        $members = $company->members()
            ->with('user')
            ->get();

        return response()->json(['data' => $members]);
    }

    /**
     * Ajouter un membre à l'entreprise
     */
    public function addMember(Request $request, Company $company)
    {
        $this->authorize('manageMembers', $company);

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|string|in:admin,member,viewer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Vérifier si le membre existe déjà
        if ($company->members()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'Cet utilisateur est déjà membre'], 409);
        }

        $member = $company->members()->create([
            'user_id' => $request->user_id,
            'role' => $request->role,
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Membre ajouté avec succès ✅',
            'data' => $member->load('user')
        ], 201);
    }

    /**
     * Retirer un membre de l'entreprise
     */
    public function removeMember(Request $request, Company $company, $memberId)
    {
        $this->authorize('manageMembers', $company);

        $member = $company->members()->where('id', $memberId)->first();
        if (!$member) {
            return response()->json(['message' => 'Membre non trouvé'], 404);
        }

        // Empêcher la suppression du propriétaire
        if ($member->role === 'owner') {
            return response()->json(['message' => 'Impossible de retirer le propriétaire'], 403);
        }

        $member->delete();

        return response()->json(['message' => 'Membre retiré avec succès ✅']);
    }

    /**
     * Demander la vérification de l'entreprise
     */
    public function requestVerification(Request $request, Company $company)
    {
        $this->authorize('update', $company);

        if ($company->is_verified) {
            return response()->json(['message' => 'Cette entreprise est déjà vérifiée'], 409);
        }

        // Vérifier si une demande existe déjà
        $existing = VerificationRequest::where('verifiable_type', Company::class)
            ->where('verifiable_id', $company->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Une demande de vérification est déjà en cours'], 409);
        }

        // Créer une demande de vérification
        $verification = VerificationRequest::create([
            'verifiable_type' => Company::class,
            'verifiable_id' => $company->id,
            'requested_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Demande de vérification envoyée ✅',
            'data' => $verification
        ]);
    }

    /**
     * Générer un slug unique
     */
    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (Company::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-" . $i++;
        }

        return $slug;
    }
// Lister les salariés
/**
 * Lister les salariés
 */
public function employees(Company $company)
{
    $employees = $company->employees()
         ->with(['user.professionalProfile']) 
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json(['data' => $employees]);
}

/**
 * Ajouter un salarié (avec ou sans compte)
 */
public function addEmployee(Request $request, Company $company)
{
    $this->authorize('update', $company);

    $request->validate([
        'email' => 'required|email',
        'first_name' => 'required|string|max:100',
        'last_name' => 'required|string|max:100',
        'position' => 'nullable|string|max:100',
        'phone' => 'nullable|string|max:30',
    ]);

    // Vérifier si l'utilisateur existe déjà
    $user = User::where('email', $request->email)->first();
    $hasAccount = (bool) $user;

    // Vérifier si le salarié existe déjà
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

    // Créer le salarié
    $employeeData = [
        'company_id' => $company->id,
        'position' => $request->position,
        'status' => 'active',
        'email' => $request->email,
        'first_name' => $request->first_name,
        'last_name' => $request->last_name,
        'phone' => $request->phone,
        'has_account' => $hasAccount, // 👈 AJOUTE CETTE LIGNE
        'user_id' => $user?->id,
    ];

    $employee = $company->employees()->create($employeeData);

    // Si l'utilisateur existe, l'ajouter aussi comme membre (optionnel)
    if ($user) {
        $existingMember = $company->members()->where('user_id', $user->id)->exists();
        if (!$existingMember) {
            $company->members()->create([
                'user_id' => $user->id,
                'role' => 'member',
                'status' => 'active',
            ]);
        }
    }

    return response()->json([
        'message' => $hasAccount ? '✅ Salarié ajouté (avec compte)' : '✅ Salarié ajouté',
        'data' => $employee->load('user')
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
}