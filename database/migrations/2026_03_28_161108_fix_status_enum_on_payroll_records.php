<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            if (!Schema::hasColumn('payroll_records', 'year')) {
                $table->unsignedSmallInteger('year')->nullable()->after('payroll_period_id');
            }
            if (!Schema::hasColumn('payroll_records', 'month')) {
                $table->unsignedTinyInteger('month')->nullable()->after('year');
            }
        });

        // Fix status enum — must use raw SQL for enum modification
        DB::statement("ALTER TABLE payroll_records MODIFY COLUMN status ENUM('draft','calculated','approved','paid') NOT NULL DEFAULT 'draft'");

        // Add index if not exists
        try {
            Schema::table('payroll_records', function (Blueprint $table) {
                $table->index(['payroll_period_id', 'year', 'month'], 'pr_period_year_month_idx');
            });
        } catch (\Exception $e) {
            // Index already exists — skip
        }
    }

    public function down(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            try { $table->dropIndex('pr_period_year_month_idx'); } catch (\Exception $e) {}
            if (Schema::hasColumn('payroll_records', 'year'))  $table->dropColumn('year');
            if (Schema::hasColumn('payroll_records', 'month')) $table->dropColumn('month');
        });

        DB::statement("ALTER TABLE payroll_records MODIFY COLUMN status ENUM('draft','confirmed') NOT NULL DEFAULT 'draft'");
    }
};