<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brycen_offices', function (Blueprint $table) {
            $table->id();
            $table->string('country_key')->unique();   // 'myanmar','cambodia', etc.
            $table->string('country_name');
            $table->string('company_name');
            $table->string('city');
            $table->text('address');
            $table->string('email');
            $table->string('phone');
            $table->string('website_url');
            $table->string('map_embed_url');
            $table->string('image_path');              // public/images/brycen/{key}.jpg
            $table->text('about');
            $table->string('founded')->nullable();
            $table->string('specialization')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brycen_offices');
    }
};