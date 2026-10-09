<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            // ✅ Rendre company_id nullable (pour les talents)
            $table->foreignId('company_id')->nullable()->change();

            // ✅ Type d'auteur : company | talent
            $table->enum('author_type', ['company', 'talent'])
                ->default('company')
                ->after('company_id');

            $table->index('author_type');
        });
    }

    public function down(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            $table->dropIndex(['author_type']);
            $table->dropColumn('author_type');
            $table->foreignId('company_id')->nullable(false)->change();
        });
    }
};