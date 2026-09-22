<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            // === Q6 : Champs additionnels ===
            $table->integer('budget_min')->nullable()->after('workload_percent');
            $table->integer('budget_max')->nullable()->after('budget_min');
            $table->unsignedSmallInteger('positions_count')->default(1)->after('budget_max');
            $table->string('urgency', 20)->default('normal')->after('positions_count');
            $table->json('tags')->nullable()->after('urgency');

            // === Stats ===
            $table->unsignedInteger('views_count')->default(0)->after('tags');
            $table->unsignedInteger('proposals_count')->default(0)->after('views_count');

            // === Expiration enrichie ===
            $table->string('closed_reason', 20)->nullable()->after('expires_at');
            $table->timestamp('closed_at')->nullable()->after('closed_reason');

            // Index
            $table->index(['status', 'expires_at']);
            $table->index(['urgency']);
        });
    }

    public function down(): void
    {
        Schema::table('resource_requests', function (Blueprint $table) {
            $table->dropIndex(['status', 'expires_at']);
            $table->dropIndex(['urgency']);
            $table->dropColumn([
                'budget_min', 'budget_max', 'positions_count', 'urgency', 'tags',
                'views_count', 'proposals_count', 'closed_reason', 'closed_at',
            ]);
        });
    }
};