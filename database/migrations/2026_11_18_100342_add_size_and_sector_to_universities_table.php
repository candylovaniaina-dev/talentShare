<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('universities', function (Blueprint $table) {
            if (!Schema::hasColumn('universities', 'size')) {
                $table->string('size')->nullable()->after('description');
            }
            if (!Schema::hasColumn('universities', 'sector')) {
                $table->string('sector')->nullable()->after('size');
            }
        });
    }

    public function down(): void
    {
        Schema::table('universities', function (Blueprint $table) {
            $table->dropColumn(['size', 'sector']);
        });
    }
};