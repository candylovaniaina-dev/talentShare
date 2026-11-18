<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\University;
use App\Models\UniversityOpportunity;
use App\Models\UniversityStudent;
use App\Services\UniversityNotifier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Côté étudiant : demande de rattachement, offres de son université, badge public */
class StudentSelfController extends Controller
{
    private function guardStudent(Request $r): void
    {
        abort_unless($r->user()->role === 'student', 403, 'Réservé aux comptes étudiants.');
    }

    public function mine(Request $r)
    {
        $this->guardStudent($r);
        $rows = UniversityStudent::with(['university:id,name,city,logo_path', 'program:id,name,level'])
            ->where('user_id', $r->user()->id)->orderByDesc('created_at')->get();
        return ['links' => $rows];
    }

    public function request(Request $r)
    {
        $this->guardStudent($r);
        $data = $r->validate([
            'university_id'  => ['required', 'exists:universities,id'],
            'program_id'     => ['nullable', Rule::exists('university_programs', 'id')->where('university_id', $r->input('university_id'))],
            'student_number' => ['nullable', 'string', 'max:60'],
            'level'          => ['nullable', 'string', 'max:30'],
            'academic_year'  => ['nullable', 'string', 'max:20'],
        ]);
        $user = $r->user();

        $existing = UniversityStudent::where('university_id', $data['university_id'])->where('user_id', $user->id)->first();
        if ($existing) {
            return response()->json(['message' => 'Vous avez déjà une demande ou un rattachement pour cet établissement.'], 422);
        }

        $link = UniversityStudent::create($data + [
            'user_id' => $user->id, 'full_name' => $user->name, 'email' => $user->email,
            'origin' => 'student', 'verification_status' => 'pending',
        ]);

        $uni = University::find($data['university_id']);
        UniversityNotifier::send($uni?->user_id, 'university_link_request',
            "Nouvelle demande de rattachement", "{$user->name} demande à être rattaché(e) à votre établissement.", ['student_id' => $link->id]);

        return response()->json(['link' => $link], 201);
    }

    public function cancel(Request $r, int $id)
    {
        $this->guardStudent($r);
        UniversityStudent::where('user_id', $r->user()->id)->where('verification_status', 'pending')->findOrFail($id)->delete();
        return response()->noContent();
    }

    public function opportunities(Request $r)
    {
        $this->guardStudent($r);
        $links = UniversityStudent::where('user_id', $r->user()->id)->where('verification_status', 'verified')->get(['university_id', 'program_id']);
        if ($links->isEmpty()) {
            return ['opportunities' => []];
        }

        $rows = UniversityOpportunity::with(['company', 'university:id,name'])->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('deadline')->orWhere('deadline', '>=', today()))
            ->where(function ($q) use ($links) {
                foreach ($links as $l) {
                    $q->orWhere(fn ($w) => $w->where('university_id', $l->university_id)
                        ->where(fn ($p) => $p->whereNull('program_id')->orWhere('program_id', $l->program_id)));
                }
            })->orderByDesc('created_at')->limit(50)->get();

        return ['opportunities' => $rows->map(fn ($o) => [
            'id' => $o->id, 'title' => $o->title, 'type' => $o->type, 'description' => $o->description,
            'deadline' => optional($o->deadline)->format('Y-m-d'), 'job_offer_id' => $o->job_offer_id,
            'university' => $o->university?->name,
            'company' => $o->company ? ['id' => $o->company->id, 'name' => $o->company->getAttribute('name')] : null,
        ])];
    }

    /** Badge public « profil vérifié par l'université » (affichable sur le profil / portfolio d'un talent). */
    public function badge(int $userId)
    {
        $link = UniversityStudent::with(['university:id,name,logo_path', 'program:id,name,level'])
            ->where('user_id', $userId)->where('verification_status', 'verified')->orderByDesc('verified_at')->first();

        return ['verified' => (bool) $link, 'badge' => $link ? [
            'university' => $link->university?->name,
            'logo_path'  => $link->university?->logo_path,
            'program'    => $link->program?->name,
            'level'      => $link->level,
            'verified_at' => $link->verified_at,
        ] : null];
    }
}
