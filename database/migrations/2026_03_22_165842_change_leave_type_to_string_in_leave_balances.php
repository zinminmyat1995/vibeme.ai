<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // leave_balances.leave_type — enum → string(100)
        // ဘာကြောင့်: LeavePolicy မှာ leave_type ကို free-text (e.g. "Emergency Leave")
        // သိမ်းထားတဲ့အတွက် enum('emergency','annual',...) နဲ့ မကိုက်ဘဲ
        // balance lookup အမြဲ null ပြန်ပြီး remaining=0 ဖြစ်သွားတယ်

        // MySQL မှာ enum → string direct change ကို modify နဲ့ လုပ်ရတယ်
        DB::statement('ALTER TABLE leave_balances MODIFY COLUMN leave_type VARCHAR(100) NOT NULL');
    }

    public function down(): void
    {
        // string → enum ပြန်ပြောင်း (rollback)
        // existing data က enum value နဲ့ မကိုက်ရင် error ဖြစ်နိုင်တဲ့အတွက် truncate လုပ်ပြီးမှ revert
        DB::statement("ALTER TABLE leave_balances MODIFY COLUMN leave_type ENUM('annual','medical','emergency','unpaid','maternity','paternity') NOT NULL");
    }
};