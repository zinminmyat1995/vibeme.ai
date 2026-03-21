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
            if (!in_array('lunch_start', $cols)) {
                $table->time('lunch_start')->nullable()->default('12:00:00')->after('day_shift_end');
            }
            if (!in_array('lunch_end', $cols)) {
                $table->time('lunch_end')->nullable()->default('13:00:00')->after('lunch_start');
            }
        });
    }

    public function down(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->dropColumn(['lunch_start', 'lunch_end']);
        });
    }
};