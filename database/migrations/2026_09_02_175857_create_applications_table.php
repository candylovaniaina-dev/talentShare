<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professional_profile_id')->constrained('professional_profiles')->cascadeOnDelete();
            $table->foreignId('portfolio_id')->nullable()->constrained('portfolios')->nullOnDelete();
            $table->text('cover_letter')->nullable();
            $table->string('cv_path')->nullable();
            $table->enum('status', ['sent', 'viewed', 'shortlisted', 'interview', 'accepted', 'rejected'])
                  ->default('sent');
            $table->timestamps();

            $table->unique(['job_offer_id', 'professional_profile_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};