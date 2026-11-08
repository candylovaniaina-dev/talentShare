<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            if (!Schema::hasColumn('missions', 'title')) {
                $table->string('title')->nullable()->after('id');
            }
            if (!Schema::hasColumn('missions', 'job_offer_id')) {
                $table->foreignId('job_offer_id')
                    ->nullable()
                    ->after('proposal_id')
                    ->constrained('job_offers')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            if (Schema::hasColumn('missions', 'job_offer_id')) {
                $table->dropConstrainedForeignId('job_offer_id');
            }
            if (Schema::hasColumn('missions', 'title')) {
                $table->dropColumn('title');
            }
        });
    }
};