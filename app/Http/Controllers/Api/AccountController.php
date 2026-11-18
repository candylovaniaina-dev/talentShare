<?php

namespace App\Http\Controllers\University;

use App\Models\University;
use App\Models\UniversityMember;
use App\Models\User;
use App\Services\UniversityContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** P0-1 (compte & équipe) + P0-16 (fiche établissement) */
class AccountController extends BaseUniversityController
{
    private const TYPES = ['public', 'prive', 'institut', 'ecole', 'centre_formation'];

    // Téléphone malgache : +261 34 56 789 00 (mobiles 32/33/34/37/38 ou fixe 20)
    private const PHONE_REGEX = '/^\+261 (3[23478]|20) \d{2} \d{3} \d{2}$/';

    private function rules(bool $create): array
    {
        $req = $create ? 'required' : 'sometimes';

        return [
            'name'          => [$req, 'string', 'min:2', 'max:160'],
            'type'          => [$req, Rule::in(self::TYPES)],
            'description'   => ['nullable', 'string', 'max:3000'],
            'address'       => ['nullable', 'string', 'max:255'],
            'city'          => [$req, 'string', 'max:120'],
            'region'        => [$req, 'string', 'max:120'],
            'country'       => ['nullable', 'string', 'max:80'],
            'latitude'      => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'     => ['nullable', 'numeric', 'between:-180,180'],
            'phone'         => ['nullable', 'string', 'max:40', 'regex:' . self::PHONE_REGEX],
            'contact_email' => ['nullable', 'email:rfc', 'max:255'],
            'website'       => ['nullable', 'url:http,https', 'max:255'],
            'founded_year'  => ['nullable', 'integer', 'between:1800,' . date('Y')],
            'accreditation' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function messages(): array
    {
        return [
            'name.required'        => "Le nom de l'établissement est obligatoire.",
            'name.min'             => "Le nom de l'établissement est trop court.",
            'type.required'        => "Choisissez le type d'établissement.",
            'type.in'              => "Type d'établissement invalide.",
            'city.required'        => 'La ville est obligatoire.',
            'region.required'      => 'La région est obligatoire.',
            'phone.regex'          => 'Format de téléphone attendu : +261 34 56 789 00.',
            'contact_email.email'  => 'Adresse e-mail invalide.',
            'website.url'          => 'Entrez un lien valide, ex. https://universite.mg.',
            'founded_year.between' => "Année de création invalide.",
        ];
    }

    public function me(Request $r)
    {
        abort_unless($r->user()->role === 'university', 403, 'Accès réservé aux comptes établissement.');
        $ctx = UniversityContext::resolve($r->user());
        if (! $ctx) {
            return response()->json(['message' => "Aucun établissement associé.", 'code' => 'NO_UNIVERSITY'], 404);
        }
        return ['university' => $ctx['university'], 'role' => $ctx['role']];
    }

    public function store(Request $r)
    {
        abort_unless(
            $r->user()->role === 'university',
            403,
            'Accès réservé aux comptes établissement.'
        );

        if (UniversityContext::resolve($r->user())) {
            return response()->json([
                'message' => 'Un établissement est déjà associé à ce compte.'
            ], 409);
        }

        $data = $r->validate($this->rules(true), $this->messages());

        // Génération du slug unique
        $slug = Str::slug($data['name']) ?: 'universite';
        $originalSlug = $slug;
        $count = 1;
        while (University::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $uni = University::create([
            ...$data,
            'slug'          => $slug,
            'owner_user_id' => $r->user()->id,
            'user_id'       => $r->user()->id,
        ]);

        return response()->json([
            'university' => $uni,
            'role'       => 'owner',
        ], 201);
    }

    public function update(Request $r)
    {
        $this->requireAdmin($r);
        $uni = $this->uni($r);
        $uni->update($r->validate($this->rules(false), $this->messages()));
        return ['university' => $uni->fresh()];
    }

    public function uploadLogo(Request $r)
    {
        $this->requireAdmin($r);
        $r->validate(['logo' => ['required', 'image', 'max:3072']]);
        $uni = $this->uni($r);
        if ($uni->logo_path) {
            Storage::disk('public')->delete($uni->logo_path);
        }
        $uni->update(['logo_path' => $r->file('logo')->store('universities/logos', 'public')]);
        return ['university' => $uni->fresh()];
    }

    /* ---------------- Équipe ---------------- */

    public function team(Request $r)
    {
        $uni = $this->uni($r);
        $owner = $uni->owner;
        return [
            'owner'   => $owner ? ['id' => $owner->id, 'name' => $owner->name, 'email' => $owner->email] : null,
            'members' => UniversityMember::where('university_id', $uni->id)->orderBy('created_at')->get(),
            'my_role' => $this->role($r),
        ];
    }

    public function addMember(Request $r)
    {
        $this->requireAdmin($r);
        $uni = $this->uni($r);
        $data = $r->validate([
            'name'  => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:255'],
            'role'  => ['required', Rule::in(['admin', 'internship_office', 'teacher', 'viewer'])],
        ]);
        $email = Str::lower($data['email']);

        if (UniversityMember::where('university_id', $uni->id)->where('email', $email)->exists()) {
            return response()->json(['message' => 'Cette personne fait déjà partie de votre équipe.'], 422);
        }

        $user = User::where('email', $email)->first();
        $temporary = null;

        if ($user) {
            if ($user->role !== 'university') {
                return response()->json(['message' => "Cet e-mail correspond à un compte d'un autre type (entreprise, talent, étudiant)."], 422);
            }
        } else {
            $temporary = Str::password(12, symbols: false);
            $user = new User();
            $user->forceFill([
                'name'              => $data['name'],
                'email'             => $email,
                'password'          => Hash::make($temporary),
                'role'              => 'university',
                'email_verified_at' => now(),
            ])->save();
            try {
                Password::sendResetLink(['email' => $email]);
            } catch (\Throwable $e) {
                // L'envoi de mail n'est pas bloquant : le mot de passe temporaire est affiché une fois.
            }
        }

        $member = UniversityMember::create([
            'university_id' => $uni->id,
            'user_id'       => $user->id,
            'name'          => $data['name'],
            'email'         => $email,
            'role'          => $data['role'],
            'status'        => 'active',
        ]);

        return response()->json(['member' => $member, 'temporary_password' => $temporary], 201);
    }

    public function updateMember(Request $r, int $id)
    {
        $this->requireAdmin($r);
        $member = UniversityMember::where('university_id', $this->uni($r)->id)->findOrFail($id);
        $member->update($r->validate([
            'role'   => ['sometimes', Rule::in(['admin', 'internship_office', 'teacher', 'viewer'])],
            'status' => ['sometimes', Rule::in(['active', 'revoked'])],
            'name'   => ['sometimes', 'string', 'max:160'],
        ]));
        return ['member' => $member->fresh()];
    }

    public function removeMember(Request $r, int $id)
    {
        $this->requireAdmin($r);
        UniversityMember::where('university_id', $this->uni($r)->id)->findOrFail($id)->delete();
        return response()->noContent();
    }
}