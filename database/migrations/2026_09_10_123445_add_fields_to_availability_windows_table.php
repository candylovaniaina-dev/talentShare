<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('availability_windows', function (Blueprint $table) {
            // Charge : unité + valeur (au lieu de juste percent)
            $table->enum('workload_unit', ['percentage', 'hours_per_week', 'days_per_week'])
                  ->default('percentage')->after('workload_percent');
            $table->unsignedInteger('workload_value')->default(100)->after('workload_unit');

            // Type de disponibilité
            $table->enum('type', ['full_time', 'part_time', 'freelance', 'internship', 'mission'])
                  ->default('part_time')->after('status');

            // Localisation
            $table->enum('location_type', ['onsite', 'remote', 'hybrid'])
                  ->default('onsite')->after('remote');
            $table->string('location_city', 100)->nullable()->after('location_type');

            // Notes & récurrence
            $table->text('notes')->nullable()->after('location_city');
            $table->boolean('is_recurring')->default(false)->after('notes');
            $table->string('recurrence_pattern', 50)->nullable()->after('is_recurring');

            // Historique
            $table->softDeletes();

            // Index
            $table->index(['professional_profile_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('availability_windows', function (Blueprint $table) {
            $table->dropColumn([
                'workload_unit', 'workload_value', 'type', 'location_type',
                'location_city', 'notes', 'is_recurring', 'recurrence_pattern', 'deleted_at',
            ]);
        });
    }
};