<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewScheduled extends Mailable
{
    use Queueable, SerializesModels;

    public Application $application;
    public bool $emailNotVerified;

    public function __construct(Application $application, bool $emailNotVerified = false)
    {
        $this->application = $application;
        $this->emailNotVerified = $emailNotVerified;
    }

    public function envelope(): Envelope
    {
        $offer = $this->application->jobOffer;
        return new Envelope(
            subject: "Entretien programmé – {$offer->title}",
        );
    }

    public function content(): Content
    {
        $verificationUrl = null;

        if ($this->emailNotVerified) {
            $user = $this->application->profile->user;

            $verificationUrl = \URL::temporarySignedRoute(
                'verification.verify',
                now()->addDays(7),
                [
                    'id' => $user->id,
                    'hash' => sha1($user->email),
                ]
            );
        }

        return new Content(
            view: 'emails.interview-scheduled',
            with: [
                'application' => $this->application,
                'offer' => $this->application->jobOffer,
                'company' => $this->application->jobOffer->company,
                'candidateName' => $this->application->profile->user->name,
                'emailNotVerified' => $this->emailNotVerified,
                'verificationUrl' => $verificationUrl,
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

    /**
     * Génère un fichier .ics VALIDE RFC 5545 :
     * ✅ Bloc VTIMEZONE pour Indian/Antananarivo (Madagascar UTC+3)
     * ✅ ORGANIZER + ATTENDEE
     * ✅ Folding à 75 octets
     * ✅ Échappement complet
     */
    private function buildIcs(): string
    {
        if (!$this->application->interview_at) {
            return implode("\r\n", [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//TalentShare//Entretien//FR",
                "END:VCALENDAR",
            ]);
        }

        $offer = $this->application->jobOffer;
        $company = $offer->company;
        $applicant = $this->application->profile->user;

        // ✅ Heure locale Madagascar
        $start = $this->application->interview_at->copy()->setTimezone('Indian/Antananarivo');
        $end = $start->copy()->addHour();

        $uid = 'talentshare-' . $this->application->id . '-' . $this->application->interview_at->timestamp . '@talentshare.local';
        $dtstamp = now()->utc()->format('Ymd\THis\Z');

        $summary = 'Entretien – ' . $offer->title;
        $description = "Entretien pour le poste « {$offer->title} » chez {$company?->name}.\n\n"
            . "Rejoindre la visioconférence : {$this->application->interview_link}";

        $organizerEmail = $company?->email ?: config('mail.from.address', 'noreply@talentshare.com');
        $organizerName  = $company?->name ?: config('mail.from.name', 'TalentShare');

        $lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//TalentShare//Entretien//FR",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",

            // ✅ BLOC VTIMEZONE OBLIGATOIRE pour Indian/Antananarivo
            "BEGIN:VTIMEZONE",
            "TZID:Indian/Antananarivo",
            "X-LIC-LOCATION:Indian/Antananarivo",
            "BEGIN:STANDARD",
            "DTSTART:19700101T000000",
            "TZOFFSETFROM:+0300",
            "TZOFFSETTO:+0300",
            "TZNAME:EAT",
            "END:STANDARD",
            "END:VTIMEZONE",

            "BEGIN:VEVENT",
            "UID:{$uid}",
            "DTSTAMP:{$dtstamp}",
            // ✅ DTSTART/DTEND avec TZID (plus fiable que Z)
            "DTSTART;TZID=Indian/Antananarivo:" . $start->format('Ymd\THis'),
            "DTEND;TZID=Indian/Antananarivo:" . $end->format('Ymd\THis'),
            $this->foldLine("SUMMARY:" . $this->escapeIcs($summary)),
            $this->foldLine("DESCRIPTION:" . $this->escapeIcs($description)),
            "LOCATION:Visioconférence",
            "URL:" . $this->application->interview_link,
            $this->foldLine("ORGANIZER;CN=" . $this->escapeIcs($organizerName) . ":MAILTO:{$organizerEmail}"),
            $this->foldLine("ATTENDEE;CN=" . $this->escapeIcs($applicant->name) . ";RSVP=TRUE:MAILTO:{$applicant->email}"),
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            "BEGIN:VALARM",
            "TRIGGER:-PT15M",
            "ACTION:DISPLAY",
            "DESCRIPTION:Rappel entretien",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR",
        ];

        return implode("\r\n", $lines);
    }

    private function escapeIcs(string $text): string
    {
        return str_replace(
            ["\\", ",", ";", "\r\n", "\n", "\r"],
            ["\\\\", "\\,", "\\;", "\\n", "\\n", "\\n"],
            $text
        );
    }

    /**
     * Replie une ligne iCalendar à 75 octets max (RFC 5545 §3.1).
     */
    private function foldLine(string $line): string
    {
        $maxLen = 75;
        if (strlen($line) <= $maxLen) {
            return $line;
        }

        $folded = substr($line, 0, $maxLen);
        $rest = substr($line, $maxLen);

        while (strlen($rest) > 0) {
            $chunk = substr($rest, 0, $maxLen - 1);
            $folded .= "\r\n " . $chunk;
            $rest = substr($rest, $maxLen - 1);
        }

        return $folded;
    }
}