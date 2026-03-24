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
        // ① FK တွေ အရင် drop
        $table->dropForeign(['country_id']);

        // ② ဟောင်း unique index drop
        $table->dropUnique('payroll_periods_country_id_month_year_unique');

        // ③ အသစ် unique — period_number ပါ
        $table->unique(
            ['country_id', 'month', 'year', 'period_number'],
            'payroll_periods_country_month_year_period_unique'
        );

        // ④ FK ပြန်ထည့်
        $table->foreign('country_id')->references('id')->on('countries')->onDelete('cascade');
    });
}

public function down(): void
{
    Schema::table('payroll_periods', function (Blueprint $table) {
        $table->dropForeign(['country_id']);
        $table->dropUnique('payroll_periods_country_month_year_period_unique');
        $table->unique(['country_id', 'month', 'year'],
            'payroll_periods_country_id_month_year_unique');
        $table->foreign('country_id')->references('id')->on('countries')->onDelete('cascade');
    });
}
};
