<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brycen_office_id')->constrained('brycen_offices')->onDelete('cascade');
            $table->string('title');
            $table->string('department')->nullable();
            $table->enum('type', ['full_time', 'part_time', 'contract', 'internship'])->default('full_time');
            $table->integer('slots')->default(1);
            $table->text('description');
            $table->text('requirements');
            $table->text('responsibilities')->nullable();
            $table->string('salary_range')->nullable();
            $table->enum('status', ['open', 'closed', 'paused'])->default('open');
            $table->date('deadline')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};