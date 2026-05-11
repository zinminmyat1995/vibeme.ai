<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * ပြဿနာ: payroll_records ရဲ့ unique key က (payroll_period_id, user_id) ဖြစ်တယ်
 *
 * ဒါကြောင့် May P2 ကို paid လုပ်ပြီး June P2 ထပ်တွက်ရင်
 * (period_2_id, user_5) key နဲ့ ရှာမိတဲ့ May P2 row ကို
 * year=6, month=6, status='draft' နဲ့ OVERWRITE ဖြစ်သွားတာ
 *
 * Fix: unique key မှာ year နဲ့ month ထပ်ပါမှ
 * (payroll_period_id, user_id, year, month) → ကွဲကွဲပြားပြား row သိမ်း
 */
return new class extends Migration
{
    public function up(): void
    {
        // ──────────────────────────────────────────────────────────
        // Step 1: Duplicate rows ကို ဖယ်ထုတ်
        // (old unique key အရ duplicate ဖြစ်နေတဲ့ row တွေ — ဒါမှ new unique add လုပ်လို့ရမယ်)
        // ──────────────────────────────────────────────────────────
        //
        // ဘယ် row ကို keep မလဲ: status priority = paid > confirmed > approved > draft
        // duplicate group ထဲမှာ အကောင်းဆုံး status ရှိတဲ့ row ကို keep, ကျန်တာ delete
        //
        DB::statement("
            DELETE pr
            FROM payroll_records pr
            INNER JOIN payroll_records pr_keep
                ON  pr.payroll_period_id = pr_keep.payroll_period_id
                AND pr.user_id           = pr_keep.user_id
                AND pr.year              = pr_keep.year
                AND pr.month             = pr_keep.month
                AND pr.id                < pr_keep.id
            WHERE pr.status IN ('draft', 'calculated')
        ");

        // ──────────────────────────────────────────────────────────
        // Step 2: ဟောင်း unique constraint drop
        // ──────────────────────────────────────────────────────────
        Schema::table('payroll_records', function (Blueprint $table) {
            // ဟောင်း unique index ရဲ့ နာမည် — original migration မှာ auto-generated
            try {
                $table->dropUnique(['payroll_period_id', 'user_id']);
            } catch (\Exception $e) {
                // ဒီ index နာမည် မတူတဲ့ server မှာဆို catch လုပ်ထား
                try {
                    $table->dropUnique('payroll_records_payroll_period_id_user_id_unique');
                } catch (\Exception $e2) {
                    // Already dropped — skip
                }
            }
        });

        // ──────────────────────────────────────────────────────────
        // Step 3: အသစ် unique constraint ထည့် (year + month ပါ)
        // ──────────────────────────────────────────────────────────
        Schema::table('payroll_records', function (Blueprint $table) {
            $table->unique(
                ['payroll_period_id', 'user_id', 'year', 'month'],
                'pr_period_user_year_month_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('payroll_records', function (Blueprint $table) {
            // အသစ် unique drop
            try {
                $table->dropUnique('pr_period_user_year_month_unique');
            } catch (\Exception $e) {}

            // ဟောင်း unique ပြန်ထည့်
            $table->unique(
                ['payroll_period_id', 'user_id'],
                'payroll_records_payroll_period_id_user_id_unique'
            );
        });
    }
};