<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->string('name', 180);
            $table->string('slug', 220);
            $table->text('description')->nullable();
            $table->string('level', 50)->nullable();
            $table->integer('duration_months')->nullable();
            $table->string('language', 10)->default('fr');
            $table->decimal('tuition_fee', 12, 2)->nullable();
            $table->string('currency', 3)->default('MGA');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['department_id', 'slug']);
            $table->index('department_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};