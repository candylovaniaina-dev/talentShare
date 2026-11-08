<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('resource_requests', 'mission_type')) {
                $table->string('mission_type', 30)->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            if (Schema::hasColumn('resource_requests', 'mission_type')) {
                $table->dropColumn('mission_type');
            }
        });
    }
};