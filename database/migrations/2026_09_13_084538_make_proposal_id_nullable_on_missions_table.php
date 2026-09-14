<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Retirer la contrainte NOT NULL sur proposal_id
        DB::statement('ALTER TABLE missions ALTER COLUMN proposal_id DROP NOT NULL');
    }

    public function down(): void
    {
        // Remettre la contrainte
        DB::statement('ALTER TABLE missions ALTER COLUMN proposal_id SET NOT NULL');
    }
};