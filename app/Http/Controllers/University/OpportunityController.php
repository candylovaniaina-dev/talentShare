<?php

namespace App\Http\Controllers\University;

use App\Models\UniversityOpportunity;
use App\Models\UniversityPartnership;
use App\Models\UniversityStudent;
use App\Services\UniversityNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

/** P0-16 — Diffusion d'offres de stages / premiers emplois dédiées aux étudiants */
class OpportunityController extends BaseUniversityController
{
    private function activePartnerIds(int $uid)
    {
        return UniversityPartnership::where('university_id', $uid)->where('status', 'active')->pluck('company_id');
    }

    public function index(Request $r)
    {
        $uid = $this->uni($r)->id;
        $rows = UniversityOpportunity::with(['company', 'program:id,name'])->where('university_id', $uid)
            ->when($r->filled('status'), fn ($q) => $q->where('status', $r->query('status')))
            ->orderByDesc('created_at')->get();

        return ['opportunities' => $rows->map(fn ($o) => [
            'id' => $o->id, 'title' => $o->title, 'type' => $o->type, 'description' => $o->description,
            'deadline' => optional($o->deadline)->format('Y-m-d'), 'status' => $o->status,
            'job_offer_id' => $o->job_offer_id, 'program' => $o->program, 'created_at' => $o->created_at,
            'company' => $this->companyCard($o->company),
        ])];
    }

    /** Offres de recrutement des entreprises partenaires que l'on peut diffuser. */
    public function candidates(Request $r)
    {
        $uid = $this->uni($r)->id;
        $ids = $this->activePartnerIds($uid);
        if ($ids->isEmpty() || ! Schema::hasTable('job_offers')) {
            return ['offers' => []];
        }
        $already = UniversityOpportunity::where('university_id', $uid)->whereNotNull('job_offer_id')->pluck('job_offer_id')->all();
        $names = DB::table('companies')->whereIn('id', $ids)->pluck('name', 'id');

        $offers = DB::table('job_offers')->whereIn('company_id', $ids)->orderByDesc('id')->limit(100)->get()
            ->reject(fn ($o) => in_array($o->id, $already, true))
            ->map(fn ($o) => [
                'id'           => $o->id,
                'title'        => $o->title ?? $o->name ?? ('Offre #' . $o->id),
                'type'         => $o->type ?? $o->contract_type ?? $o->offer_type ?? null,
                'company_id'   => $o->company_id,
                'company_name' => $names[$o->company_id] ?? null,
                'location'     => $o->location ?? $o->city ?? null,
            ])->values();

        return ['offers' => $offers];
    }

    public function store(Request $r)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $data = $r->validate([
            'job_offer_id' => ['nullable', 'integer'],
            'company_id'   => ['nullable', 'exists:companies,id'],
            'program_id'   => ['nullable', Rule::exists('university_programs', 'id')->where('university_id', $uni->id)],
            'title'        => ['required_without:job_offer_id', 'nullable', 'string', 'max:200'],
            'type'         => ['nullable', Rule::in(['stage', 'alternance', 'premier_emploi', 'autre'])],
            'description'  => ['nullable', 'string', 'max:3000'],
            'deadline'     => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $partners = $this->activePartnerIds($uni->id);

        if (! empty($data['job_offer_id'])) {
            $offer = Schema::hasTable('job_offers') ? DB::table('job_offers')->where('id', $data['job_offer_id'])->first() : null;
            abort_unless($offer && $partners->contains($offer->company_id), 422, "Cette offre n'appartient pas à une entreprise partenaire.");
            $data['company_id'] = $offer->company_id;
            $data['title'] = $data['title'] ?? ($offer->title ?? $offer->name ?? 'Offre partenaire');
            $raw = strtolower((string) ($offer->type ?? $offer->contract_type ?? $offer->offer_type ?? ''));
            $data['type'] = str_contains($raw, 'altern') ? 'alternance'
                : (str_contains($raw, 'stage') || str_contains($raw, 'intern') ? 'stage'
                : (preg_match('/cdi|cdd|emploi|permanent|job/', $raw) ? 'premier_emploi' : 'autre'));
        } elseif (! empty($data['company_id'])) {
            abort_unless($partners->contains((int) $data['company_id']), 422, "Cette entreprise n'est pas une partenaire active.");
        }

        $o = UniversityOpportunity::create($data + [
            'university_id' => $uni->id, 'status' => 'published', 'type' => $data['type'] ?? 'stage', 'created_by' => $r->user()->id,
        ]);

        // Notifie les étudiants vérifiés concernés (jusqu'à 500)
        UniversityStudent::where('university_id', $uni->id)->where('verification_status', 'verified')->whereNotNull('user_id')
            ->when($o->program_id, fn ($q) => $q->where('program_id', $o->program_id))
            ->limit(500)->pluck('user_id')->each(fn ($uid) => UniversityNotifier::send($uid, 'university_opportunity',
                'Nouvelle opportunité de votre université', $o->title, ['opportunity_id' => $o->id, 'job_offer_id' => $o->job_offer_id]));

        return response()->json(['opportunity_id' => $o->id], 201);
    }

    public function update(Request $r, int $id)
    {
        $this->requireWrite($r);
        $o = UniversityOpportunity::where('university_id', $this->uni($r)->id)->findOrFail($id);
        $o->update($r->validate([
            'title'       => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:3000'],
            'deadline'    => ['nullable', 'date'],
            'status'      => ['sometimes', Rule::in(['draft', 'published', 'closed'])],
        ]));
        return ['ok' => true];
    }

    public function destroy(Request $r, int $id)
    {
        $this->requireWrite($r);
        UniversityOpportunity::where('university_id', $this->uni($r)->id)->findOrFail($id)->delete();
        return response()->noContent();
    }
}
