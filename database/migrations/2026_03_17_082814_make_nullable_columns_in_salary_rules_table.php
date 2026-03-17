<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE salary_rules 
             MODIFY name VARCHAR(255) NULL DEFAULT NULL,
             MODIFY base_salary_type VARCHAR(255) NULL DEFAULT NULL,
             MODIFY bank_export_format VARCHAR(255) NULL DEFAULT NULL,
             MODIFY is_active TINYINT(1) NULL DEFAULT 1"
        );
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE salary_rules 
             MODIFY name VARCHAR(255) NOT NULL,
             MODIFY base_salary_type VARCHAR(255) NOT NULL"
        );
    }
};