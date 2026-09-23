<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->string('university')->nullable()->after('city');
            $table->string('field_of_study')->nullable()->after('university');
            $table->string('study_level')->nullable()->after('field_of_study');
            $table->boolean('is_young_talent')->default(false)->after('study_level');
            $table->boolean('looking_for_opportunity')->default(false)->after('is_young_talent');
        });
    }

    public function down(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'university', 'field_of_study', 'study_level',
                'is_young_talent', 'looking_for_opportunity'
            ]);
        });
    }
};