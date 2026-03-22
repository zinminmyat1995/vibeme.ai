<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = Schema::getColumnListing('users');
            if (!in_array('joined_date', $cols)) {
                $table->date('joined_date')->nullable()->after('is_active');
            }
            if (!in_array('employment_type', $cols)) {
                $table->enum('employment_type', ['probation', 'permanent', 'contract'])
                    ->default('probation')
                    ->after('joined_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['joined_date', 'employment_type']);
        });
    }
};