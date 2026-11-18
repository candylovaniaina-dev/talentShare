<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\University;
use App\Models\UniversityPartnership;
use App\Models\Company;
use App\Services\UniversityNotifier;
use Illuminate\Http\Request;

/** Annuaire des établissements (étudiants & entreprises) + partenariats côté entreprise */
class DirectoryController extends Controller
{
    public function index(Request $r)
    {
        $q = University::query();
        if ($s = trim((string) $r->query('q', ''))) {
            $q->where(fn ($w) => $w->where('name', 'ilike', "%$s%")->orWhere('city', 'ilike', "%$s%"));
        }
        return ['universities' => $q->where('name', '!=', '')->orderBy('name')->limit(30)
            ->get(['id', 'name', 'type', 'city', 'region', 'logo_path'])];
    }

    public function show(int $id)
    {
        $u = University::with(['departments.programs:id,department_id,name,level', 'programs:id,university_id,department_id,name,level'])->findOrFail($id);
        return ['university' => $u->only(['id', 'name', 'type', 'description', 'address', 'city', 'region', 'country', 'latitude', 'longitude', 'website', 'logo_path']),
                'departments' => $u->departments, 'programs' => $u->programs];
    }

    /* ----- Côté entreprise ----- */

    private function company(Request $r): Company
    {
        abort_unless($r->user()->role === 'company', 403, 'Réservé aux comptes entreprise.');
        return Company::where('user_id', $r->user()->id)->firstOrFail();
    }

    public function companyPartnerships(Request $r)
    {
        $c = $this->company($r);
        return ['partnerships' => UniversityPartnership::with('university:id,name,city,logo_path')
            ->where('company_id', $c->id)->orderByRaw("case status when 'pending' then 0 when 'active' then 1 else 2 end")->get()];
    }

    public function companyRequest(Request $r)
    {
        $c = $this->company($r);
        $data = $r->validate(['university_id' => ['required', 'exists:universities,id'], 'message' => ['nullable', 'string', 'max:1000']]);

        $existing = UniversityPartnership::where('university_id', $data['university_id'])->where('company_id', $c->id)->first();
        if ($existing && in_array($existing->status, ['pending', 'active'], true)) {
            return response()->json(['message' => 'Un partenariat existe déjà avec cet établissement.'], 422);
        }
        $p = $existing ?: new UniversityPartnership(['university_id' => $data['university_id'], 'company_id' => $c->id]);
        $p->fill(['status' => 'pending', 'initiated_by' => 'company', 'message' => $data['message'] ?? null, 'started_at' => null, 'ended_at' => null])->save();

        UniversityNotifier::send(University::find($data['university_id'])?->user_id, 'university_partnership_request',
            'Demande de partenariat', ($c->getAttribute('name') ?? 'Une entreprise') . ' souhaite devenir partenaire.', ['partnership_id' => $p->id]);

        return response()->json(['partnership_id' => $p->id], 201);
    }

    public function companyRespond(Request $r, int $id)
    {
        $c = $this->company($r);
        $data = $r->validate(['action' => ['required', 'in:accept,decline,end']]);
        $p = UniversityPartnership::where('company_id', $c->id)->findOrFail($id);

        if ($data['action'] === 'accept' && $p->status === 'pending' && $p->initiated_by === 'university') {
            $p->update(['status' => 'active', 'started_at' => now()]);
            UniversityNotifier::send($p->university?->user_id, 'university_partnership_accepted',
                'Partenariat confirmé', ($c->getAttribute('name') ?? 'Une entreprise') . ' a accepté votre invitation.', ['partnership_id' => $p->id]);
        } elseif ($data['action'] === 'decline' && $p->status === 'pending') {
            $p->update(['status' => 'declined']);
        } elseif ($data['action'] === 'end' && $p->status === 'active') {
            $p->update(['status' => 'ended', 'ended_at' => now()]);
        } else {
            abort(422, 'Action impossible.');
        }
        return ['ok' => true];
    }
}
