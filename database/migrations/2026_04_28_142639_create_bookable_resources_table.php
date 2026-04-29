<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookable_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')
                  ->nullable()
                  ->constrained('countries')
                  ->onDelete('set null');

            $table->enum('type', ['room', 'car']);

            $table->string('name');                              // "Meeting Room A" / "Toyota Camry"
            $table->string('location')->nullable();              // Room: "Floor 2" / Car: "Parking B1"
            $table->unsignedTinyInteger('capacity')->nullable(); // Room: seats / Car: passengers
            $table->text('rules')->nullable();                   // Room: "No food allowed, Max 2 hours"
            $table->string('plate_number')->nullable();          // Car only
            $table->string('photo')->nullable();

            // Car → Driver one-to-one
            $table->foreignId('driver_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['country_id', 'type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookable_resources');
    }
};