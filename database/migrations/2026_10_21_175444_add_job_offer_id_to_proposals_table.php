<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            // ✅ Ajout de la colonne pour lier à l'offre d'emploi
            $table->foreignId('job_offer_id')
                  ->nullable()
                  ->after('resource_offer_id') // optionnel, pour la propreté
                  ->constrained('job_offers')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropForeign(['job_offer_id']);
            $table->dropColumn('job_offer_id');
        });
    }
};