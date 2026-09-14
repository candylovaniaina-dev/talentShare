<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_request_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->enum('min_level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('intermediate');
            $table->timestamps();

            $table->unique(['resource_request_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_request_skill');
    }
};