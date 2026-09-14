<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_offers', function (Blueprint $table) {
            // Enrichissements
            $table->text('conditions')->nullable()->after('description');
            $table->unsignedInteger('daily_rate')->nullable()->after('conditions');
            $table->unsignedInteger('hourly_rate')->nullable()->after('daily_rate');
            $table->enum('workload_unit', ['percentage', 'hours_per_week', 'days_per_week'])
                  ->default('percentage')->after('workload_percent');
            $table->unsignedInteger('workload_value')->default(100)->after('workload_unit');
            $table->enum('location_type', ['onsite', 'remote', 'hybrid'])
                  ->default('onsite')->after('remote');
            $table->string('location_city', 100)->nullable()->after('location_type');
            $table->softDeletes();
        });

        // Table pivot compétences
        Schema::create('resource_offer_skill', function (Blueprint $table) {
            $table->foreignId('resource_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->enum('level', ['beginner', 'intermediate', 'advanced', 'expert'])->nullable();
            $table->primary(['resource_offer_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_offer_skill');
        Schema::table('resource_offers', function (Blueprint $table) {
            $table->dropColumn([
                'conditions', 'daily_rate', 'hourly_rate',
                'workload_unit', 'workload_value',
                'location_type', 'location_city', 'deleted_at',
            ]);
        });
    }
};