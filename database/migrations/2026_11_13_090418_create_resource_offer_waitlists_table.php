<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('resource_offer_waitlists')) {
            return; // la table existe déjà en local
        }

        Schema::create('resource_offer_waitlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20)->default('waiting'); // waiting, notified, lost, converted, cancelled
            $table->text('message')->nullable();
            $table->date('desired_start_at')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->index(['resource_offer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_offer_waitlists');
    }
};