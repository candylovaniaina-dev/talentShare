<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('availability_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_profile_id')
                  ->constrained('professional_profiles')->cascadeOnDelete();
            $table->date('start_at');
            $table->date('end_at');
            $table->enum('status', ['available', 'partially_available', 'unavailable', 'on_mission'])
                  ->default('available');
            $table->unsignedTinyInteger('workload_percent')->default(100);
            $table->boolean('remote')->default(false);
            $table->timestamps();

            $table->index(['professional_profile_id', 'start_at', 'end_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availability_windows');
    }
};