<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Client link — ရှိပြီးသား clients table နဲ့ connect
            $table->foreignId('client_id')
                  ->nullable()
                  ->after('created_by')
                  ->constrained('clients')
                  ->onDelete('set null');

            // Contract value — customer ပေးမဲ့ project တန်ဖိုး (Revenue)
            $table->decimal('contract_value', 15, 2)
                  ->nullable()
                  ->after('client_id')
                  ->comment('Total contract value — used as Revenue in P&L');

            // Currency — USD, MMK, SGD etc.
            $table->string('currency', 10)
                  ->default('USD')
                  ->after('contract_value');

            // Estimated team size — HR က plan လုပ်တဲ့ headcount
            $table->unsignedTinyInteger('est_team_size')
                  ->nullable()
                  ->after('currency')
                  ->comment('Planned headcount — for reference only');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn(['client_id', 'contract_value', 'currency', 'est_team_size']);
        });
    }
};