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
    Schema::table('payroll_periods', function (Blueprint $table) {
        // monthly=1, semi_monthly=1or2, ten_day=1,2,or3
        $table->unsignedTinyInteger('period_number')->default(1)->after('year');
    });
}

public function down(): void
{
    Schema::table('payroll_periods', function (Blueprint $table) {
        $table->dropColumn('period_number');
    });
}
};
