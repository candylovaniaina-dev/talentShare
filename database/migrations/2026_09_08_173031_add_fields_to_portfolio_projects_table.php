<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('portfolio_projects', function (Blueprint $table) {
            // Ajouter les colonnes si elles n'existent pas
            if (!Schema::hasColumn('portfolio_projects', 'start_date')) {
                $table->date('start_date')->nullable()->after('cover_image_path');
            }
            if (!Schema::hasColumn('portfolio_projects', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
            if (!Schema::hasColumn('portfolio_projects', 'technologies')) {
                $table->json('technologies')->nullable()->after('end_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('portfolio_projects', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date', 'technologies']);
        });
    }
};