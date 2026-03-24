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
    Schema::table('leave_requests', function (Blueprint $table) {
        // Policy ကနေ inherit လုပ်တယ် — Absent = 0, paid leave = 1
        $table->boolean('is_paid')->default(true)->after('total_days');
    });
}

public function down(): void
{
    Schema::table('leave_requests', function (Blueprint $table) {
        $table->dropColumn('is_paid');
    });
}
};
