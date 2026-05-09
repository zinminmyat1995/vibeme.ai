<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            // Project link — OT တင်တဲ့အချိန် ဘယ် project အတွက်ဆိုတာ သိဖို့
            // nullable — OT ကို project နဲ့ မချိတ်ဘဲ တင်လည်းရတယ် (general OT)
            $table->foreignId('project_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('projects')
                  ->onDelete('set null')
                  ->comment('Which project this OT is for — used in P&L cost calculation');
        });
    }

    public function down(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropColumn('project_id');
        });
    }
};