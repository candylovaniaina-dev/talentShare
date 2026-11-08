<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_offers', function (Blueprint $t) {
            if (!Schema::hasColumn('resource_offers', 'visibility')) {
                $t->string('visibility', 20)->default('public'); // public | companies | private
            }
            if (!Schema::hasColumn('resource_offers', 'conditions')) {
                $t->text('conditions')->nullable();
            }
            if (!Schema::hasColumn('resource_offers', 'published_at')) {
                $t->timestamp('published_at')->nullable();
            }
            if (!Schema::hasColumn('resource_offers', 'views_count')) {
                $t->unsignedInteger('views_count')->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::table('resource_offers', function (Blueprint $t) {
            foreach (['visibility', 'conditions', 'published_at', 'views_count'] as $c) {
                if (Schema::hasColumn('resource_offers', $c)) $t->dropColumn($c);
            }
        });
    }
};