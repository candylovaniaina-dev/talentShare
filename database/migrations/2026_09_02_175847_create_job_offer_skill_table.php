<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_offer_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->enum('min_level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('beginner');
            $table->timestamps();

            $table->unique(['job_offer_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_offer_skill');
    }
};