<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Ajouter le statut "pending_employee"
        DB::statement("
            ALTER TABLE missions 
            DROP CONSTRAINT IF EXISTS missions_status_check
        ");
        
        DB::statement("
            ALTER TABLE missions 
            ADD CONSTRAINT missions_status_check 
            CHECK (status IN ('pending_employee', 'planned', 'active', 'completed', 'cancelled'))
        ");
        
        // Par défaut : pending_employee (au lieu de planned)
        DB::statement("ALTER TABLE missions ALTER COLUMN status SET DEFAULT 'pending_employee'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_status_check");
        DB::statement("
            ALTER TABLE missions 
            ADD CONSTRAINT missions_status_check 
            CHECK (status IN ('planned', 'active', 'completed', 'cancelled'))
        ");
    }
};