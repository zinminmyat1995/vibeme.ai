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
    Schema::table('countries', function (Blueprint $table) {
        $table->integer('lunch_break_minutes')->default(60)->after('work_hours_per_day');
        $table->string('standard_start_time', 5)->default('09:00')->after('lunch_break_minutes');
    });
}

public function down(): void
{
    Schema::table('countries', function (Blueprint $table) {
        $table->dropColumn(['lunch_break_minutes', 'standard_start_time']);
    });
}
};
