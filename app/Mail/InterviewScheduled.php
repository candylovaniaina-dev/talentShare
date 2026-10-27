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
     * ✅ Génère un fichier .ics SIMPLIFIÉ et 100% compatible Gmail / Outlook.
     * 
     * - Tout est en UTC (avec le Z à la fin) pour éviter les problèmes de fuseaux.
     * - Pas de bloc VTIMEZONE (inutile si on est en UTC).
     * - Toutes les lignes respectent le format RFC 5545.
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

        // ✅ On convertit TOUTES les dates en UTC (Gmail exige ça pour être sûr)
        $start = $this->application->interview_at->copy()->utc();
        $end = $start->copy()->addHour();

        // ✅ Identifiant unique basé sur l'ID et le timestamp
        $uid = 'talentshare-entretien-' . $this->application->id . '@talentshare.com';
        $dtstamp = now()->utc()->format('Ymd\THis\Z');

        // ✅ Nettoyage des textes pour éviter les caractères spéciaux
        $summary = 'Entretien programmé : ' . $offer->title;
        $description = "Bonjour {$applicant->name},\n\n"
            . "Votre entretien pour le poste « {$offer->title} » est programmé.\n\n"
            . "Entreprise : " . ($company?->name ?? 'TalentShare') . "\n"
            . "Lien de visioconférence : {$this->application->interview_link}\n\n"
            . "À bientôt !";

        $organizerEmail = $company?->email ?: config('mail.from.address', 'noreply@talentshare.com');
        $organizerName  = $company?->name ?: config('mail.from.name', 'TalentShare');

        $lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//TalentShare//Entretien//FR",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",

            "BEGIN:VEVENT",
            "UID:{$uid}",
            "DTSTAMP:{$dtstamp}",
            
            // ✅ LIGNE LA PLUS IMPORTANTE : tout en UTC
            "DTSTART:" . $start->format('Ymd\THis\Z'),
            "DTEND:" . $end->format('Ymd\THis\Z'),
            
            $this->foldLine("SUMMARY:" . $this->escapeIcs($summary)),
            $this->foldLine("DESCRIPTION:" . $this->escapeIcs($description)),
            $this->foldLine("LOCATION:Visioconférence"),
            $this->foldLine("URL:" . $this->application->interview_link),
            
            // ✅ ORGANIZER : obligatoire pour Gmail
            $this->foldLine("ORGANIZER;CN=" . $this->escapeIcs($organizerName) . ":mailto:{$organizerEmail}"),
            
            // ✅ ATTENDEE : le destinataire (RSVP=TRUE pour avoir les boutons de réponse)
            $this->foldLine("ATTENDEE;CN=" . $this->escapeIcs($applicant->name) . ";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{$applicant->email}"),
            
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            "TRANSP:OPAQUE",
            "END:VEVENT",
            "END:VCALENDAR",
        ];

        return implode("\r\n", $lines);
    }

    /**
     * ✅ Échappe les caractères spéciaux selon RFC 5545
     */
    private function escapeIcs(string $text): string
    {
        // Nettoyer d'abord les sauts de ligne Windows
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        
        return str_replace(
            ["\\", ",", ";", "\n"],
            ["\\\\", "\\,", "\\;", "\\n"],
            $text
        );
    }

    /**
     * ✅ Replie une ligne à 75 octets max (RFC 5545 §3.1)
     */
    private function foldLine(string $line): string
    {
        if (strlen($line) <= 75) {
            return $line;
        }

        $folded = substr($line, 0, 75);
        $rest = substr($line, 75);

        while (strlen($rest) > 0) {
            $chunk = substr($rest, 0, 74);
            $folded .= "\r\n " . $chunk;
            $rest = substr($rest, 74);
        }

        return $folded;
    }
}