<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InterviewScheduledVerificationNeeded extends Mailable
{
    use Queueable, SerializesModels;

    public Application $application;
    public $candidate;
    public $offer;
    public $company;
    public string $verificationUrl;

    public function __construct(Application $application)
    {
        $this->application = $application;
        $this->candidate = $application->profile?->user;
        $this->offer = $application->jobOffer;
        $this->company = $this->offer?->company;

        // Génère le lien de vérification signé
        $this->verificationUrl = \URL::temporarySignedRoute(
            'verification.verify',
            now()->addDays(7),
            [
                'id' => $this->candidate->id,
                'hash' => sha1($this->candidate->email),
            ]
        );
    }

    public function envelope(): \Illuminate\Mail\Mailables\Envelope
    {
        return new \Illuminate\Mail\Mailables\Envelope(
            subject: "Confirmez votre email pour recevoir l'invitation à l'entretien",
        );
    }

    public function content(): \Illuminate\Mail\Mailables\Content
    {
        return new \Illuminate\Mail\Mailables\Content(
            view: 'emails.interview-verification-needed',
            with: [
                'candidateName' => $this->candidate->name,
                'offer' => $this->offer,
                'company' => $this->company,
                'verificationUrl' => $this->verificationUrl,
                'interviewAt' => $this->application->interview_at,
            ],
        );
    }
}