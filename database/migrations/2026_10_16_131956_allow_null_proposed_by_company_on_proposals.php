<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            // ⚠️ Important : on drop la FK avant de modifier
            $table->dropForeign(['proposed_by_company_id']);
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->foreignId('proposed_by_company_id')
                ->nullable()
                ->change();
        });

        Schema::table('proposals', function (Blueprint $table) {
            // Recrée la FK mais nullable
            $table->foreign('proposed_by_company_id')
                ->references('id')
                ->on('companies')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropForeign(['proposed_by_company_id']);
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->foreignId('proposed_by_company_id')
                ->nullable(false)
                ->change();
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->foreign('proposed_by_company_id')
                ->references('id')
                ->on('companies')
                ->cascadeOnDelete();
        });
    }
};