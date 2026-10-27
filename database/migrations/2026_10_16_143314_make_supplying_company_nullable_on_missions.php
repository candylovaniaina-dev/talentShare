<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            // ✅ Drop la FK d'abord
            try {
                $table->dropForeign(['supplying_company_id']);
            } catch (\Exception $e) {
                // Si la FK n'existe pas, on continue
            }
        });

        Schema::table('missions', function (Blueprint $table) {
            // ✅ Rend la colonne nullable
            $table->foreignId('supplying_company_id')->nullable()->change();
        });

        Schema::table('missions', function (Blueprint $table) {
            // ✅ Recrée la FK en nullable
            $table->foreign('supplying_company_id')
                ->references('id')
                ->on('companies')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            try {
                $table->dropForeign(['supplying_company_id']);
            } catch (\Exception $e) {
                // ignore
            }
        });

        Schema::table('missions', function (Blueprint $table) {
            $table->foreignId('supplying_company_id')->nullable(false)->change();
        });

        Schema::table('missions', function (Blueprint $table) {
            $table->foreign('supplying_company_id')
                ->references('id')
                ->on('companies')
                ->cascadeOnDelete();
        });
    }
};