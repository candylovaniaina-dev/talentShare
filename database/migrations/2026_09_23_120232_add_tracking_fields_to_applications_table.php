<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->timestamp('viewed_at')->nullable()->after('status');
            $table->timestamp('shortlisted_at')->nullable()->after('viewed_at');
            $table->timestamp('interview_at')->nullable()->after('shortlisted_at');
            $table->timestamp('decided_at')->nullable()->after('interview_at');
            $table->text('recruiter_notes')->nullable()->after('decided_at');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'viewed_at', 'shortlisted_at', 'interview_at',
                'decided_at', 'recruiter_notes',
            ]);
        });
    }
};