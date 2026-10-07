<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('body');
            }
            if (!Schema::hasColumn('messages', 'attachment_name')) {
                $table->string('attachment_name')->nullable()->after('attachment_path');
            }
            if (!Schema::hasColumn('messages', 'attachment_type')) {
                $table->string('attachment_type')->nullable()->after('attachment_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['attachment_path', 'attachment_name', 'attachment_type']);
        });
    }
};