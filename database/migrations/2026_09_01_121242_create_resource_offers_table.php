<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('professional_profile_id')->constrained('professional_profiles')->cascadeOnDelete();
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->enum('mission_type', ['mission', 'staffing', 'freelance', 'other'])->default('mission');
            $table->date('start_at');
            $table->date('end_at');
            $table->unsignedTinyInteger('workload_percent')->default(100);
            $table->boolean('remote')->default(false);
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->enum('visibility', ['public', 'network', 'private'])->default('public');
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->timestamps();

            $table->index(['status', 'visibility']);
            $table->index(['start_at', 'end_at']);
            $table->index(['country', 'city']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_offers');
    }
};