<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->string('linkedin_url')->nullable()->after('portfolio_url');
            $table->string('github_url')->nullable()->after('linkedin_url');
            $table->string('behance_url')->nullable()->after('github_url');
        });
    }
    public function down(): void {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->dropColumn(['linkedin_url', 'github_url', 'behance_url']);
        });
    }
};