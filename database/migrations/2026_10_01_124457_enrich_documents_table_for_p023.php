<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // ✅ Types de documents (contrats, conventions...)
            if (!Schema::hasColumn('documents', 'document_type')) {
                $table->string('document_type', 50)->default('attachment')->after('type');
            }

            // ✅ Statut (draft, pending, signed, expired, cancelled)
            if (!Schema::hasColumn('documents', 'status')) {
                $table->string('status', 30)->default('draft')->after('document_type');
            }

            // ✅ Version actuelle
            if (!Schema::hasColumn('documents', 'current_version')) {
                $table->integer('current_version')->default(1)->after('status');
            }

            // ✅ Métadonnées
            if (!Schema::hasColumn('documents', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('current_version');
            }
            if (!Schema::hasColumn('documents', 'signed_at')) {
                $table->timestamp('signed_at')->nullable()->after('expires_at');
            }
            if (!Schema::hasColumn('documents', 'signed_by')) {
                $table->foreignId('signed_by')->nullable()->constrained('users')->nullOnDelete()->after('signed_at');
            }
            if (!Schema::hasColumn('documents', 'notes')) {
                $table->text('notes')->nullable()->after('signed_by');
            }

            // ✅ Index pour recherches fréquentes
            $table->index(['document_type', 'status']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['document_type', 'status']);
            $table->dropIndex(['expires_at']);
            $table->dropColumn([
                'document_type', 'status', 'current_version',
                'expires_at', 'signed_at', 'signed_by', 'notes',
            ]);
        });
    }
};