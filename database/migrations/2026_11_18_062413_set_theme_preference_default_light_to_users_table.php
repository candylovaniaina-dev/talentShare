<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // On utilise DB::statement pour PostgreSQL (évite d'installer doctrine/dbal)
        DB::statement("ALTER TABLE users ALTER COLUMN theme_preference SET DEFAULT 'light'");
        
        // Optionnel : Mettre à jour les utilisateurs existants qui n'ont pas de thème
        DB::table('users')->whereNull('theme_preference')->update(['theme_preference' => 'light']);
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users ALTER COLUMN theme_preference DROP DEFAULT");
    }
};