<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE leave_requests MODIFY leave_type VARCHAR(100) NOT NULL"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE leave_requests MODIFY leave_type ENUM('annual','medical','emergency','unpaid','maternity','paternity') NOT NULL"
        );
    }
};