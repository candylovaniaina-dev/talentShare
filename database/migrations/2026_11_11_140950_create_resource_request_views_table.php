<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('resource_request_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_request_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // ✅ Un utilisateur ne peut voir une demande qu'une seule fois
            $table->unique(['resource_request_id', 'user_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('resource_request_views');
    }
};