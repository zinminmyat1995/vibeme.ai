<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_by')->constrained('users')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedTinyInteger('hours_per_day')->default(8);
            $table->enum('status', ['upcoming', 'active', 'completed', 'removed'])->default('upcoming');
            $table->text('notes')->nullable();
            $table->timestamps();

            // တစ်ယောက် တစ်ချိန်တည်း project တစ်ခုမှာ တစ်ကြိမ်သာ
            $table->unique(['project_id', 'user_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_assignments');
    }
};