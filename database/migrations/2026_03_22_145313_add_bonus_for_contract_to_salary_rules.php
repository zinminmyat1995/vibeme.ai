<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            if (!in_array('bonus_for_contract', Schema::getColumnListing('salary_rules'))) {
                $table->boolean('bonus_for_contract')->default(false)->after('bonus_during_probation');
            }
        });
    }

    public function down(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->dropColumn('bonus_for_contract');
        });
    }
};