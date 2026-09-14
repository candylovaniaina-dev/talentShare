<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_profile_id')
                  ->constrained('professional_profiles')->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained('skills')->cascadeOnDelete();
            $table->enum('level', ['beginner', 'intermediate', 'advanced', 'expert'])
                  ->default('intermediate');
            $table->unsignedSmallInteger('years_experience')->nullable();
            $table->timestamps();

            $table->unique(['professional_profile_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_skills');
    }
};