<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $cols = Schema::getColumnListing('salary_rules');
            if (!in_array('work_start', $cols)) {
                $table->time('work_start')->nullable()->default('08:00:00')->after('day_shift_end');
            }
            if (!in_array('work_end', $cols)) {
                $table->time('work_end')->nullable()->default('17:00:00')->after('work_start');
            }
        });
    }

    public function down(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->dropColumn(['work_start', 'work_end']);
        });
    }
};