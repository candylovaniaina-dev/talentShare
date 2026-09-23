<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Préférence de thème : light, dark, system
            $table->string('theme_preference', 20)->default('dark')->after('status');

            // Taille de police : small, normal, large
            $table->string('font_size', 20)->default('normal')->after('theme_preference');

            // Contraste élevé (accessibilité)
            $table->boolean('high_contrast')->default(false)->after('font_size');

            // Réduire les animations (accessibilité)
            $table->boolean('reduce_motion')->default(false)->after('high_contrast');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'theme_preference',
                'font_size',
                'high_contrast',
                'reduce_motion',
            ]);
        });
    }
};