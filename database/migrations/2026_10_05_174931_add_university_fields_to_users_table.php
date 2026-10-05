<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // L'université à laquelle l'utilisateur est rattaché (pour les étudiants)
            $table->foreignId('university_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('universities')
                  ->nullOnDelete();

            // Statut de rattachement : pending, approved, rejected
            $table->string('university_status', 20)
                  ->nullable()
                  ->after('university_id');

            // Date de validation par l'université
            $table->timestamp('university_verified_at')
                  ->nullable()
                  ->after('university_status');

            // Index pour la recherche
            $table->index('university_id');
            $table->index('university_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['university_id']);
            $table->dropIndex(['university_id']);
            $table->dropIndex(['university_status']);
            $table->dropColumn([
                'university_id',
                'university_status',
                'university_verified_at',
            ]);
        });
    }
};