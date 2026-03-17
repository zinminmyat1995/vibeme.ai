<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Foreign key အရင် drop လုပ်မယ်
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->dropForeign(['ot_policy_id']);
            $table->dropColumn('ot_policy_id');
        });

        Schema::dropIfExists('overtime_policies');

        Schema::create('overtime_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->string('title');
            $table->enum('rate_type', ['multiplier', 'flat']);
            $table->decimal('rate_value', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Foreign key ပြန်ထည့်မယ်
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->foreignId('ot_policy_id')->nullable()->after('id')->constrained('overtime_policies')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->dropForeign(['ot_policy_id']);
            $table->dropColumn('ot_policy_id');
        });

        Schema::dropIfExists('overtime_policies');
    }
};