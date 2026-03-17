<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mail_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');                      // "Meeting Request"
            $table->string('slug');                      // "meeting_request"
            $table->string('icon')->default('📋');
            $table->string('category');                  // meeting/project/hr/general
            $table->string('subject_template');          // "Meeting Request: {topic}"
            $table->longText('body_template');           // HTML with {placeholders}
            $table->json('variables');                   // ["topic","date","location"]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_templates');
    }
};