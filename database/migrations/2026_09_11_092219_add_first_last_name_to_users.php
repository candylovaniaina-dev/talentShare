<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->nullable()->after('name');
            $table->string('last_name', 100)->nullable()->after('first_name');
            $table->string('country', 100)->nullable()->after('last_name');
            // ❌ SUPPRIME cette ligne :
            // $table->string('phone', 30)->nullable()->after('country');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // ❌ Retire aussi 'phone' du drop
            $table->dropColumn(['first_name', 'last_name', 'country']);
        });
    }
};