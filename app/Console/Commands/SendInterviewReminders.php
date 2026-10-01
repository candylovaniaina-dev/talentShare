<?php

namespace App\Console\Commands;

use App\Mail\InterviewReminder;
use App\Models\Application;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendInterviewReminders extends Command
{
    protected $signature = 'interviews:send-reminders';
    protected $description = 'Envoie un rappel aux deux parties 30 minutes avant un entretien programmé.';

    public function handle(): void
    {
        $applications = Application::where('status', 'interview')
            ->where('interview_reminder_sent', false)
            ->whereNotNull('interview_at')
            ->whereBetween('interview_at', [now(), now()->addMinutes(30)])
            ->with(['jobOffer.company.owner', 'profile.user'])
            ->get();

        foreach ($applications as $application) {
            $candidate = $application->profile?->user;
            $company = $application->jobOffer?->company;
            $recruiter = $company?->owner;

            try {
                if ($candidate) {
                    Mail::to($candidate->email)->send(new InterviewReminder($application, $candidate->name, false));
                }
                if ($recruiter) {
                    Mail::to($recruiter->email)->send(new InterviewReminder($application, $recruiter->name, true));
                }

                $application->update(['interview_reminder_sent' => true]);
                $this->info("Rappel envoyé pour la candidature #{$application->id}");
            } catch (\Exception $e) {
                \Log::error("Erreur rappel entretien #{$application->id}: " . $e->getMessage());
            }
        }

        if ($applications->isEmpty()) {
            $this->info('Aucun rappel à envoyer.');
        }
    }
}