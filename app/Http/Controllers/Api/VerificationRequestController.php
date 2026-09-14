<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VerificationRequest;
use Illuminate\Http\Request;

class VerificationRequestController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'verifiable_type' => ['required', 'string', 'in:company,university,profile'],
            'verifiable_id' => ['required', 'integer'],
            'document_path' => ['nullable', 'string'],
        ]);

        $map = [
            'company' => \App\Models\Company::class,
            'university' => \App\Models\University::class,
            'profile' => \App\Models\ProfessionalProfile::class,
        ];

        // Vérifier si une demande existe déjà
        $existing = VerificationRequest::where('verifiable_type', $map[$data['verifiable_type']])
            ->where('verifiable_id', $data['verifiable_id'])
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Une demande de vérification est déjà en cours'], 409);
        }

        $verificationRequest = VerificationRequest::create([
            'verifiable_type' => $map[$data['verifiable_type']],
            'verifiable_id' => $data['verifiable_id'],
            'requested_by' => $request->user()->id,
            'document_path' => $data['document_path'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Demande de vérification envoyée ✅',
            'data' => $verificationRequest
        ], 201);
    }
}