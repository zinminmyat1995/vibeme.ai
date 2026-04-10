<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('salary_deductions', function (Blueprint $table) {
        if (!Schema::hasColumn('salary_deductions', 'deduction_type')) {
            $table->enum('deduction_type', ['percentage', 'flat'])
                  ->default('flat')
                  ->after('name');
        }
        // unit_type ဟောင်း ရှိရင် drop
        if (Schema::hasColumn('salary_deductions', 'unit_type')) {
            $table->dropColumn('unit_type');
        }
    });
}

public function down(): void
{
    Schema::table('salary_deductions', function (Blueprint $table) {
        if (Schema::hasColumn('salary_deductions', 'deduction_type')) {
            $table->dropColumn('deduction_type');
        }
        if (!Schema::hasColumn('salary_deductions', 'unit_type')) {
            $table->enum('unit_type', ['per_minute', 'per_day', 'fixed'])->default('fixed');
        }
    });
}
};
