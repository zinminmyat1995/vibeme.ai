<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('cv_files')->nullable()->after('avatar_url');
            // stores: [{"name":"cv.pdf","path":"user-attach/...","size":"120KB","type":"application/pdf"}]
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('cv_files');
        });
    }
};
