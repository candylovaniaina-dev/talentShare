<?php

namespace App\Http\Middleware;

use App\Services\UniversityContext;
use Closure;
use Illuminate\Http\Request;

class EnsureUniversity
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || $user->role !== 'university') {
            return response()->json(['message' => 'Accès réservé aux comptes établissement.'], 403);
        }

        $ctx = UniversityContext::resolve($user);
        if (! $ctx) {
            return response()->json([
                'message' => "Aucun établissement n'est associé à ce compte.",
                'code'    => 'NO_UNIVERSITY',
            ], 404);
        }

        $request->attributes->set('university', $ctx['university']);
        $request->attributes->set('university_role', $ctx['role']);

        return $next($request);
    }
}
