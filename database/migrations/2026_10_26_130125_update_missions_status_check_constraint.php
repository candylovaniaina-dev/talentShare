<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. On supprime l'ancienne contrainte qui n'acceptait pas "trial"
        DB::statement('ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_status_check');

        // 2. On recrée la contrainte en incluant le statut "trial"
        DB::statement("
            ALTER TABLE missions 
            ADD CONSTRAINT missions_status_check 
            CHECK (status IN ('pending_employee', 'planned', 'active', 'completed', 'cancelled', 'trial'))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_status_check');
        DB::statement("
            ALTER TABLE missions 
            ADD CONSTRAINT missions_status_check 
            CHECK (status IN ('pending_employee', 'planned', 'active', 'completed', 'cancelled'))
        ");
    }
};