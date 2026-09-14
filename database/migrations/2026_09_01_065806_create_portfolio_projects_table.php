<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained('portfolios')->cascadeOnDelete();
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->string('project_url')->nullable();
            $table->string('cover_image_path')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index('portfolio_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_projects');
    }
};