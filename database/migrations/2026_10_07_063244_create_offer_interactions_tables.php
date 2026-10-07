<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['job_offer_id', 'user_id']);
        });

        Schema::create('offer_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_comments');
        Schema::dropIfExists('offer_likes');
    }
};