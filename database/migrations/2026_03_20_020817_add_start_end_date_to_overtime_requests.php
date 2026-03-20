<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            // date → start_date rename
            $table->renameColumn('date', 'start_date');
        });

        Schema::table('overtime_requests', function (Blueprint $table) {
            // end_date ထည့် (start_date အပြီး)
            $cols = Schema::getColumnListing('overtime_requests');
            if (!in_array('end_date', $cols)) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });

        // segments table မှာ segment ကိုင် date ထည့် (multi-day မှာ ဘယ်ရက်ဆိုင်မလဲ track)
        Schema::table('overtime_request_segments', function (Blueprint $table) {
            $cols = Schema::getColumnListing('overtime_request_segments');
            if (!in_array('segment_date', $cols)) {
                $table->date('segment_date')->nullable()->after('overtime_request_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('overtime_request_segments', function (Blueprint $table) {
            $table->dropColumn('segment_date');
        });

        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->dropColumn('end_date');
        });

        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->renameColumn('start_date', 'date');
        });
    }
};