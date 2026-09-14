<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $request->user()->update($data);

        return $request->user()->fresh();
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        if (! Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => ['Mot de passe actuel incorrect.']]);
        }

        $request->user()->update(['password' => Hash::make($data['password'])]);

        // Révoque tous les autres tokens par sécurité, garde uniquement la session courante
        $request->user()->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    public function deactivate(Request $request)
    {
        $request->user()->update(['status' => 'inactive']);
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Compte désactivé. Contactez le support pour le réactiver.']);
    }

    public function destroy(Request $request)
    {
        $request->validate(['password' => ['required']]);

        if (! Hash::check($request->password, $request->user()->password)) {
            throw ValidationException::withMessages(['password' => ['Mot de passe incorrect.']]);
        }

        $request->user()->tokens()->delete();
        $request->user()->delete(); // soft delete

        return response()->json(['message' => 'Compte supprimé.']);
    }
    public function updateProfile(Request $request)
{
    $data = $request->validate([
        'first_name' => ['nullable', 'string', 'max:100'],
        'last_name'  => ['nullable', 'string', 'max:100'],
        'country'    => ['nullable', 'string', 'max:100'],
        'phone'      => ['nullable', 'string', 'max:30'],
    ]);

    $user = $request->user();
    $user->update($data);

    // Sync name = "First Last"
    if (!empty($data['first_name']) && !empty($data['last_name'])) {
        $user->update(['name' => trim("{$data['first_name']} {$data['last_name']}")]);
    } elseif (!empty($data['first_name'])) {
        $user->update(['name' => $data['first_name']]);
    }

    return response()->json($user->fresh());
}
}