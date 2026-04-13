<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    // database/migrations/2026_xx_xx_fix_overtime_hours_precision.php
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            // 4,2 → 8,2  (max 999999.99 hrs — တော်တော် enough)
            $table->decimal('hours_requested', 8, 2)->change();
            $table->decimal('hours_approved',  8, 2)->change();
        });

        Schema::table('overtime_request_segments', function (Blueprint $table) {
            // ဒီကောင်တွေလည်း တူပဲ fix လုပ်ထားသင့်တယ်
            $table->decimal('hours',          8, 2)->change();
            $table->decimal('hours_approved', 8, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->decimal('hours_requested', 4, 2)->change();
            $table->decimal('hours_approved',  4, 2)->change();
        });

        Schema::table('overtime_request_segments', function (Blueprint $table) {
            $table->decimal('hours',          5, 2)->change();
            $table->decimal('hours_approved', 5, 2)->change();
        });
    }
};
