<?php

namespace App\Http\Controllers\University;

use App\Models\UniversityDepartment;
use App\Models\UniversityProgram;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** P0-16 — Facultés/départements, filières, formations, programmes */
class AcademicController extends BaseUniversityController
{
    public function index(Request $r)
    {
        $uid = $this->uni($r)->id;
        return [
            'departments' => UniversityDepartment::where('university_id', $uid)
                ->with(['programs' => fn ($q) => $q->withCount('students')->orderBy('name')])
                ->orderBy('name')->get(),
            'programs' => UniversityProgram::where('university_id', $uid)
                ->withCount('students')->orderBy('name')->get(),
        ];
    }

    private function deptRules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:160'],
            'code'        => ['nullable', 'string', 'max:30'],
            'head_name'   => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function storeDepartment(Request $r)
    {
        $this->requireWrite($r);
        $d = UniversityDepartment::create($r->validate($this->deptRules()) + ['university_id' => $this->uni($r)->id]);
        return response()->json(['department' => $d->load('programs')], 201);
    }

    public function updateDepartment(Request $r, int $id)
    {
        $this->requireWrite($r);
        $d = UniversityDepartment::where('university_id', $this->uni($r)->id)->findOrFail($id);
        $d->update($r->validate($this->deptRules()));
        return ['department' => $d->fresh('programs')];
    }

    public function destroyDepartment(Request $r, int $id)
    {
        $this->requireWrite($r);
        UniversityDepartment::where('university_id', $this->uni($r)->id)->findOrFail($id)->delete();
        return response()->noContent();
    }

    private function programRules(int $uid): array
    {
        return [
            'name'           => ['required', 'string', 'max:160'],
            'department_id'  => ['nullable', Rule::exists('university_departments', 'id')->where('university_id', $uid)],
            'level'          => ['nullable', Rule::in(['licence', 'master', 'doctorat', 'bts', 'dut', 'ingenieur', 'certification', 'autre'])],
            'duration_years' => ['nullable', 'integer', 'between:1,12'],
            'description'    => ['nullable', 'string', 'max:2000'],
            'skills'         => ['nullable', 'array', 'max:30'],
            'skills.*'       => ['string', 'max:60'],
        ];
    }

    public function storeProgram(Request $r)
    {
        $this->requireWrite($r);
        $uid = $this->uni($r)->id;
        $p = UniversityProgram::create($r->validate($this->programRules($uid)) + ['university_id' => $uid]);
        return response()->json(['program' => $p], 201);
    }

    public function updateProgram(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uid = $this->uni($r)->id;
        $p = UniversityProgram::where('university_id', $uid)->findOrFail($id);
        $p->update($r->validate($this->programRules($uid)));
        return ['program' => $p->fresh()];
    }

    public function destroyProgram(Request $r, int $id)
    {
        $this->requireWrite($r);
        UniversityProgram::where('university_id', $this->uni($r)->id)->findOrFail($id)->delete();
        return response()->noContent();
    }
}
