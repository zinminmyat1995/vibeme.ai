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
    Schema::table('salary_deductions', function (Blueprint $table) {
        $table->dropForeign(['salary_rule_id']);
        $table->dropColumn('salary_rule_id');
    });
}

public function down(): void
{
    Schema::table('salary_deductions', function (Blueprint $table) {
        $table->foreignId('salary_rule_id')->nullable()->constrained('salary_rules')->onDelete('set null');
    });
}
};
