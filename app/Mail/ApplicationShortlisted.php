<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationShortlisted extends Mailable
{
    use Queueable, SerializesModels;

    public $application;
    public $candidate;
    public $offer;
    public $company;

    public function __construct(Application $application)
    {
        $this->application = $application;
        $this->candidate = $application->profile?->user;
        $this->offer = $application->jobOffer;
        $this->company = $this->offer?->company;
    }

    public function build()
    {
        return $this
            ->subject("🎉 Bonne nouvelle ! Vous êtes présélectionné(e) — {$this->offer?->title}")
            ->view('emails.application-shortlisted');
    }
}