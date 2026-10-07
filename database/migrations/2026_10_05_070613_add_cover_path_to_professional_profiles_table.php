<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('professional_profiles', 'cover_path')) {
                $table->string('cover_path')->nullable()->after('avatar_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('professional_profiles', 'cover_path')) {
                $table->dropColumn('cover_path');
            }
        });
    }
};