<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->enum('pay_cycle', ['monthly', 'bi-weekly', 'weekly'])->default('monthly')->after('id');
            $table->integer('probation_days')->default(90)->after('pay_cycle');
            $table->string('bank_export_format')->nullable()->after('probation_days'); // e.g. ABA, KBZ, VCB
        });
    }

    public function down(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->dropColumn([
                'pay_cycle',
                'probation_days',
                'bank_export_format',
            ]);
        });
    }
};