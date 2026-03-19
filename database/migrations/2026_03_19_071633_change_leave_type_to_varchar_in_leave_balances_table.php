<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE leave_balances MODIFY leave_type VARCHAR(100) NOT NULL"
        );
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE leave_balances MODIFY leave_type ENUM('annual','medical','emergency','unpaid','maternity','paternity') NOT NULL"
        );
    }
};