<?php

namespace App\Http\Controllers\University;

use App\Models\Company;
use App\Models\UniversityOpportunity;
use App\Models\UniversityPartnership;
use App\Models\UniversityStudent;
use App\Services\UniversityNotifier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** P0-16 — Réseau d'entreprises partenaires (côté université) */
class PartnershipController extends BaseUniversityController
{
    public function index(Request $r)
    {
        $uid = $this->uni($r)->id;
        $rows = UniversityPartnership::with('company')->where('university_id', $uid)
            ->when($r->filled('status'), fn ($q) => $q->where('status', $r->query('status')))
            ->orderByRaw("case status when 'pending' then 0 when 'active' then 1 else 2 end")
            ->orderByDesc('updated_at')->get();

        $placed = UniversityStudent::where('university_id', $uid)->whereNotNull('placement_company_id')
            ->selectRaw('placement_company_id, count(*) c')->groupBy('placement_company_id')->pluck('c', 'placement_company_id');
        $offers = UniversityOpportunity::where('university_id', $uid)->whereNotNull('company_id')
            ->selectRaw('company_id, count(*) c')->groupBy('company_id')->pluck('c', 'company_id');

        return ['partnerships' => $rows->map(fn ($p) => [
            'id'           => $p->id,
            'status'       => $p->status,
            'initiated_by' => $p->initiated_by,
            'message'      => $p->message,
            'notes'        => $p->notes,
            'started_at'   => $p->started_at,
            'created_at'   => $p->created_at,
            'company'      => $this->companyCard($p->company),
            'placed_students' => (int) ($placed[$p->company_id] ?? 0),
            'offers_count'    => (int) ($offers[$p->company_id] ?? 0),
        ])];
    }

    /** Recherche d'entreprises à inviter (hors partenariats existants). */
    public function searchCompanies(Request $r)
    {
        $uid = $this->uni($r)->id;
        $taken = UniversityPartnership::where('university_id', $uid)->whereIn('status', ['pending', 'active'])->pluck('company_id');
        $q = Company::query()->whereNotIn('id', $taken);
        if ($s = trim((string) $r->query('q', ''))) {
            $q->where('name', 'ilike', "%$s%");
        }
        return ['companies' => $q->orderBy('name')->limit(12)->get()->map(fn ($c) => $this->companyCard($c))];
    }

    public function store(Request $r)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $data = $r->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'message'    => ['nullable', 'string', 'max:1000'],
        ]);

        $existing = UniversityPartnership::where('university_id', $uni->id)->where('company_id', $data['company_id'])->first();
        if ($existing && in_array($existing->status, ['pending', 'active'], true)) {
            return response()->json(['message' => 'Un partenariat existe déjà avec cette entreprise.'], 422);
        }

        $p = $existing ?: new UniversityPartnership(['university_id' => $uni->id, 'company_id' => $data['company_id']]);
        $p->fill(['status' => 'pending', 'initiated_by' => 'university', 'message' => $data['message'] ?? null, 'started_at' => null, 'ended_at' => null])->save();

        $company = Company::find($data['company_id']);
        UniversityNotifier::send($company?->getAttribute('user_id'), 'university_partnership_request',
            'Invitation de partenariat', "{$uni->name} souhaite devenir partenaire de votre entreprise.", ['partnership_id' => $p->id]);

        return response()->json(['partnership_id' => $p->id], 201);
    }

    public function update(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $p = UniversityPartnership::where('university_id', $uni->id)->findOrFail($id);
        $data = $r->validate([
            'action' => ['required', Rule::in(['accept', 'decline', 'end', 'note'])],
            'notes'  => ['nullable', 'string', 'max:1000'],
        ]);

        match ($data['action']) {
            'accept'  => $p->status === 'pending' && $p->initiated_by === 'company' ? $p->update(['status' => 'active', 'started_at' => now()]) : abort(422, 'Action impossible.'),
            'decline' => $p->status === 'pending' ? $p->update(['status' => 'declined']) : abort(422, 'Action impossible.'),
            'end'     => $p->status === 'active' ? $p->update(['status' => 'ended', 'ended_at' => now()]) : abort(422, 'Action impossible.'),
            'note'    => $p->update(['notes' => $data['notes'] ?? null]),
        };

        if ($data['action'] === 'accept') {
            UniversityNotifier::send($p->company?->getAttribute('user_id'), 'university_partnership_accepted',
                'Partenariat confirmé', "{$uni->name} a accepté votre demande de partenariat.", ['partnership_id' => $p->id]);
        }
        return ['ok' => true];
    }
}
