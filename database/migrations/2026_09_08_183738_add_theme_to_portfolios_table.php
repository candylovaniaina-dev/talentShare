<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('portfolios', function (Blueprint $table) {
            $table->enum('theme', ['minimal', 'bold', 'corporate', 'vibrant'])->default('minimal')->after('visibility');
            $table->string('accent_color', 7)->default('#6EE7C8')->after('theme');
        });
    }
    public function down(): void {
        Schema::table('portfolios', function (Blueprint $table) {
            $table->dropColumn(['theme', 'accent_color']);
        });
    }
};