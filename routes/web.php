<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Page d'accueil
Route::get('/', function () {
    return view('welcome');
});

// ✅ Route signée de vérification email
// Le candidat clique dans l'email → arrive ici → email vérifié → redirigé vers frontend
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = \App\Models\User::findOrFail($id);

    // Vérifie que le hash correspond à l'email de l'user
    if (!hash_equals(sha1($user->email), $hash)) {
        return redirect('http://localhost:5173/email/verify?status=error&message=' . urlencode('Lien invalide ou corrompu.'));
    }

    // Si déjà vérifié
    if ($user->hasVerifiedEmail()) {
        return redirect('http://localhost:5173/email/verify?status=success&message=' . urlencode('Votre email est déjà vérifié.'));
    }

    // ✅ Marque l'email comme vérifié
    $user->markEmailAsVerified();

    // Redirige vers le frontend avec un message de succès
    return redirect('http://localhost:5173/email/verify?status=success&message=' . urlencode('Email vérifié avec succès !'));
})->middleware(['signed'])->name('verification.verify');

// Fallback : si quelqu'un visite /email/verify sans paramètres
Route::get('/email/verify', function () {
    return redirect('http://localhost:5173/email/verify?status=error&message=' . urlencode('Lien de vérification invalide.'));
});