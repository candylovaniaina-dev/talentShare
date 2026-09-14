<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title', 180);
            $table->text('description');
            $table->date('start_at');
            $table->date('end_at');
            $table->unsignedTinyInteger('workload_percent')->default(100);
            $table->boolean('remote')->default(false);
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->enum('status', ['draft', 'published', 'closed', 'expired'])->default('draft');
            $table->date('expires_at')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['start_at', 'end_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_requests');
    }
};