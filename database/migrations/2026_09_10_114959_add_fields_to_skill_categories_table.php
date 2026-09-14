<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skill_categories', function (Blueprint $table) {
            $table->string('icon', 60)->nullable()->after('name');
            $table->unsignedInteger('position')->default(0)->after('parent_id');
            $table->text('description')->nullable()->after('icon');
        });
    }

    public function down(): void
    {
        Schema::table('skill_categories', function (Blueprint $table) {
            $table->dropColumn(['icon', 'position', 'description']);
        });
    }
};