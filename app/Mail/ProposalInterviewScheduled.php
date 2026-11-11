<?php

namespace App\Mail;

use App\Models\Proposal;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProposalInterviewScheduled extends Mailable
{
    use Queueable, SerializesModels;

    public Proposal $proposal;
    public string $role;                       // 'talent' | 'recruiter'
    public ?\App\Models\User $recipient;

    public function __construct(Proposal $proposal, string $role = 'talent', ?\App\Models\User $recipient = null)
    {
        $this->proposal  = $proposal;
        $this->role      = $role;
        $this->recipient = $recipient;
    }

    /** Entreprise concernée, quel que soit le sens de la proposition */
    private function company()
    {
        return $this->proposal->proposingCompany
            ?? $this->proposal->toCompany
            ?? $this->proposal->resourceRequest?->company;
    }

    private function subjectTitle(): string
    {
        return $this->proposal->resourceRequest?->title ?? 'votre candidature';
    }

    private function isVisio(): bool
    {
        return $this->proposal->interview_mode === 'visio';
    }

    /** Lien de visio personnalisé : même salle, nom du destinataire */
    private function joinLink(): ?string
    {
        if (!$this->isVisio() || !$this->proposal->interview_link) {
            return null;
        }

        $base   = explode('?', $this->proposal->interview_link)[0];
        $person = $this->role === 'recruiter' ? $this->recipient : $this->proposal->profile?->user;

        return $base . '?name=' . urlencode($person?->name ?? '') . '&email=' . urlencode($person?->email ?? '');
    }

    /** Personne qui reçoit l'invitation (invitée dans l'agenda) */
    private function attendee(): ?\App\Models\User
    {
        return $this->role === 'recruiter' ? $this->recipient : $this->proposal->profile?->user;
    }

    public function envelope(): Envelope
    {
        $candidate = $this->proposal->profile?->user?->name ?? 'le candidat';

        return new Envelope(
            subject: $this->role === 'recruiter'
                ? "Entretien planifié avec {$candidate} – {$this->subjectTitle()}"
                : "Entretien programmé – {$this->subjectTitle()}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.proposal-interview-scheduled',
            with: [
                'proposal'      => $this->proposal,
                'company'       => $this->company(),
                'role'          => $this->role,
                'recipientName' => $this->attendee()?->name ?? 'Bonjour',
                'candidateName' => $this->proposal->profile?->user?->name ?? 'Candidat',
                'requestTitle'  => $this->subjectTitle(),
                'isVisio'       => $this->isVisio(),
                'joinLink'      => $this->joinLink(),
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->buildIcs(), 'entretien.ics')
                ->withMime('text/calendar; charset=UTF-8; method=REQUEST'),
        ];
    }

    /** Fichier .ics (UTC, compatible Gmail / Outlook / Apple Calendar) */
    private function buildIcs(): string
    {
        if (!$this->proposal->interview_at) {
            return implode("\r\n", [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//TalentShare//Entretien//FR',
                'END:VCALENDAR',
            ]);
        }

        $company   = $this->company();
        $applicant = $this->attendee();

        $start   = $this->proposal->interview_at->copy()->utc();
        $end     = $start->copy()->addHour();
        $dtstamp = now()->utc()->format('Ymd\THis\Z');

        // Même UID + SEQUENCE croissante : une replanification met à jour l'événement existant
        $uid      = 'talentshare-proposal-' . $this->proposal->id . '-' . $this->role . '@talentshare.com';
        $sequence = (int) ($this->proposal->updated_at?->timestamp ?? 0);

        $location = $this->isVisio()
            ? 'Visioconférence'
            : ($this->proposal->interview_location ?: 'À confirmer');

        $description = "Bonjour {$applicant?->name},\n\n"
            . ($this->role === 'recruiter'
                ? "L'entretien avec {$this->proposal->profile?->user?->name} pour « {$this->subjectTitle()} » est programmé.\n\n"
                : "Votre entretien pour « {$this->subjectTitle()} » est programmé.\n\n")
            . 'Entreprise : ' . ($company?->name ?? 'TalentShare') . "\n"
            . ($this->isVisio()
                ? "Lien de visioconférence : {$this->joinLink()}\n"
                : "Lieu : {$location}\n")
            . ($this->proposal->interview_notes ? "\nInformations : {$this->proposal->interview_notes}\n" : '')
            . "\nÀ bientôt !";

        $organizerEmail = $company?->email ?: config('mail.from.address', 'noreply@talentshare.com');
        $organizerName  = $company?->name ?: config('mail.from.name', 'TalentShare');

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TalentShare//Entretien//FR',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            "UID:{$uid}",
            "DTSTAMP:{$dtstamp}",
            'DTSTART:' . $start->format('Ymd\THis\Z'),
            'DTEND:' . $end->format('Ymd\THis\Z'),
            $this->foldLine('SUMMARY:' . $this->escapeIcs('Entretien : ' . $this->subjectTitle())),
            $this->foldLine('DESCRIPTION:' . $this->escapeIcs($description)),
            $this->foldLine('LOCATION:' . $this->escapeIcs($location)),
        ];

        if ($this->joinLink()) {
            $lines[] = $this->foldLine('URL:' . $this->joinLink());
        }

        $lines[] = $this->foldLine('ORGANIZER;CN=' . $this->escapeIcs($organizerName) . ":mailto:{$organizerEmail}");

        if ($applicant?->email) {
            $lines[] = $this->foldLine(
                'ATTENDEE;CN=' . $this->escapeIcs($applicant->name)
                . ";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{$applicant->email}"
            );
        }

        $lines = array_merge($lines, [
            'STATUS:CONFIRMED',
            "SEQUENCE:{$sequence}",
            'TRANSP:OPAQUE',
            'END:VEVENT',
            'END:VCALENDAR',
        ]);

        return implode("\r\n", $lines);
    }

    private function escapeIcs(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        return str_replace(
            ['\\', ',', ';', "\n"],
            ['\\\\', '\\,', '\\;', '\\n'],
            $text
        );
    }

    private function foldLine(string $line): string
    {
        if (strlen($line) <= 75) {
            return $line;
        }

        $folded = substr($line, 0, 75);
        $rest   = substr($line, 75);

        while (strlen($rest) > 0) {
            $folded .= "\r\n " . substr($rest, 0, 74);
            $rest = substr($rest, 74);
        }

        return $folded;
    }
}