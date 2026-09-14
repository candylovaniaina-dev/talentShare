<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->morphs('documentable'); // crée déjà l'index composite automatiquement
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['contract', 'agreement', 'attachment', 'other'])->default('other');
            $table->string('file_path');
            $table->unsignedSmallInteger('version')->default(1);
            $table->enum('status', ['draft', 'final', 'archived'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};