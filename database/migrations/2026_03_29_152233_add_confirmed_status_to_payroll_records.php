<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE payroll_records MODIFY COLUMN status ENUM('draft','calculated','approved','confirmed','paid') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE payroll_records MODIFY COLUMN status ENUM('draft','calculated','approved','paid') NOT NULL DEFAULT 'draft'");
    }
};