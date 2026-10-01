<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewScheduledRecruiter extends Mailable
{
    use Queueable, SerializesModels;

    public Application $application;
    public string $recruiterName;

    public function __construct(Application $application, string $recruiterName)
    {
        $this->application = $application;
        $this->recruiterName = $recruiterName;
    }

    public function envelope(): Envelope
    {
        $offer = $this->application->jobOffer;
        return new Envelope(
            subject: "Confirmation entretien – {$offer->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.interview-scheduled-recruiter',
            with: [
                'application' => $this->application,
                'offer' => $this->application->jobOffer,
                'candidate' => $this->application->profile->user,
                'recruiterName' => $this->recruiterName,
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

    private function buildIcs(): string
    {
        $offer = $this->application->jobOffer;
        $candidate = $this->application->profile->user;
        $start = $this->application->interview_at->copy()->utc();
        $end = $this->application->interview_at->copy()->addHour()->utc();
        $uid = 'talentshare-recruiter-' . $this->application->id . '-' . $this->application->interview_at->timestamp . '@talentshare.local';
        $dtstamp = now()->utc()->format('Ymd\THis\Z');

        $summary = 'Entretien – ' . $candidate->name . ' pour ' . $offer->title;
        $description = "Entretien avec {$candidate->name} pour le poste « {$offer->title} ».\n\n"
            . "Rejoindre la visioconférence : {$this->application->interview_link}";

        $lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//TalentShare//Entretien//FR",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            "UID:{$uid}",
            "DTSTAMP:{$dtstamp}",
            "DTSTART:" . $start->format('Ymd\THis\Z'),
            "DTEND:" . $end->format('Ymd\THis\Z'),
            "SUMMARY:" . $this->escapeIcs($summary),
            "DESCRIPTION:" . $this->escapeIcs($description),
            "LOCATION:Visioconférence",
            "URL:" . $this->application->interview_link,
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
}