<?php
namespace App\Mail;
use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationRejected extends Mailable
{
    use Queueable, SerializesModels;
    public $application;

    public function __construct(Application $application) {
        $this->application = $application;
    }

    public function build() {
        return $this->subject('Réponse à votre candidature')
                    ->view('emails.application-rejected');
    }
}