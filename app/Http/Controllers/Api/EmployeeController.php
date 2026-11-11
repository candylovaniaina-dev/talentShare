<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use App\Services\ContractService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    private const TYPES = ['internship', 'apprenticeship', 'fixed_term', 'permanent'];

    /** Liste des salariés (les contrats terminés sont masqués sauf ?with_ended=1) */
    public function index(Request $request, Company $company)
    {
        $this->authorizeCompany($request, $company);

        $employees = $company->employees()
            ->with('user.professionalProfile')
            ->when(!$request->boolean('with_ended'), function ($q) {
                $q->where(fn ($qq) => $qq->whereNull('status')->orWhere('status', '!=', 'ended'));
            })
            ->latest()
            ->get()
            ->each(function ($e) {
                // Utilisé par la modale « Proposer un salarié »
                $e->professional_profile_id = $e->user?->professionalProfile?->id;
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
        ]);

        $type  = $data['contract_type'] ?? 'permanent';
        $start = Carbon::parse($data['start_date'] ?? now())->startOfDay();

        // ✅ Fin automatique : début + durée par défaut (stage 3 mois, alternance 12, CDD 6). CDI : jamais de fin.
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

        $alreadyExists = $company->employees()
            ->where(function ($q) use ($data, $user) {
                $q->where('email', $data['email']);
                if ($user) $q->orWhere('user_id', $user->id);
            })
            ->exists();

        if ($alreadyExists) {
            return response()->json(['message' => 'Ce salarié existe déjà dans votre entreprise.'], 409);
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
            'status'        => ['sometimes', Rule::in(['active', 'trial', 'ended'])],
            'contract_type' => ['sometimes', Rule::in(self::TYPES)],
            'start_date'    => ['sometimes', 'nullable', 'date'],
            'end_date'      => ['sometimes', 'nullable', 'date'],
        ]);

        $type  = $data['contract_type'] ?? $employee->contract_type ?? 'permanent';
        $start = $data['start_date'] ?? $employee->start_date;

        if ($type === 'permanent') {
            $data['end_date'] = null;
        } elseif (!array_key_exists('end_date', $data) && isset($data['contract_type']) && $start) {
            // Le type a changé sans nouvelle date de fin -> on la recalcule
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

        $employee->delete(); // SoftDeletes

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
        $employee->update(['photo_path' => $path]);

        return response()->json([
            'message' => 'Photo mise à jour.',
            'data'    => $employee->fresh(),
        ]);
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