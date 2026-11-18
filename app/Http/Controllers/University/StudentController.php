<?php

namespace App\Http\Controllers\University;

use App\Models\Company;
use App\Models\UniversityProgram;
use App\Models\UniversityStudent;
use App\Models\User;
use App\Services\StudentSnapshot;
use App\Services\UniversityNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** P0-13 / P0-16 / P0-22 — Référencement, suivi et vérification des étudiants */
class StudentController extends BaseUniversityController
{
    private const PLACEMENT = ['searching', 'internship', 'employed', 'continuing', 'unavailable'];

    public function index(Request $r)
    {
        $uid = $this->uni($r)->id;
        $q = UniversityStudent::with(['program:id,name,level'])->where('university_id', $uid);

        if ($s = trim((string) $r->query('search', ''))) {
            $q->where(fn ($w) => $w
                ->where('full_name', 'ilike', "%$s%")
                ->orWhere('email', 'ilike', "%$s%")
                ->orWhere('student_number', 'ilike', "%$s%"));
        }
        foreach (['verification_status', 'placement_status', 'program_id', 'academic_year'] as $f) {
            if ($r->filled($f)) {
                $q->where($f, $r->query($f));
            }
        }

        $page = $q->orderByDesc('created_at')->paginate(min((int) $r->query('per_page', 15), 100));
        $page->getCollection()->transform(function ($s) {
            $s->setAttribute('has_account', (bool) $s->user_id);
            return $s;
        });
        return $page;
    }

    private function baseRules(int $uid): array
    {
        return [
            'full_name'      => ['required', 'string', 'max:160'],
            'email'          => ['nullable', 'email', 'max:255'],
            'student_number' => ['nullable', 'string', 'max:60'],
            'program_id'     => ['nullable', Rule::exists('university_programs', 'id')->where('university_id', $uid)],
            'level'          => ['nullable', 'string', 'max:30'],
            'academic_year'  => ['nullable', 'string', 'max:20'],
            'graduation_year' => ['nullable', 'integer', 'between:1990,2100'],
        ];
    }

    /** Rattachement par l'établissement : l'étudiant est directement « vérifié » (l'université l'atteste). */
    public function store(Request $r)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $data = $r->validate($this->baseRules($uni->id));
        $data['email'] = isset($data['email']) ? Str::lower($data['email']) : null;

        $account = $data['email'] ? User::where('email', $data['email'])->where('role', 'student')->first() : null;

        if ($data['email'] && UniversityStudent::where('university_id', $uni->id)->where('email', $data['email'])->exists()) {
            return response()->json(['message' => 'Un étudiant avec cet e-mail est déjà référencé.'], 422);
        }

        $student = UniversityStudent::create($data + [
            'university_id'       => $uni->id,
            'user_id'             => $account?->id,
            'origin'              => 'university',
            'verification_status' => 'verified',
            'verified_at'         => now(),
            'verified_by'         => $r->user()->id,
        ]);

        if ($account) {
            UniversityNotifier::send($account->id, 'university_student_verified',
                'Statut étudiant vérifié', "{$uni->name} a certifié votre statut d'étudiant.", ['university_id' => $uni->id]);
        }

        return response()->json(['student' => $student->load('program:id,name,level')], 201);
    }

    /** Import CSV : full_name;email;student_number;program;level;academic_year */
    public function import(Request $r)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $r->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:4096']]);

        $handle = fopen($r->file('file')->getRealPath(), 'r');
        $first = fgets($handle);
        $delimiter = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
        rewind($handle);

        $header = array_map(fn ($h) => Str::slug(trim($h, " \t\n\r\0\x0B\xEF\xBB\xBF"), '_'), fgetcsv($handle, 0, $delimiter) ?: []);
        $programs = UniversityProgram::where('university_id', $uni->id)->get()->keyBy(fn ($p) => Str::lower($p->name));

        $created = 0; $skipped = 0; $errors = [];
        $line = 1;
        while (($row = fgetcsv($handle, 0, $delimiter)) !== false && $line < 1001) {
            $line++;
            if (count($row) !== count($header)) { $errors[] = "Ligne $line : colonnes inattendues"; continue; }
            $d = array_combine($header, array_map('trim', $row));

            $name = $d['full_name'] ?? $d['nom'] ?? '';
            $email = Str::lower($d['email'] ?? '');
            if ($name === '') { $errors[] = "Ligne $line : nom manquant"; continue; }
            if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) { $errors[] = "Ligne $line : e-mail invalide"; continue; }
            if ($email !== '' && UniversityStudent::where('university_id', $uni->id)->where('email', $email)->exists()) { $skipped++; continue; }

            $account = $email ? User::where('email', $email)->where('role', 'student')->first() : null;
            $prog = $programs->get(Str::lower($d['program'] ?? $d['filiere'] ?? ''));

            UniversityStudent::create([
                'university_id'       => $uni->id,
                'user_id'             => $account?->id,
                'program_id'          => $prog?->id,
                'full_name'           => $name,
                'email'               => $email ?: null,
                'student_number'      => $d['student_number'] ?? $d['matricule'] ?? null,
                'level'               => $d['level'] ?? $d['niveau'] ?? null,
                'academic_year'       => $d['academic_year'] ?? $d['annee'] ?? null,
                'origin'              => 'import',
                'verification_status' => 'verified',
                'verified_at'         => now(),
                'verified_by'         => $r->user()->id,
            ]);
            $created++;
        }
        fclose($handle);

        return ['created' => $created, 'skipped' => $skipped, 'errors' => array_slice($errors, 0, 20)];
    }

    public function show(Request $r, int $id)
    {
        $student = UniversityStudent::with(['program:id,name,level', 'user:id,name,email', 'conventions'])
            ->where('university_id', $this->uni($r)->id)->findOrFail($id);

        return ['student' => $student, 'snapshot' => StudentSnapshot::for($student)];
    }

    public function update(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $student = UniversityStudent::where('university_id', $uni->id)->findOrFail($id);
        $student->update($r->validate($this->baseRules($uni->id)));
        return ['student' => $student->fresh('program:id,name,level')];
    }

    public function destroy(Request $r, int $id)
    {
        $this->requireWrite($r);
        UniversityStudent::where('university_id', $this->uni($r)->id)->findOrFail($id)->delete();
        return response()->noContent();
    }

    /** P0-22 — Certification / badge « profil vérifié par l'université » */
    public function verify(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $student = UniversityStudent::where('university_id', $uni->id)->findOrFail($id);
        $student->update([
            'verification_status' => 'verified',
            'verified_at'         => now(),
            'verified_by'         => $r->user()->id,
            'verification_note'   => null,
        ]);
        UniversityNotifier::send($student->user_id, 'university_student_verified',
            'Statut étudiant vérifié', "{$uni->name} a certifié votre statut d'étudiant.", ['university_id' => $uni->id]);
        return ['student' => $student->fresh('program:id,name,level')];
    }

    public function reject(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $data = $r->validate(['note' => ['nullable', 'string', 'max:500']]);
        $student = UniversityStudent::where('university_id', $uni->id)->findOrFail($id);
        $student->update([
            'verification_status' => 'rejected',
            'verified_at'         => null,
            'verified_by'         => $r->user()->id,
            'verification_note'   => $data['note'] ?? null,
        ]);
        UniversityNotifier::send($student->user_id, 'university_student_rejected',
            'Rattachement refusé', "{$uni->name} n'a pas pu confirmer votre statut d'étudiant.", ['university_id' => $uni->id]);
        return ['student' => $student->fresh('program:id,name,level')];
    }

    /** Insertion professionnelle */
    public function placement(Request $r, int $id)
    {
        $this->requireWrite($r);
        $student = UniversityStudent::where('university_id', $this->uni($r)->id)->findOrFail($id);
        $data = $r->validate([
            'placement_status'       => ['required', Rule::in(self::PLACEMENT)],
            'placement_company_id'   => ['nullable', 'exists:companies,id'],
            'placement_company_name' => ['nullable', 'string', 'max:160'],
            'placement_title'        => ['nullable', 'string', 'max:160'],
            'placement_start'        => ['nullable', 'date'],
        ]);

        if (! empty($data['placement_company_id']) && empty($data['placement_company_name'])) {
            $data['placement_company_name'] = Company::find($data['placement_company_id'])?->getAttribute('name');
        }
        if (in_array($data['placement_status'], ['searching', 'continuing', 'unavailable'], true)) {
            $data = ['placement_status' => $data['placement_status'], 'placement_company_id' => null,
                     'placement_company_name' => null, 'placement_title' => null, 'placement_start' => null];
        }

        $student->update($data);
        return ['student' => $student->fresh('program:id,name,level')];
    }
}
