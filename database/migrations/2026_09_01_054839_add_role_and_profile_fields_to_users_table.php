<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'company', 'employee', 'student', 'university'])
                  ->default('employee')->after('email');
            $table->string('phone')->nullable()->after('role');
            $table->string('avatar_path')->nullable()->after('phone');
            $table->enum('status', ['active', 'inactive', 'suspended'])
                  ->default('active')->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'avatar_path', 'status']);
        });
    }
};