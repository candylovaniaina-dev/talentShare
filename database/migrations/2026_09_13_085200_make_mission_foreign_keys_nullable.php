<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Rendre nullable les colonnes manquantes
        // proposal_id est déjà nullable (migration précédente)
        DB::statement('ALTER TABLE missions ALTER COLUMN requesting_company_id DROP NOT NULL');
        DB::statement('ALTER TABLE missions ALTER COLUMN resource_offer_id DROP NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE missions ALTER COLUMN requesting_company_id SET NOT NULL');
        DB::statement('ALTER TABLE missions ALTER COLUMN resource_offer_id SET NOT NULL');
    }
};