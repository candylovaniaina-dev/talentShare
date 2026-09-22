<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // ✅ Métadonnées (une par une, avec vérification)
            if (!Schema::hasColumn('documents', 'original_name')) {
                $table->string('original_name')->nullable()->after('file_path');
            }
            if (!Schema::hasColumn('documents', 'mime_type')) {
                $table->string('mime_type', 100)->nullable()->after('original_name');
            }
            if (!Schema::hasColumn('documents', 'size')) {
                $table->unsignedBigInteger('size')->nullable()->after('mime_type');
            }

            // ⚠️ NE PAS recréer l'index morphs — il existe déjà !
            // (le `$table->morphs('documentable')` initial l'a déjà créé)
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['original_name', 'mime_type', 'size']);
        });
    }
};