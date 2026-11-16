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
    public function index()
    {
        return Company::query()
            ->latest()
            ->paginate(request('per_page', 15));
    }

    public function show(Company $company)
    {
        return $company->load(['owner', 'members.user']);
    }

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

    public function myCompanies(Request $request)
    {
        $user = $request->user();
        
        $owned = $user->ownedCompanies()->get();
        $member = $user->memberCompanies()->get();
        
        // Fusionner sans doublons
        $all = $owned->merge($member)->unique('id')->values();
        
        return response()->json($all);
    }

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

    public function members(Company $company)
    {
        $members = $company->members()
            ->with([
                'user:id,name,first_name,last_name,email,avatar_path',
                'user.professionalProfile:id,user_id,headline,avatar_path',
            ])
            ->get();

        $employeePhotos = \App\Models\Employee::where('company_id', $company->id)
            ->whereNotNull('user_id')
            ->whereNotNull('photo_path')
            ->pluck('photo_path', 'user_id');

        $members->each(function ($m) use ($employeePhotos) {
            if ($m->user_id && isset($employeePhotos[$m->user_id])) {
                $m->photo_path = $employeePhotos[$m->user_id];
            }
        });

        return response()->json(['data' => $members]);
    }

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

        $user = User::find($request->user_id);
        if ($user && !$user->professionalProfile) {
            \App\Models\ProfessionalProfile::create([
                'user_id'      => $user->id,
                'profile_type' => 'employee',
                'headline'     => null, // ✅ CORRIGÉ : On ne met plus le nom par défaut
                'visibility'   => 'network',
            ]);
        }

        return response()->json([
            'message' => 'Membre ajouté avec succès ✅',
            'data'    => $member->load(['user.professionalProfile']),
        ], 201);
    }

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

    public function employees(Company $company)
    {
        $employees = $company->employees()
            ->with(['user.professionalProfile'])
            ->orderBy('created_at', 'desc')
            ->get();

        $employees->transform(function ($emp) {
            $profile = $emp->user?->professionalProfile;
            $name = $emp->user?->name ?? trim(($emp->first_name ?? '') . ' ' . ($emp->last_name ?? ''));
            
            // ✅ CORRIGÉ : On donne la priorité absolue au poste de la table employees
            $currentPosition = $emp->position ?: $profile?->headline;

            // On ignore la valeur si elle est identique au nom ou si c'est "Professionnel"
            if (!$currentPosition || trim($currentPosition) === trim($name) || $currentPosition === 'Professionnel') {
                $currentPosition = null;
            }

            // Si pas de poste valide, on va chercher le titre de la mission
            if (!$currentPosition && $emp->user_id) {
                $mission = \App\Models\Mission::where('requesting_company_id', $emp->company_id)
                    ->whereHas('profile', function($q) use ($emp) {
                        $q->where('user_id', $emp->user_id);
                    })
                    ->latest()
                    ->first();
                    
                $currentPosition = $mission?->title ?? 'Poste non spécifié';
            }

            // ✅ CORRIGÉ : On n'écrase plus la base de données ici
            
            $emp->setAttribute('shareable', true);
            $emp->setAttribute('professional_profile_id', $profile?->id ?? $emp->professional_profile_id);
            $emp->setAttribute('name', $name ?: 'Salarié');
            $emp->setAttribute('avatar_path', $emp->photo_path ?? $profile?->avatar_path);
            
            // ✅ CORRIGÉ : On force les deux champs pour que le frontend trouve la donnée
            $emp->setAttribute('headline', $currentPosition);
            $emp->setAttribute('position', $currentPosition);

            return $emp;
        });

        return response()->json(['data' => $employees]);
    }

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
        $profileId = null;

        if ($user) {
            $profile = \App\Models\ProfessionalProfile::where('user_id', $user->id)->first();
            if (!$profile) {
                $profile = \App\Models\ProfessionalProfile::create([
                    'user_id'      => $user->id,
                    'profile_type' => 'employee',
                    'headline'     => $request->position, // ✅ CORRIGÉ : On met le poste saisi, ou null
                    'visibility'   => 'network',
                ]);
            }
            $profileId = $profile->id;
        }

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
            'company_id'              => $company->id,
            'position'                => $request->position,
            'status'                  => 'active',
            'email'                   => $request->email,
            'first_name'              => $request->first_name,
            'last_name'               => $request->last_name,
            'phone'                   => $request->phone,
            'has_account'             => $hasAccount,
            'user_id'                 => $user?->id,
            'professional_profile_id' => $profileId,
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
            'data'    => $employee->load('user.professionalProfile'),
        ], 201);
    }

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

    public function deleteLogo(Request $request, Company $company)
    {
        $this->authorize('update', $company);

        if ($company->logo_path) {
            \Storage::disk('public')->delete($company->logo_path);
            $company->update(['logo_path' => null]);
        }

        return response()->json([
            'message' => 'Logo supprimé',
            'data' => $company->fresh(),
        ]);
    }

    public function uploadEmployeePhoto(Request $request, Company $company, $employeeId)
    {
        $this->authorize('update', $company);

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $employee = $company->employees()->where('id', $employeeId)->first();

        if (!$employee) {
            return response()->json(['message' => 'Salarié non trouvé'], 404);
        }

        if ($employee->photo_path) {
            Storage::disk('public')->delete($employee->photo_path);
        }

        $path = $request->file('photo')->store('employee-photos', 'public');
        $employee->update(['photo_path' => $path]);

        if ($employee->user_id) {
            $profile = \App\Models\ProfessionalProfile::where('user_id', $employee->user_id)->first();
            if ($profile) {
                if ($profile->avatar_path && $profile->avatar_path !== $path) {
                    Storage::disk('public')->delete($profile->avatar_path);
                }
                $profile->update(['avatar_path' => $path]);
            } else {
                \App\Models\ProfessionalProfile::create([
                    'user_id'      => $employee->user_id,
                    'profile_type' => 'employee',
                    'headline'     => $employee->position, // ✅ CORRIGÉ : Pas de 'Professionnel' par défaut
                    'visibility'   => 'network',
                    'avatar_path'  => $path,
                ]);
            }
        }

        return response()->json([
            'message' => 'Photo mise à jour ✅',
            'data'    => $employee->fresh()->load('user.professionalProfile'),
        ]);
    }

    public function uploadMemberPhoto(Request $request, Company $company, $memberId)
    {
        $this->authorize('update', $company);

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $member = $company->members()->where('id', $memberId)->first();

        if (!$member) {
            return response()->json(['message' => 'Membre non trouvé'], 404);
        }

        if (!$member->user_id) {
            return response()->json(['message' => 'Ce membre n\'a pas de compte utilisateur'], 422);
        }

        $path = $request->file('photo')->store('avatars', 'public');

        $profile = \App\Models\ProfessionalProfile::where('user_id', $member->user_id)->first();

        if ($profile) {
            if ($profile->avatar_path && $profile->avatar_path !== $path) {
                Storage::disk('public')->delete($profile->avatar_path);
            }
            $profile->update(['avatar_path' => $path]);
        } else {
            \App\Models\ProfessionalProfile::create([
                'user_id'      => $member->user_id,
                'profile_type' => 'employee',
                'headline'     => null, // ✅ CORRIGÉ : On ne met plus le nom par défaut
                'visibility'   => 'network',
                'avatar_path'  => $path,
            ]);
        }

        $employee = \App\Models\Employee::where('company_id', $company->id)
            ->where('user_id', $member->user_id)
            ->first();

        if ($employee) {
            if ($employee->photo_path && $employee->photo_path !== $path) {
                Storage::disk('public')->delete($employee->photo_path);
            }
            $employee->update(['photo_path' => $path]);
        }

        return response()->json([
            'message' => 'Photo du membre mise à jour ✅',
            'data' => $member->fresh()->load([
                'user.professionalProfile',
            ]),
        ]);
    }

    public function borrowed(Request $request, Company $company)
    {
        return app(\App\Http\Controllers\Api\EmployeeController::class)->borrowed($request, $company);
    }
}