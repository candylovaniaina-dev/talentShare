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
    /** Type de contrat d'une demande de ressource (resource_requests.contract_type) */
public static function typeFromRequestContract(?string $contractType): string
{
    return match (strtolower((string) $contractType)) {
        'stage', 'internship'                              => 'internship',
        'alternance', 'apprenticeship'                     => 'apprenticeship',
        'emploi', 'job', 'cdi', 'permanent', 'first_job'   => 'permanent',
        default                                            => 'fixed_term', // cdd, mission freelance...
    };
}

/**
 * Contrat d'une proposition : on respecte les dates prévues de la demande.
 * - Stage / Alternance / CDD : fin = fin prévue (ou début + durée par défaut)
 * - CDI : pas de fin, période d'essai d'1 mois
 */
public static function buildFromRequest(?string $contractType, $start = null, $end = null): array
{
    $type  = self::typeFromRequestContract($contractType);
    $start = $start ? Carbon::parse($start)->startOfDay() : now()->startOfDay();

    $endAt = null;
    $isTrial = false;
    $trialEndsAt = null;

    if ($type === 'permanent') {
        $isTrial = true;
        $trialEndsAt = $start->copy()->addMonths(self::TRIAL_MONTHS);
    } else {
        $endAt = $end ? Carbon::parse($end)->startOfDay() : null;
        if (!$endAt || $endAt->lt($start)) {
            $endAt = $start->copy()->addMonths(self::DEFAULT_MONTHS[$type]);
        }
    }

    return [
        'contract_type' => $type,
        'start_at'      => $start->toDateString(),
        'end_at'        => $endAt?->toDateString(),
        'is_trial'      => $isTrial,
        'trial_ends_at' => $trialEndsAt?->toDateString(),
    ];
}
}