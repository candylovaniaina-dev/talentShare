<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            // ✅ Ajouter UNIQUEMENT les colonnes manquantes
            if (!Schema::hasColumn('applications', 'interview_at')) {
                $table->timestamp('interview_at')->nullable()->after('recruiter_notes');
            }
            if (!Schema::hasColumn('applications', 'interview_link')) {
                $table->string('interview_link')->nullable()->after('interview_at');
            }
            if (!Schema::hasColumn('applications', 'interview_timezone')) {
                $table->string('interview_timezone')->default('Indian/Antananarivo')->after('interview_link');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (Schema::hasColumn('applications', 'interview_link')) {
                $table->dropColumn('interview_link');
            }
            if (Schema::hasColumn('applications', 'interview_timezone')) {
                $table->dropColumn('interview_timezone');
            }
            // On ne supprime PAS interview_at car elle vient d'une autre migration
        });
    }
};