<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('issuing_organization', 150);
            $table->date('issue_date');
            $table->string('credential_url')->nullable();
            $table->timestamps();

            $table->index('professional_profile_id');
        });
    }
    public function down(): void { Schema::dropIfExists('certifications'); }
};