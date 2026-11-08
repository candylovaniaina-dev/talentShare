<?php

use App\Models\Employee;
use App\Models\Mission;
use App\Services\ContractService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_offers', function (Blueprint $t) {
            if (!Schema::hasColumn('job_offers', 'duration_months')) {
                $t->unsignedTinyInteger('duration_months')->nullable();
            }
            if (!Schema::hasColumn('job_offers', 'trial_enabled')) {
                $t->boolean('trial_enabled')->default(true);
            }
        });

        Schema::table('missions', function (Blueprint $t) {
            if (!Schema::hasColumn('missions', 'contract_type')) {
                $t->string('contract_type', 20)->nullable()->after('status');
            }
        });

        Schema::table('employees', function (Blueprint $t) {
            if (!Schema::hasColumn('employees', 'contract_type')) {
                $t->string('contract_type', 20)->default('permanent');
            }
            if (!Schema::hasColumn('employees', 'start_date')) {
                $t->date('start_date')->nullable();
            }
            if (!Schema::hasColumn('employees', 'end_date')) {
                $t->date('end_date')->nullable();
            }
        });

        // Rattrapage des missions existantes (ex : le stage de Lovaniaina)
        Mission::with(['jobOffer', 'profile'])->whereNotNull('job_offer_id')->each(function ($m) {
            if (!$m->jobOffer) return;

            $c = ContractService::build($m->jobOffer, $m->start_at);
            $m->contract_type = $c['contract_type'];
            if ($c['end_at'] && !$m->end_at) $m->end_at = $c['end_at'];
            if ($c['contract_type'] !== 'permanent') {
                $m->is_trial = false;
                $m->trial_ends_at = null;
            }
            $m->save();

            if ($m->profile?->user_id && $m->requesting_company_id) {
                Employee::where('company_id', $m->requesting_company_id)
                    ->where('user_id', $m->profile->user_id)
                    ->update([
                        'contract_type' => $c['contract_type'],
                        'start_date'    => $m->start_at,
                        'end_date'      => $m->end_at,
                    ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('job_offers', fn (Blueprint $t) => $t->dropColumn(['duration_months', 'trial_enabled']));
        Schema::table('missions', fn (Blueprint $t) => $t->dropColumn('contract_type'));
        Schema::table('employees', fn (Blueprint $t) => $t->dropColumn(['contract_type', 'start_date', 'end_date']));
    }
};