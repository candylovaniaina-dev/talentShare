<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->string('contract_kind', 20)->nullable();        // internship | job
            $table->string('interview_status', 20)->nullable();     // pending | scheduled | validated | failed
            $table->dateTime('interview_at')->nullable();
            $table->string('interview_location')->nullable();
            $table->text('interview_notes')->nullable();
            $table->dateTime('interview_validated_at')->nullable();
        });

        Schema::table('missions', function (Blueprint $table) {
            if (!Schema::hasColumn('missions', 'is_trial')) {
                $table->boolean('is_trial')->default(false);
            }
            if (!Schema::hasColumn('missions', 'trial_ends_at')) {
                $table->date('trial_ends_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn([
                'contract_kind', 'interview_status', 'interview_at',
                'interview_location', 'interview_notes', 'interview_validated_at',
            ]);
        });

        Schema::table('missions', function (Blueprint $table) {
            $table->dropColumn(['is_trial', 'trial_ends_at']);
        });
    }
};