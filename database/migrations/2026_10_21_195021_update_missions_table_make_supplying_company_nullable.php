<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            // ✅ On rend la colonne nullable
            // On doit d'abord supprimer la contrainte de clé étrangère
            $table->dropForeign(['supplying_company_id']);
            
            // Ensuite on modifie la colonne
            $table->foreignId('supplying_company_id')
                  ->nullable()
                  ->change();
                  
            // On remet la contrainte (qui acceptera maintenant null)
            $table->foreign('supplying_company_id')
                  ->references('id')
                  ->on('companies')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->dropForeign(['supplying_company_id']);
            $table->foreignId('supplying_company_id')
                  ->nullable(false)
                  ->change();
            $table->foreign('supplying_company_id')
                  ->references('id')
                  ->on('companies')
                  ->cascadeOnDelete();
        });
    }
};