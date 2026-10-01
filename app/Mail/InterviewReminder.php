<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewReminder extends Mailable
{
    use Queueable, SerializesModels;

    public Application $application;
    public string $recipientName;
    public bool $isRecruiter;

    public function __construct(Application $application, string $recipientName, bool $isRecruiter)
    {
        $this->application = $application;
        $this->recipientName = $recipientName;
        $this->isRecruiter = $isRecruiter;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Rappel : votre entretien commence dans 30 minutes",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.interview-reminder',
            with: [
                'application' => $this->application,
                'offer' => $this->application->jobOffer,
                'recipientName' => $this->recipientName,
                'isRecruiter' => $this->isRecruiter,
            ],
        );
    }
}