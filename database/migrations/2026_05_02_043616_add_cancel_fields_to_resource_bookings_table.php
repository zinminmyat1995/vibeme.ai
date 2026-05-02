<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resource_bookings', function (Blueprint $table) {
            // ဘယ်သူ cancel လုပ်ခဲ့တယ်
            $table->foreignId('cancelled_by')
                  ->nullable()
                  ->after('approved_at')
                  ->constrained('users')
                  ->onDelete('set null');

            // cancel လုပ်တဲ့သူ role (organizer / driver / hr)
            $table->string('cancelled_by_role')->nullable()->after('cancelled_by');

            // driver cancel reason
            $table->text('cancel_reason')->nullable()->after('cancelled_by_role');

            // cancel timestamp
            $table->timestamp('cancelled_at')->nullable()->after('cancel_reason');
        });
    }

    public function down(): void
    {
        Schema::table('resource_bookings', function (Blueprint $table) {
            $table->dropForeign(['cancelled_by']);
            $table->dropColumn(['cancelled_by', 'cancelled_by_role', 'cancel_reason', 'cancelled_at']);
        });
    }
};