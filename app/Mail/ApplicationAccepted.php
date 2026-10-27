<?php
namespace App\Mail;
use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationAccepted extends Mailable
{
    use Queueable, SerializesModels;
    public $application;

    public function __construct(Application $application) {
        $this->application = $application;
    }

    public function build() {
        return $this->subject('Félicitations ! Votre candidature a été acceptée')
                    ->view('emails.application-accepted');
    }
}