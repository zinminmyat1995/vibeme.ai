<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('overtime_policies', function (Blueprint $table) {
            $table->enum('day_type', ['weekday', 'weekend', 'public_holiday'])
                ->nullable()->after('title');
            $table->enum('shift_type', ['day', 'night', 'both'])
                ->nullable()->after('day_type');
            $table->unique(['country_id', 'day_type', 'shift_type'], 'uq_country_day_shift');
        });
    }

    public function down(): void
    {
        Schema::table('overtime_policies', function (Blueprint $table) {
            $table->dropUnique('uq_country_day_shift');
            $table->dropColumn(['day_type', 'shift_type']);
        });
    }   
};