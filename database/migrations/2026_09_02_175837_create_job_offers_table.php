<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title', 180);
            $table->text('description');
            $table->enum('offer_type', [
                'internship', 'apprenticeship', 'student_project', 'junior_mission',
                'freelance', 'fixed_term', 'permanent', 'first_job',
            ]);
            $table->string('duration_text', 100)->nullable();
            $table->boolean('remote')->default(false);
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->unsignedInteger('salary_min')->nullable();
            $table->unsignedInteger('salary_max')->nullable();
            $table->string('currency', 3)->default('MGA');
            $table->text('criteria')->nullable();
            $table->date('application_deadline')->nullable();
            $table->enum('status', ['draft', 'published', 'closed', 'expired'])->default('draft');
            $table->timestamps();

            $table->index(['status', 'offer_type']);
            $table->index(['country', 'city']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_offers');
    }
};