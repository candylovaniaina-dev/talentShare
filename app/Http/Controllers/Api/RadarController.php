<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobOffer;
use App\Models\ProfessionalProfile;
use App\Models\ResourceRequest;
use App\Services\MatchingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RadarController extends Controller
{
    /** Types de recherche côté étudiant → valeurs en base */
    private const TYPE_MAP = [
        'stage'      => ['offer' => ['internship', 'stage'],                      'request' => ['stage']],
        'alternance' => ['offer' => ['apprenticeship', 'alternance'],             'request' => ['alternance']],
        'emploi'     => ['offer' => ['permanent', 'first_job', 'cdi', 'cdd'],     'request' => ['emploi']],
        'mission'    => ['offer' => ['junior_mission', 'mission'],                'request' => ['mission']],
    ];

    // ============================================
    // GET /api/radar
    // ============================================
    public function index(Request $request, MatchingService $matcher)
    {
        $user = $request->user();
        $profile = $user->professionalProfile;

        if (!$profile) {
            return response()->json([
                'profile_found' => false,
                'data' => [],
                'total' => 0,
                'counts' => ['offers' => 0, 'requests' => 0, 'strong' => 0],
                'profile' => null,
            ]);
        }

        $profile->load(['skills', 'availabilityWindows']);

        $types = array_values(array_intersect(
            array_keys(self::TYPE_MAP),
            (array) $request->input('types', [])
        ));

        $prefs = [
            'types'  => $types,
            'city'   => trim((string) $request->input('city', '')),
            'remote' => $request->boolean('remote'),
        ];

        $kind = in_array($request->input('kind'), ['offers', 'requests'], true) ? $request->input('kind') : 'all';
        $minScore = max(0, min(100, (int) $request->input('min_score', 0)));
        $limit = max(1, min(100, (int) $request->input('limit', 40)));
        $q = trim((string) $request->input('q', ''));

        $items = $this->buildItems($user, $profile, $matcher, $prefs, $kind, $q, null, 60);

        $filtered = $items
            ->filter(fn ($i) => $i['score'] >= $minScore)
            ->sort(function ($a, $b) {
                if ($a['score'] !== $b['score']) return $b['score'] <=> $a['score'];
                return strcmp((string) $b['created_at'], (string) $a['created_at']);
            })
            ->values();

        return response()->json([
            'profile_found' => true,
            'profile' => [
                'completeness' => $matcher->scoreSearch($profile, [], null, 'profile'),
                'skills_count' => $profile->skills->count(),
                'tips' => $this->profileTips($profile),
            ],
            'data' => $filtered->take($limit)->values(),
            'total' => $filtered->count(),
            'counts' => [
                'offers'   => $filtered->where('kind', 'job_offer')->count(),
                'requests' => $filtered->where('kind', 'request')->count(),
                'strong'   => $filtered->where('score', '>=', 70)->count(),
            ],
        ]);
    }

    // ============================================
    // GET /api/radar/count-new?since=ISO
    // Nombre de nouveaux matchs (>= 60 %) depuis la dernière visite
    // ============================================
    public function countNew(Request $request, MatchingService $matcher)
    {
        $user = $request->user();
        $profile = $user->professionalProfile;

        if (!$profile) {
            return response()->json(['count' => 0]);
        }

        $profile->load(['skills', 'availabilityWindows']);

        try {
            $since = $request->filled('since') ? Carbon::parse($request->input('since')) : now()->subDays(7);
        } catch (\Throwable $e) {
            $since = now()->subDays(7);
        }
        if ($since->lt(now()->subDays(30))) {
            $since = now()->subDays(30);
        }

        $items = $this->buildItems($user, $profile, $matcher, [
            'types' => [], 'city' => '', 'remote' => false,
        ], 'all', '', $since, 30);

        return response()->json(['count' => $items->where('score', '>=', 60)->count()]);
    }

    // ============================================
    // CONSTRUCTION DU FIL (offres + demandes) AVEC SCORE
    // ============================================
    private function buildItems($user, ProfessionalProfile $profile, MatchingService $matcher, array $prefs, string $kind, string $q, ?Carbon $since, int $perType): Collection
    {
        $types = $prefs['types'] ?? [];
        $myCompanyIds = $user->companies()->pluck('id')->toArray();
        $items = collect();

        // ---------- OFFRES DE RECRUTEMENT ----------
        if ($kind !== 'requests') {
            $offerTypes = collect($types)->flatMap(fn ($t) => self::TYPE_MAP[$t]['offer'])->all();

            $offers = JobOffer::query()
                ->where('status', 'published')
                ->with(['company:id,name,logo_path,city,country,is_verified', 'skills'])
                ->when(!empty($myCompanyIds), fn ($qb) => $qb->whereNotIn('company_id', $myCompanyIds))
                ->when(!empty($offerTypes), fn ($qb) => $qb->whereIn('offer_type', $offerTypes))
                ->when(!empty($prefs['remote']), fn ($qb) => $qb->where('remote', true))
                ->when($q !== '', function ($qb) use ($q) {
                    $qb->where(function ($sq) use ($q) {
                        $sq->where('title', 'ilike', "%{$q}%")
                           ->orWhere('description', 'ilike', "%{$q}%")
                           ->orWhereHas('company', fn ($cq) => $cq->where('name', 'ilike', "%{$q}%"));
                    });
                })
                ->when($since, fn ($qb) => $qb->where('created_at', '>', $since))
                ->latest()
                ->limit($perType)
                ->get();

            foreach ($offers as $o) {
                $score = $matcher->scoreJobOffer($o, $profile, $prefs);
                $gap = $matcher->skillGap($o->skills, $profile->skills);

                $items->push([
                    'key' => 'job-' . $o->id,
                    'kind' => 'job_offer',
                    'id' => $o->id,
                    'title' => $o->title,
                    'description' => $o->description,
                    'excerpt' => Str::limit(strip_tags((string) $o->description), 260),
                    'type_key' => $this->groupOf('offer', $o->offer_type),
                    'offer_type' => $o->offer_type,
                    'city' => $o->city,
                    'country' => $o->country,
                    'remote' => (bool) $o->remote,
                    'budget_min' => null,
                    'budget_max' => null,
                    'company' => $this->companyArray($o->company),
                    'skills' => $this->skillsArray($o->skills),
                    'created_at' => $o->created_at?->toIso8601String(),
                    'score' => $score['total'],
                    'breakdown' => $score['breakdown'],
                    'matched_skills' => $gap['matched'],
                    'missing_skills' => $gap['missing'],
                    'reasons' => $this->reasons($score['breakdown'], $gap, $o, false),
                ]);
            }
        }

        // ---------- DEMANDES DE TALENTS (publiées par des entreprises) ----------
        if ($kind !== 'offers') {
            $reqTypes = collect($types)->flatMap(fn ($t) => self::TYPE_MAP[$t]['request'])->all();

            $requests = ResourceRequest::published()
                ->where('created_by', '!=', $user->id)
                ->where(function ($w) {
                    $w->whereNull('author_type')->orWhere('author_type', '!=', 'talent');
                })
                ->when(!empty($myCompanyIds), function ($qb) use ($myCompanyIds) {
                    $qb->where(function ($w) use ($myCompanyIds) {
                        $w->whereNull('company_id')->orWhereNotIn('company_id', $myCompanyIds);
                    });
                })
                ->when(!empty($reqTypes), function ($qb) use ($reqTypes, $types) {
                    $qb->where(function ($w) use ($reqTypes, $types) {
                        $w->whereIn('contract_type', $reqTypes);
                        if (in_array('mission', $types, true)) {
                            $w->orWhereNull('contract_type');
                        }
                    });
                })
                ->when(!empty($prefs['remote']), fn ($qb) => $qb->where('remote', true))
                ->when($q !== '', fn ($qb) => $qb->search($q))
                ->when($since, fn ($qb) => $qb->where('created_at', '>', $since))
                ->with(['company:id,name,logo_path,city,country,is_verified', 'skills'])
                ->latest()
                ->limit($perType)
                ->get();

            foreach ($requests as $r) {
                $score = $matcher->score($r, $profile);
                $gap = $matcher->skillGap($r->skills, $profile->skills);

                $items->push([
                    'key' => 'req-' . $r->id,
                    'kind' => 'request',
                    'id' => $r->id,
                    'title' => $r->title,
                    'description' => $r->description,
                    'excerpt' => Str::limit(strip_tags((string) $r->description), 260),
                    'type_key' => $this->groupOf('request', $r->contract_type) ?? 'mission',
                    'contract_type' => $r->contract_type,
                    'author_type' => $r->author_type ?? 'company',
                    'company_id' => $r->company_id,
                    'city' => $r->city,
                    'country' => $r->country,
                    'remote' => (bool) $r->remote,
                    'budget_min' => $r->budget_min,
                    'budget_max' => $r->budget_max,
                    'start_at' => $r->start_at,
                    'end_at' => $r->end_at,
                    'urgency' => $r->urgency,
                    'company' => $this->companyArray($r->company),
                    'skills' => $this->skillsArray($r->skills),
                    'created_at' => $r->created_at?->toIso8601String(),
                    'score' => $score['total'],
                    'breakdown' => $score['breakdown'],
                    'matched_skills' => $gap['matched'],
                    'missing_skills' => $gap['missing'],
                    'reasons' => $this->reasons($score['breakdown'], $gap, $r, true),
                ]);
            }
        }

        return $items;
    }

    // ============================================
    // HELPERS
    // ============================================
    private function groupOf(string $side, ?string $value): ?string
    {
        if (!$value) return null;
        foreach (self::TYPE_MAP as $group => $map) {
            if (in_array($value, $map[$side], true)) return $group;
        }
        return null;
    }

    private function companyArray($company): ?array
    {
        if (!$company) return null;
        return [
            'id' => $company->id,
            'name' => $company->name,
            'logo_path' => $company->logo_path,
            'city' => $company->city,
            'country' => $company->country,
            'is_verified' => (bool) ($company->is_verified ?? false),
        ];
    }

    private function skillsArray($skills): array
    {
        return $skills->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'min_level' => $s->pivot->min_level ?? null,
        ])->values()->all();
    }

    private function reasons(array $breakdown, array $gap, $item, bool $isRequest): array
    {
        $reasons = [];
        $matched = count($gap['matched']);
        $total = $matched + count($gap['missing']);

        if ($total === 0) {
            $reasons[] = ['tone' => 'info', 'text' => 'Aucune compétence précise exigée'];
        } elseif ($matched === $total) {
            $reasons[] = ['tone' => 'ok', 'text' => "Vous avez les {$total} compétences demandées"];
        } elseif ($matched > 0) {
            $names = implode(', ', array_slice($gap['matched'], 0, 3));
            $reasons[] = ['tone' => 'ok', 'text' => "{$matched}/{$total} compétences en commun : {$names}"];
        } else {
            $reasons[] = ['tone' => 'warn', 'text' => "Aucune des compétences demandées n'est sur votre profil"];
        }

        $loc = $breakdown['location'] ?? 0;
        if ($item->remote) {
            $reasons[] = ['tone' => 'ok', 'text' => 'Possible en télétravail'];
        } elseif ($loc >= 100) {
            $reasons[] = ['tone' => 'ok', 'text' => 'Dans votre ville'];
        } elseif ($loc >= 70) {
            $reasons[] = ['tone' => 'ok', 'text' => 'Dans votre pays'];
        } else {
            $reasons[] = ['tone' => 'warn', 'text' => 'Lieu éloigné de votre localisation'];
        }

        if ($isRequest) {
            if (($breakdown['availability'] ?? 0) >= 100) {
                $reasons[] = ['tone' => 'ok', 'text' => 'Disponible sur la période demandée'];
            } else {
                $reasons[] = ['tone' => 'warn', 'text' => 'Aucune disponibilité sur la période'];
            }
        }

        return $reasons;
    }

    private function profileTips(ProfessionalProfile $profile): array
    {
        $tips = [];
        $skills = $profile->skills->count();

        if ($skills === 0) {
            $tips[] = 'Ajoutez vos compétences : sans elles, le radar ne peut pas vous comparer aux offres.';
        } elseif ($skills < 5) {
            $tips[] = 'Ajoutez au moins 5 compétences pour affiner vos correspondances.';
        }
        if ($profile->availabilityWindows->isEmpty()) {
            $tips[] = 'Ajoutez une période de disponibilité pour être compatible avec les demandes datées.';
        }
        if (empty($profile->city)) {
            $tips[] = 'Renseignez votre ville pour voir les opportunités proches de vous.';
        }
        if (empty($profile->headline)) {
            $tips[] = 'Ajoutez un titre de profil (ex : Étudiant en informatique, recherche stage).';
        }

        return array_slice($tips, 0, 3);
    }
}