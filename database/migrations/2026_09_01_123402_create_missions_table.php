<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('requesting_company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('supplying_company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('professional_profile_id')->constrained('professional_profiles')->cascadeOnDelete();
            $table->date('start_at');
            $table->date('end_at');
            $table->unsignedTinyInteger('workload_percent')->default(100);
            $table->boolean('remote')->default(false);
            $table->enum('status', ['planned', 'active', 'completed', 'cancelled'])->default('planned');
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};