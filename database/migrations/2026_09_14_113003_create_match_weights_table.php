<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_weights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('weight_skills')->default(40);
            $table->integer('weight_location')->default(15);
            $table->integer('weight_availability')->default(15);
            $table->integer('weight_profile_type')->default(10);
            $table->integer('weight_verified')->default(5);
            $table->integer('weight_rating')->default(10);
            $table->integer('weight_rate')->default(5);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_weights');
    }
};