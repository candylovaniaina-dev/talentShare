<?php

namespace App\Http\Controllers\University;

use App\Models\UniversityConvention;
use App\Models\UniversityStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/** P0-23 — Préparation documentaire : conventions de stage tripartites (structure + pièce jointe) */
class ConventionController extends BaseUniversityController
{
    private function rules(int $uid): array
    {
        return [
            'student_id'     => ['required', Rule::exists('university_students', 'id')->where('university_id', $uid)],
            'company_id'     => ['nullable', 'exists:companies,id'],
            'job_offer_id'   => ['nullable', 'integer'],
            'mission_id'     => ['nullable', 'integer'],
            'title'          => ['required', 'string', 'max:200'],
            'type'           => ['required', Rule::in(['internship', 'alternance', 'tripartite', 'other'])],
            'status'         => ['nullable', Rule::in(['draft', 'to_sign', 'signed', 'archived'])],
            'start_date'     => ['nullable', 'date'],
            'end_date'       => ['nullable', 'date', 'after_or_equal:start_date'],
            'academic_tutor' => ['nullable', 'string', 'max:160'],
            'company_tutor'  => ['nullable', 'string', 'max:160'],
            'notes'          => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function index(Request $r)
    {
        $uid = $this->uni($r)->id;
        $rows = UniversityConvention::with(['student:id,full_name,program_id', 'company'])->where('university_id', $uid)
            ->when($r->filled('status'), fn ($q) => $q->where('status', $r->query('status')))
            ->orderByDesc('updated_at')->get();

        return ['conventions' => $rows->map(fn ($c) => [
            'id' => $c->id, 'title' => $c->title, 'type' => $c->type, 'status' => $c->status,
            'start_date' => optional($c->start_date)->format('Y-m-d'), 'end_date' => optional($c->end_date)->format('Y-m-d'),
            'academic_tutor' => $c->academic_tutor, 'company_tutor' => $c->company_tutor, 'notes' => $c->notes,
            'document_path' => $c->document_path, 'student' => $c->student, 'student_id' => $c->student_id,
            'company_id' => $c->company_id, 'company' => $this->companyCard($c->company), 'updated_at' => $c->updated_at,
        ])];
    }

    public function store(Request $r)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $data = $r->validate($this->rules($uni->id));
        $c = UniversityConvention::create($data + ['university_id' => $uni->id, 'status' => $data['status'] ?? 'draft', 'created_by' => $r->user()->id]);
        return response()->json(['convention_id' => $c->id], 201);
    }

    public function update(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $c = UniversityConvention::where('university_id', $uni->id)->findOrFail($id);
        $c->update($r->validate($this->rules($uni->id)));
        return ['ok' => true];
    }

    public function setStatus(Request $r, int $id)
    {
        $this->requireWrite($r);
        $c = UniversityConvention::where('university_id', $this->uni($r)->id)->findOrFail($id);
        $c->update($r->validate(['status' => ['required', Rule::in(['draft', 'to_sign', 'signed', 'archived'])]]));
        return ['ok' => true];
    }

    public function upload(Request $r, int $id)
    {
        $this->requireWrite($r);
        $r->validate(['document' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240']]);
        $c = UniversityConvention::where('university_id', $this->uni($r)->id)->findOrFail($id);
        if ($c->document_path) {
            Storage::disk('public')->delete($c->document_path);
        }
        $c->update(['document_path' => $r->file('document')->store('universities/conventions', 'public')]);
        return ['document_path' => $c->document_path];
    }

    public function destroy(Request $r, int $id)
    {
        $this->requireWrite($r);
        $c = UniversityConvention::where('university_id', $this->uni($r)->id)->findOrFail($id);
        if ($c->document_path) {
            Storage::disk('public')->delete($c->document_path);
        }
        $c->delete();
        return response()->noContent();
    }
}
