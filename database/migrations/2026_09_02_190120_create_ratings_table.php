<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rated_by')->constrained('users')->cascadeOnDelete();
            $table->enum('rater_role', ['company', 'talent']);
            $table->unsignedTinyInteger('skills_score');
            $table->unsignedTinyInteger('quality_score');
            $table->unsignedTinyInteger('communication_score');
            $table->unsignedTinyInteger('punctuality_score');
            $table->unsignedTinyInteger('collaboration_score');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['mission_id', 'rated_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};