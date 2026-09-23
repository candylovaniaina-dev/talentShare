<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('educations', function (Blueprint $table) {
            $table->string('study_level')->nullable()->after('degree');
            $table->boolean('is_young_talent')->default(false)->after('is_current');
        });
    }

    public function down(): void
    {
        Schema::table('educations', function (Blueprint $table) {
            $table->dropColumn(['study_level', 'is_young_talent']);
        });
    }
};