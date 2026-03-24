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
        // ① FKs အရင် drop
        $table->dropForeign(['country_id']);
        $table->dropForeign(['generated_by']);

        // ② ဟောင်း unique + columns drop
        $table->dropUnique('payroll_periods_country_month_year_period_unique');
        $table->dropColumn(['month', 'year']);

        // ③ day column ထည့် (period end day, e.g. 12, 24, 31)
        $table->unsignedTinyInteger('day')->after('country_id');

        // ④ period_number ရှိပြီးသား — unique constraint အသစ်
        $table->unique(
            ['country_id', 'day', 'period_number'],
            'payroll_periods_country_day_period_unique'
        );

        // ⑤ FKs ပြန်ထည့်
        $table->foreign('country_id')->references('id')->on('countries')->onDelete('cascade');
        $table->foreign('generated_by')->references('id')->on('users')->onDelete('set null');
    });
}

public function down(): void
{
    Schema::table('payroll_periods', function (Blueprint $table) {
        $table->dropForeign(['country_id']);
        $table->dropForeign(['generated_by']);
        $table->dropUnique('payroll_periods_country_day_period_unique');
        $table->dropColumn('day');
        $table->integer('month');
        $table->integer('year');
        $table->unique(['country_id', 'month', 'year', 'period_number'],
            'payroll_periods_country_month_year_period_unique');
        $table->foreign('country_id')->references('id')->on('countries')->onDelete('cascade');
        $table->foreign('generated_by')->references('id')->on('users')->onDelete('set null');
    });
}
};
