<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_assignments', function (Blueprint $table) {
            // Priority order — Leave impact calculation အတွက်
            // Employee တစ်ယောက် multi-project assign ဆိုရင်
            // ဘယ် project က AM session ထဲ ဘယ် project က PM session ထဲ ဆိုတာ order နဲ့သိမယ်
            // Priority 1 = ပထမဆုံး time slot၊ Priority 2 = နောက် time slot
            $table->unsignedTinyInteger('priority_order')
                  ->default(1)
                  ->after('hours_per_day')
                  ->comment('Time-slot priority for leave impact calculation. 1=first, 2=second...');
        });
    }

    public function down(): void
    {
        Schema::table('project_assignments', function (Blueprint $table) {
            $table->dropColumn('priority_order');
        });
    }
};