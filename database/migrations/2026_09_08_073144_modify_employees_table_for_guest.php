<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Rendre user_id nullable (pour les salariés sans compte)
            $table->foreignId('user_id')->nullable()->change();
            // Ajouter des champs pour les infos du salarié sans compte
            $table->string('email')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('has_account')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
            $table->dropColumn(['email', 'first_name', 'last_name', 'phone', 'has_account']);
        });
    }
};