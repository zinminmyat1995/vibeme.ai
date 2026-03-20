<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            // Approver (management/hr ရွေးပေးမဲ့ user)
            $table->foreignId('approver_id')
                  ->nullable()
                  ->after('ot_policy_id')
                  ->constrained('users')
                  ->onDelete('set null');

            // Admin submit လုပ်တာ auto-approved ဖြစ်ဖို့ approved_at timestamp
            $table->timestamp('approved_at')->nullable()->after('approved_by');

            // Note / reason (rename or keep reason — leave request နဲ့ consistent)
            // reason column ရှိပြီး → ထည့်မလုပ်ဘူး
        });
    }

    public function down(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->dropForeign(['approver_id']);
            $table->dropColumn(['approver_id', 'approved_at']);
        });
    }
};