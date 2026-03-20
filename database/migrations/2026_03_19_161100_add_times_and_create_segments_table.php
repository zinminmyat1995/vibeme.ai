<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. overtime_requests → parent record ──
        Schema::table('overtime_requests', function (Blueprint $table) {
            $cols = Schema::getColumnListing('overtime_requests');

            if (!in_array('start_time', $cols)) {
                $table->time('start_time')->nullable()->after('date');
            }
            if (!in_array('end_time', $cols)) {
                $table->time('end_time')->nullable()->after('start_time');
            }
            if (!in_array('approver_id', $cols)) {
                $table->foreignId('approver_id')->nullable()->after('user_id')
                      ->constrained('users')->onDelete('set null');
            }
            if (!in_array('approved_at', $cols)) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
        });

        // ── 2. overtime_request_segments — child records ──
        Schema::create('overtime_request_segments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('overtime_request_id')
                  ->constrained('overtime_requests')
                  ->onDelete('cascade');
            $table->foreignId('ot_policy_id')
                  ->nullable()
                  ->constrained('overtime_policies')
                  ->onDelete('set null');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('hours', 5, 2);           // auto-calculated
            $table->decimal('hours_approved', 5, 2)->default(0); // approver adjust
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_request_segments');

        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->dropForeign(['approver_id']);
            $table->dropColumn(['start_time', 'end_time', 'approver_id', 'approved_at']);
        });
    }
};