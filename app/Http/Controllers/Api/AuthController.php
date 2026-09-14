<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * ✅ Charge les relations importantes de l'utilisateur
     */
    private function loadUserRelations(User $user): User
    {
        return $user->load([
            'professionalProfile',
            'companies',
        ]);
    }

    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'status'   => 'active',
        ]);

        event(new \Illuminate\Auth\Events\Registered($user));

        $token = $user->createToken('talentshare')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie ✅',
            'user'    => $this->loadUserRelations($user),
            'token'   => $token,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['email' => ['Identifiants incorrects.']]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages(['email' => ['Ce compte est désactivé ou suspendu. Contactez le support.']]);
        }

        $token = $user->createToken('talentshare')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie ✅',
            'user'    => $this->loadUserRelations($user),
            'token'   => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès ✅']);
    }

    /**
     * ✅ Charge aussi les relations ici
     */
    public function me(Request $request)
    {
        return response()->json(
            $this->loadUserRelations($request->user())
        );
    }
}