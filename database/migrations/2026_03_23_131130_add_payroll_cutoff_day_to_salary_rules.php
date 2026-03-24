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
    Schema::table('salary_rules', function (Blueprint $table) {
        // လစာ တွက်တဲ့ ရက် — e.g. 25 = ၂၅ ရက်မှာ တွက်
        // 31 ဆိုရင် month ရဲ့ last day သုံးမယ်
        $table->unsignedTinyInteger('payroll_cutoff_day')
              ->default(25)
              ->after('is_active');
    });
}

public function down(): void
{
    Schema::table('salary_rules', function (Blueprint $table) {
        $table->dropColumn('payroll_cutoff_day');
    });
}
};
