<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\UniversityConvention;
use App\Models\UniversityMember;
use App\Models\UniversityPartnership;
use App\Models\UniversityResourceInterest;
use App\Models\UniversityResourceOffer;
use App\Models\UniversityStudent;
use App\Services\StudentSnapshot;
use App\Services\UniversityNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

/**
 * Besoins en ressources.
 *  - Côté université : publier des ressources (groupes d'étudiants + compétences), répondre aux besoins
 *    des entreprises, traiter les demandes reçues (processus automatique à l'acceptation).
 *  - Côté entreprise : consulter les ressources publiées et manifester son intérêt.
 */
class ResourceController extends BaseUniversityController
{
    private const TYPES = ['stage', 'alternance', 'premier_emploi', 'mission', 'autre'];

    /* ------------------------------------------------------------------ */
    /* Côté université                                                     */
    /* ------------------------------------------------------------------ */

    /** Mes ressources publiées, avec étudiants, compétences et demandes en attente. */
    public function index(Request $r)
    {
        $uid = $this->uni($r)->id;

        $offers = UniversityResourceOffer::with(['students.program:id,name', 'targetCompany'])
            ->withCount(['interests as pending_interests' => fn ($q) => $q->where('status', 'pending')])
            ->where('university_id', $uid)
            ->when($r->filled('status'), fn ($q) => $q->where('status', $r->query('status')))
            ->orderByRaw("case status when 'published' then 0 when 'filled' then 1 else 2 end")
            ->orderByDesc('created_at')->get();

        return ['offers' => $offers->map(fn ($o) => $this->offerCard($o, true))];
    }

    public function store(Request $r)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);

        $data = $r->validate([
            'title'               => ['required', 'string', 'max:200'],
            'type'                => ['required', Rule::in(self::TYPES)],
            'description'         => ['nullable', 'string', 'max:3000'],
            'skills'              => ['nullable', 'array', 'max:20'],
            'skills.*'            => ['string', 'max:60'],
            'available_from'      => ['nullable', 'date'],
            'duration_months'     => ['nullable', 'integer', 'between:1,60'],
            'deadline'            => ['nullable', 'date'],
            'target_company_id'   => ['nullable', 'exists:companies,id'],
            'resource_request_id' => ['nullable', 'integer'],
            'student_ids'         => ['required', 'array', 'min:1', 'max:100'],
            'student_ids.*'       => ['integer', Rule::exists('university_students', 'id')
                ->where('university_id', $uni->id)->where('verification_status', 'verified')],
        ], [
            'student_ids.required'  => 'Sélectionnez au moins un étudiant vérifié.',
            'student_ids.*.exists'  => 'Seuls les étudiants vérifiés par votre établissement peuvent être proposés.',
        ]);

        $offer = UniversityResourceOffer::create([
            'university_id'       => $uni->id,
            'title'               => $data['title'],
            'type'                => $data['type'],
            'description'         => $data['description'] ?? null,
            'skills'              => array_values(array_unique($data['skills'] ?? [])),
            'available_from'      => $data['available_from'] ?? null,
            'duration_months'     => $data['duration_months'] ?? null,
            'deadline'            => $data['deadline'] ?? null,
            'target_company_id'   => $data['target_company_id'] ?? null,
            'resource_request_id' => $data['resource_request_id'] ?? null,
            'status'              => 'published',
            'created_by'          => $r->user()->id,
        ]);
        $offer->students()->sync($data['student_ids']);

        // Diffusion automatique : l'entreprise ciblée, sinon toutes les entreprises partenaires actives
        $count = count($data['student_ids']);
        $companyIds = $offer->target_company_id
            ? collect([$offer->target_company_id])
            : UniversityPartnership::where('university_id', $uni->id)->where('status', 'active')->pluck('company_id');

        Company::whereIn('id', $companyIds)->get()->each(fn ($c) => UniversityNotifier::send(
            $c->getAttribute('user_id'), 'university_resource_published',
            'Nouvelle ressource disponible',
            "{$uni->name} propose {$count} étudiant" . ($count > 1 ? 's' : '') . " : {$offer->title}.",
            ['offer_id' => $offer->id]
        ));

        return response()->json(['offer_id' => $offer->id, 'notified_companies' => $companyIds->count()], 201);
    }

    public function update(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $offer = UniversityResourceOffer::where('university_id', $uni->id)->findOrFail($id);

        $data = $r->validate([
            'title'           => ['sometimes', 'string', 'max:200'],
            'description'     => ['nullable', 'string', 'max:3000'],
            'status'          => ['sometimes', Rule::in(['published', 'closed'])],
            'available_from'  => ['nullable', 'date'],
            'duration_months' => ['nullable', 'integer', 'between:1,60'],
            'deadline'        => ['nullable', 'date'],
        ]);
        $offer->update($data);
        return ['ok' => true];
    }

    public function destroy(Request $r, int $id)
    {
        $this->requireWrite($r);
        UniversityResourceOffer::where('university_id', $this->uni($r)->id)->findOrFail($id)->delete();
        return response()->noContent();
    }

    /** Demandes reçues des entreprises. */
    public function requests(Request $r)
    {
        $uid = $this->uni($r)->id;
        $rows = UniversityResourceInterest::with(['company', 'offer.students:id'])
            ->whereHas('offer', fn ($q) => $q->where('university_id', $uid))
            ->when($r->filled('status'), fn ($q) => $q->where('status', $r->query('status')))
            ->orderByRaw("case status when 'pending' then 0 else 1 end")
            ->orderByDesc('created_at')->get();

        return ['requests' => $rows->map(fn ($i) => [
            'id'         => $i->id,
            'status'     => $i->status,
            'message'    => $i->message,
            'start_date' => optional($i->start_date)->format('Y-m-d'),
            'created_at' => $i->created_at,
            'company'    => $this->companyCard($i->company),
            'offer'      => ['id' => $i->offer->id, 'title' => $i->offer->title, 'type' => $i->offer->type, 'students_count' => $i->offer->students->count()],
        ])];
    }

    /**
     * Acceptation / refus d'une demande.
     * À l'acceptation, le processus est automatique : partenariat activé, étudiants placés,
     * conventions en brouillon, notifications, ressource marquée « pourvue », autres demandes refusées.
     */
    public function respond(Request $r, int $id)
    {
        $this->requireWrite($r);
        $uni = $this->uni($r);
        $data = $r->validate(['action' => ['required', Rule::in(['accept', 'decline'])]]);

        $interest = UniversityResourceInterest::with(['offer.students', 'company'])
            ->whereHas('offer', fn ($q) => $q->where('university_id', $uni->id))->findOrFail($id);
        abort_unless($interest->status === 'pending', 422, 'Cette demande a déjà été traitée.');

        $company = $interest->company;
        $companyName = $company?->getAttribute('name') ?? 'l\'entreprise';
        $companyUserId = $company?->getAttribute('user_id');

        if ($data['action'] === 'decline') {
            $interest->update(['status' => 'declined', 'responded_at' => now()]);
            UniversityNotifier::send($companyUserId, 'university_resource_declined', 'Demande non retenue',
                "{$uni->name} n'a pas pu donner suite à votre demande pour « {$interest->offer->title} ».", ['offer_id' => $interest->offer_id]);
            return ['ok' => true, 'status' => 'declined'];
        }

        $summary = DB::transaction(function () use ($interest, $uni, $company, $companyName, $r) {
            $offer = $interest->offer;
            $start = $interest->start_date ?: $offer->available_from;

            $interest->update(['status' => 'accepted', 'responded_at' => now()]);

            // 1. Partenariat actif (créé ou réactivé)
            $partnership = UniversityPartnership::firstOrNew(['university_id' => $uni->id, 'company_id' => $interest->company_id]);
            $newPartner = $partnership->status !== 'active';
            if ($newPartner) {
                $partnership->fill(['status' => 'active', 'initiated_by' => $partnership->initiated_by ?: 'company', 'started_at' => now(), 'ended_at' => null])->save();
            }

            // 2. Étudiants placés + 3. conventions brouillon
            $placement = $offer->type === 'premier_emploi' ? 'employed' : 'internship';
            $conventionType = ['stage' => 'internship', 'alternance' => 'alternance'][$offer->type] ?? 'other';
            $conventions = 0;
            $students = $offer->students()->where('verification_status', 'verified')->get();

            foreach ($students as $s) {
                $s->update([
                    'placement_status'       => $placement,
                    'placement_company_id'   => $interest->company_id,
                    'placement_company_name' => $companyName,
                    'placement_title'        => $offer->title,
                    'placement_start'        => $start,
                ]);

                $exists = UniversityConvention::where('university_id', $uni->id)->where('student_id', $s->id)
                    ->where('company_id', $interest->company_id)->where('title', $offer->title)->exists();
                if (! $exists) {
                    UniversityConvention::create([
                        'university_id' => $uni->id,
                        'student_id'    => $s->id,
                        'company_id'    => $interest->company_id,
                        'title'         => $offer->title,
                        'type'          => $conventionType,
                        'status'        => 'draft',
                        'start_date'    => $start,
                        'end_date'      => ($start && $offer->duration_months) ? \Carbon\Carbon::parse($start)->addMonths($offer->duration_months)->format('Y-m-d') : null,
                        'notes'         => 'Générée automatiquement depuis la ressource « ' . $offer->title . ' ».',
                        'created_by'    => $r->user()->id,
                    ]);
                    $conventions++;
                }

                UniversityNotifier::send($s->user_id, 'university_student_placed', 'Une entreprise vous accueille',
                    "{$companyName} a retenu votre profil pour « {$offer->title} ».", ['offer_id' => $offer->id]);
            }

            // 4. Ressource pourvue + autres demandes refusées
            $offer->update(['status' => 'filled']);
            $others = UniversityResourceInterest::with('company')->where('offer_id', $offer->id)
                ->where('id', '!=', $interest->id)->where('status', 'pending')->get();
            foreach ($others as $o) {
                $o->update(['status' => 'declined', 'responded_at' => now()]);
                UniversityNotifier::send($o->company?->getAttribute('user_id'), 'university_resource_declined', 'Ressource déjà attribuée',
                    "« {$offer->title} » a été attribuée à une autre entreprise.", ['offer_id' => $offer->id]);
            }

            return ['students' => $students->count(), 'conventions' => $conventions, 'partnership_created' => $newPartner, 'declined_others' => $others->count()];
        });

        UniversityNotifier::send($companyUserId, 'university_resource_accepted', 'Demande acceptée',
            "{$uni->name} a accepté votre demande pour « {$interest->offer->title} » : {$summary['students']} étudiant(s) vous sont attribués.", ['offer_id' => $interest->offer_id]);

        return ['ok' => true, 'status' => 'accepted', 'summary' => $summary];
    }

    /** Besoins publiés par les entreprises (table resource_requests du projet, lue de façon défensive). */
    public function needs(Request $r)
    {
        if (! Schema::hasTable('resource_requests')) {
            return ['needs' => []];
        }
        $q = DB::table('resource_requests');
        if (Schema::hasColumn('resource_requests', 'status')) {
            $q->whereNotIn('status', ['closed', 'cancelled', 'canceled', 'archived', 'filled', 'draft']);
        }
        if (Schema::hasColumn('resource_requests', 'company_id')) {
            $q->whereNotNull('company_id');
        }
        $rows = $q->orderByDesc('id')->limit(40)->get();
        $companies = Company::whereIn('id', $rows->pluck('company_id')->filter()->unique())->get()->keyBy('id');

        return ['needs' => $rows->map(fn ($n) => [
            'id'          => $n->id,
            'title'       => $n->title ?? $n->name ?? ('Besoin #' . $n->id),
            'description' => $n->description ?? $n->details ?? null,
            'skills'      => $this->asList($n->skills ?? $n->required_skills ?? null),
            'duration'    => $n->duration ?? $n->duration_months ?? null,
            'created_at'  => $n->created_at ?? null,
            'company'     => $this->companyCard($companies[$n->company_id ?? 0] ?? null),
        ])->values()];
    }

    /* ------------------------------------------------------------------ */
    /* Côté entreprise                                                     */
    /* ------------------------------------------------------------------ */

    private function myCompany(Request $r): Company
    {
        abort_unless($r->user()->role === 'company', 403, 'Réservé aux comptes entreprise.');
        return Company::where('user_id', $r->user()->id)->firstOrFail();
    }

    public function companyBrowse(Request $r)
    {
        $c = $this->myCompany($r);

        $offers = UniversityResourceOffer::with(['university', 'students.program:id,name'])
            ->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('target_company_id')->orWhere('target_company_id', $c->id))
            ->when($r->filled('type'), fn ($q) => $q->where('type', $r->query('type')))
            ->orderByDesc('created_at')->limit(60)->get();

        $mine = UniversityResourceInterest::where('company_id', $c->id)->whereIn('offer_id', $offers->pluck('id'))->pluck('status', 'offer_id');

        return ['offers' => $offers->map(function ($o) use ($mine) {
            $card = $this->offerCard($o, false);
            $card['university'] = $o->university?->only(['id', 'name', 'city', 'logo_path']);
            $card['my_interest'] = $mine[$o->id] ?? null;
            return $card;
        })];
    }

    public function companyInterest(Request $r, int $id)
    {
        $c = $this->myCompany($r);
        $offer = UniversityResourceOffer::with('university')->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('target_company_id')->orWhere('target_company_id', $c->id))->findOrFail($id);

        $data = $r->validate(['message' => ['nullable', 'string', 'max:1000'], 'start_date' => ['nullable', 'date']]);

        $interest = UniversityResourceInterest::firstOrNew(['offer_id' => $offer->id, 'company_id' => $c->id]);
        abort_if($interest->exists && in_array($interest->status, ['pending', 'accepted'], true), 422, 'Vous avez déjà fait une demande pour cette ressource.');
        $interest->fill(['message' => $data['message'] ?? null, 'start_date' => $data['start_date'] ?? null, 'status' => 'pending', 'responded_at' => null])->save();

        $name = $c->getAttribute('name') ?? 'Une entreprise';
        $recipients = collect([$offer->university?->user_id])
            ->merge(UniversityMember::where('university_id', $offer->university_id)->where('status', 'active')->pluck('user_id'))
            ->filter()->unique();
        foreach ($recipients as $uid) {
            UniversityNotifier::send($uid, 'university_resource_interest', 'Nouvelle demande d\'entreprise',
                "{$name} souhaite accueillir : {$offer->title}.", ['interest_id' => $interest->id, 'offer_id' => $offer->id]);
        }

        return response()->json(['interest_id' => $interest->id], 201);
    }

    public function companyWithdraw(Request $r, int $id)
    {
        $c = $this->myCompany($r);
        $i = UniversityResourceInterest::where('company_id', $c->id)->where('offer_id', $id)->where('status', 'pending')->firstOrFail();
        $i->update(['status' => 'withdrawn', 'responded_at' => now()]);
        return ['ok' => true];
    }

    /* ------------------------------------------------------------------ */

    private function asList($v): array
    {
        if (is_array($v)) return array_values(array_filter($v));
        if (is_string($v) && $v !== '') {
            $j = json_decode($v, true);
            return is_array($j) ? array_values(array_filter($j)) : array_values(array_filter(array_map('trim', explode(',', $v))));
        }
        return [];
    }

    /** Carte d'une ressource ; $full = vue université (noms complets), sinon vue entreprise (prénom + initiale). */
    private function offerCard(UniversityResourceOffer $o, bool $full): array
    {
        $skills = collect($o->skills ?? []);
        $students = $o->students->take(24)->map(function (UniversityStudent $s) use (&$skills, $full) {
            $mine = $s->user_id ? StudentSnapshot::for($s)['skills'] : [];
            $skills = $skills->merge(array_slice($mine, 0, 6));
            $parts = preg_split('/\s+/', trim($s->full_name));
            return [
                'id'      => $s->id,
                'name'    => $full ? $s->full_name : (($parts[0] ?? '') . (count($parts) > 1 ? ' ' . mb_substr(end($parts), 0, 1) . '.' : '')),
                'program' => $s->program?->name,
                'level'   => $s->level,
                'user_id' => $s->user_id,
                'skills'  => array_slice($mine, 0, 5),
            ];
        })->values();

        return [
            'id'              => $o->id,
            'title'           => $o->title,
            'type'            => $o->type,
            'description'     => $o->description,
            'status'          => $o->status,
            'available_from'  => optional($o->available_from)->format('Y-m-d'),
            'duration_months' => $o->duration_months,
            'deadline'        => optional($o->deadline)->format('Y-m-d'),
            'created_at'      => $o->created_at,
            'students_count'  => $o->students->count(),
            'students'        => $students,
            'skills'          => $skills->filter()->unique()->take(14)->values(),
            'target_company'  => $this->companyCard($o->targetCompany),
            'pending_interests' => (int) ($o->pending_interests ?? 0),
        ];
    }
}
