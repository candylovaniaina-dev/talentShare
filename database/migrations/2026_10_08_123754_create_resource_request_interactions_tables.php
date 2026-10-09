<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_request_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_request_id')->constrained('resource_requests')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['resource_request_id', 'user_id']);
        });

        Schema::create('resource_request_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_request_id')->constrained('resource_requests')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_request_comments');
        Schema::dropIfExists('resource_request_likes');
    }
};