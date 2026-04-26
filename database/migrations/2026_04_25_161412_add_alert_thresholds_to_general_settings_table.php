<?php
// database/migrations/xxxx_add_alert_thresholds_to_salary_rules_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            // Late alert: how many late per month before alert
            $table->unsignedTinyInteger('late_alert_threshold')
                  ->default(3)
                  ->after('pay_cycle')
                  ->comment('Alert HR when employee is late X times/month');

            // Absent alert: how many consecutive absent days before alert
            $table->unsignedTinyInteger('absent_alert_threshold')
                  ->default(2)
                  ->after('late_alert_threshold')
                  ->comment('Alert HR when employee is absent X consecutive days');

            // Enable/disable alerts per country
            $table->boolean('late_alert_enabled')->default(true)->after('absent_alert_threshold');
            $table->boolean('absent_alert_enabled')->default(true)->after('late_alert_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->dropColumn([
                'late_alert_threshold',
                'absent_alert_threshold',
                'late_alert_enabled',
                'absent_alert_enabled',
            ]);
        });
    }
};