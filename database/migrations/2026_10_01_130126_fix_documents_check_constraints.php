<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Supprime les anciennes contraintes
        DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check');
        DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check');

        // ✅ Ajoute les nouvelles avec TOUS les types autorisés (P0-23)
        DB::statement("
            ALTER TABLE documents 
            ADD CONSTRAINT documents_type_check 
            CHECK (type IN (
                'contract', 'agreement', 'invoice', 'quote', 
                'attachment', 'other'
            ))
        ");

        // ✅ Statuts complets (P0-23)
        DB::statement("
            ALTER TABLE documents 
            ADD CONSTRAINT documents_status_check 
            CHECK (status IN (
                'draft', 'pending', 'signed', 'final', 
                'archived', 'expired', 'cancelled'
            ))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check');
        DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check');

        // Remet les anciennes contraintes
        DB::statement("
            ALTER TABLE documents 
            ADD CONSTRAINT documents_type_check 
            CHECK (type IN ('contract', 'agreement', 'attachment', 'other'))
        ");
        DB::statement("
            ALTER TABLE documents 
            ADD CONSTRAINT documents_status_check 
            CHECK (status IN ('draft', 'final', 'archived'))
        ");
    }
};