<?php

use Illuminate\Support\Facades\Route;

// 👇 AJOUTE CETTE LIGNE
Route::get('/login', function () {
    return response()->json(['message' => 'Veuillez vous connecter'], 401);
})->name('login');

Route::get('/', function () {
    return view('welcome');
});