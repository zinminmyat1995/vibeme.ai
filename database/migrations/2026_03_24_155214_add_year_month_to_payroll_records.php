<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            // Add year & month for filtering (period template doesn't store these)
            $table->unsignedSmallInteger('year')->nullable()->after('payroll_period_id');
            $table->unsignedTinyInteger('month')->nullable()->after('year');

            $table->index(['payroll_period_id', 'year', 'month']);
        });

        // Also add short_hours to attendance_records if not exists
        if (!Schema::hasColumn('attendance_records', 'short_hours')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                $table->decimal('short_hours', 4, 2)->default(0)->after('work_hours_actual');
            });
        }
    }

    public function down(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->dropIndex(['payroll_period_id', 'year', 'month']);
            $table->dropColumn(['year', 'month']);
        });

        if (Schema::hasColumn('attendance_records', 'short_hours')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                $table->dropColumn('short_hours');
            });
        }
    }
};