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
    Schema::table('proposals', function (Blueprint $table) {
        $table->string('interview_mode', 20)->nullable()->after('interview_status'); // visio | onsite
        $table->string('interview_link')->nullable()->after('interview_location');
    });
}

public function down(): void
{
    Schema::table('proposals', function (Blueprint $table) {
        $table->dropColumn(['interview_mode', 'interview_link']);
    });
}
};
