<?php

namespace App\Services;

use App\Models\JobOffer;
use Carbon\Carbon;

class ContractService
{
    /** Durée par défaut (en mois) si l'offre n'en précise pas */
    public const DEFAULT_MONTHS = [
        'internship'     => 3,
        'apprenticeship' => 12,
        'fixed_term'     => 6,
    ];

    public const TRIAL_MONTHS = 1;

    public static function typeFromOffer(?string $offerType): string
    {
        return match ($offerType) {
            'internship'                  => 'internship',
            'apprenticeship'              => 'apprenticeship',
            'permanent', 'first_job'      => 'permanent',
            default                       => 'fixed_term', // fixed_term, freelance, junior_mission, student_project
        };
    }

    /**
     * Calcule tout le contrat à partir de l'offre.
     * - Stage / Alternance / CDD : fin = début + durée
     * - CDI : pas de fin, période d'essai d'1 mois (optionnelle)
     */
    public static function build(JobOffer $offer, $start = null): array
    {
        $start = $start ? Carbon::parse($start)->startOfDay() : now()->startOfDay();
        $type  = self::typeFromOffer($offer->offer_type);

        $endAt = null;
        $isTrial = false;
        $trialEndsAt = null;

        if ($type === 'permanent') {
            if (($offer->trial_enabled ?? true) !== false) {
                $isTrial = true;
                $trialEndsAt = $start->copy()->addMonths(self::TRIAL_MONTHS);
            }
        } else {
            $months = (int) ($offer->duration_months ?: self::DEFAULT_MONTHS[$type]);
            $endAt  = $start->copy()->addMonths($months);
        }

        return [
            'contract_type'  => $type,
            'start_at'       => $start->toDateString(),
            'end_at'         => $endAt?->toDateString(),
            'is_trial'       => $isTrial,
            'trial_ends_at'  => $trialEndsAt?->toDateString(),
        ];
    }
}