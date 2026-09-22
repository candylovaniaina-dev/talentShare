<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            // ✅ ResourceRequest devient optionnel (peut être une proposition directe B2B)
            $table->foreignId('resource_request_id')->nullable()->change();

            // ✅ NOUVEAUX : Proposition B2B directe
            $table->foreignId('resource_offer_id')->nullable()->after('resource_request_id')
                  ->constrained('resource_offers')->nullOnDelete();

            $table->foreignId('to_company_id')->nullable()->after('proposed_by_company_id')
                  ->constrained('companies')->nullOnDelete();

            // ✅ Description, conditions, expiration
            $table->text('description')->nullable()->after('message');
            $table->text('conditions')->nullable()->after('description');
            $table->date('start_at')->nullable()->after('conditions');
            $table->date('end_at')->nullable()->after('start_at');
            $table->unsignedTinyInteger('workload_percent')->nullable()->after('end_at');
            $table->boolean('remote')->default(false)->after('workload_percent');
            $table->date('expires_at')->nullable()->after('remote');

            // ✅ Suivi
            $table->timestamp('cancelled_at')->nullable()->after('responded_at');

            // Index
            $table->index('to_company_id');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropForeign(['resource_offer_id']);
            $table->dropForeign(['to_company_id']);
            $table->dropColumn([
                'resource_offer_id', 'to_company_id',
                'description', 'conditions', 'start_at', 'end_at',
                'workload_percent', 'remote', 'expires_at', 'cancelled_at',
            ]);
        });
    }
};