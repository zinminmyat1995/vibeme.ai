<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            // Drop ot_policy_id — policy is tracked per segment (overtime_request_segments.ot_policy_id)
            if (Schema::hasColumn('overtime_requests', 'ot_policy_id')) {
                $table->dropForeign(['ot_policy_id']);
                $table->dropColumn('ot_policy_id');
            }
        });

        // Add segment_date column to overtime_request_segments if missing
        Schema::table('overtime_request_segments', function (Blueprint $table) {
            if (!Schema::hasColumn('overtime_request_segments', 'segment_date')) {
                $table->date('segment_date')->nullable()->after('overtime_request_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->foreignId('ot_policy_id')->nullable()
                  ->constrained('overtime_policies')->onDelete('set null');
        });
    }
};