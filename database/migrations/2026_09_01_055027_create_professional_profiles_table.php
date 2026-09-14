<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professional_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->enum('profile_type', ['employee', 'student']);
            $table->string('headline', 180);
            $table->text('bio')->nullable();
            $table->enum('visibility', ['public', 'network', 'private'])->default('network');
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('portfolio_url')->nullable();
            $table->string('cv_path')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();

            $table->index('profile_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_profiles');
    }
};