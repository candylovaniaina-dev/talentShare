<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professional_profile_id')->constrained('professional_profiles')->cascadeOnDelete();
            $table->foreignId('proposed_by_company_id')->constrained('companies')->cascadeOnDelete();
            $table->text('message')->nullable();
            $table->unsignedTinyInteger('match_score')->nullable();
            $table->enum('status', ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'])
                  ->default('draft');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique(['resource_request_id', 'professional_profile_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};