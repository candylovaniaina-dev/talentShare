<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_offer_waitlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_offer_id')->constrained('resource_offers')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // waiting | notified | converted | lost | cancelled
            $table->string('status', 20)->default('waiting');
            $table->text('message')->nullable();
            $table->date('desired_start_at')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->unique(['resource_offer_id', 'company_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_offer_waitlists');
    }
};