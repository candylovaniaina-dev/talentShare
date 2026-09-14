<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_profile_id')->unique()
                  ->constrained('professional_profiles')->cascadeOnDelete();
            $table->string('public_slug', 220)->unique();
            $table->string('title', 180);
            $table->text('summary')->nullable();
            $table->enum('visibility', ['public', 'private'])->default('public');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolios');
    }
};