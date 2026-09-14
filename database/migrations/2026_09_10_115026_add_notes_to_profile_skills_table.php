<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_skills', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('years_experience');
            $table->boolean('is_featured')->default(false)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('profile_skills', function (Blueprint $table) {
            $table->dropColumn(['notes', 'is_featured']);
        });
    }
};