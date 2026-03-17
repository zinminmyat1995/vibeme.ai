<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('leave_policies', function (Blueprint $table) {
        $table->enum('applicable_gender', ['all', 'male', 'female'])->default('all')->after('carry_over_days');
        $table->boolean('requires_document')->default(false)->after('applicable_gender');
        $table->boolean('is_active')->default(true)->after('requires_document');
    });
}

public function down(): void
{
    Schema::table('leave_policies', function (Blueprint $table) {
        $table->dropColumn([
            'applicable_gender',
            'requires_document',
            'is_active',
        ]);
    });
}
};