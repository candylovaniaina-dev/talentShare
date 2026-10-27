<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            // ✅ On ajoute la colonne contract_type
            $table->string('contract_type')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            $table->dropColumn('contract_type');
        });
    }
};