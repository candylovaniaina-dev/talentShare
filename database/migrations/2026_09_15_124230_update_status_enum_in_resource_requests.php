<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("
                ALTER TABLE resource_requests
                MODIFY COLUMN status ENUM('draft', 'published', 'paused', 'closed', 'filled', 'expired')
                DEFAULT 'draft'
            ");
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE resource_requests DROP CONSTRAINT IF EXISTS resource_requests_status_check");
            DB::statement("
                ALTER TABLE resource_requests
                ADD CONSTRAINT resource_requests_status_check
                CHECK (status IN ('draft', 'published', 'paused', 'closed', 'filled', 'expired'))
            ");
        }
        // SQLite : pas besoin (les enum sont stockés en TEXT)
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("
                ALTER TABLE resource_requests
                MODIFY COLUMN status ENUM('draft', 'published', 'closed', 'expired')
                DEFAULT 'draft'
            ");
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE resource_requests DROP CONSTRAINT IF EXISTS resource_requests_status_check");
            DB::statement("
                ALTER TABLE resource_requests
                ADD CONSTRAINT resource_requests_status_check
                CHECK (status IN ('draft', 'published', 'closed', 'expired'))
            ");
        }
    }
};