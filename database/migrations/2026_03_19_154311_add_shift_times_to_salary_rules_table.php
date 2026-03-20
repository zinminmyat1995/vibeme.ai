<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            // Day shift time range — Night က day မဟုတ်တာ အကုန်ဖြစ်တာမို့ 2 columns ပဲ လို
            $table->time('day_shift_start')->nullable()->default('08:00:00')->after('working_days_per_week');
            $table->time('day_shift_end')->nullable()->default('18:00:00')->after('day_shift_start');
        });
    }

    public function down(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->dropColumn(['day_shift_start', 'day_shift_end']);
        });
    }
};