<?php

namespace App\Mail;

use App\Models\Proposal;
use App\Models\Mission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ProposalAccepted extends Mailable
{
    use Queueable, SerializesModels;

    public $proposal;
    public $mission;
    public $candidate;
    public $company;
    public $offer;

    public function __construct(Proposal $proposal, Mission $mission)
    {
        $this->proposal = $proposal;
        $this->mission = $mission;
        $this->candidate = $proposal->profile?->user;
        $this->offer = $proposal->resourceRequest;
        $this->company = $proposal->toCompany ?? $proposal->resourceRequest?->company;
    }

    public function build()
    {
        return $this
            ->subject("🎉 Votre proposition a été acceptée — " . ($this->offer?->title ?? 'Mission'))
            ->view('emails.proposal-accepted');
    }
}