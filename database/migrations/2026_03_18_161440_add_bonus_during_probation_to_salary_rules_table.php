<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->boolean('bonus_during_probation')->default(false)->after('probation_days');
        });
    }

    public function down(): void
    {
        Schema::table('salary_rules', function (Blueprint $table) {
            $table->dropColumn('bonus_during_probation');
        });
    }
};