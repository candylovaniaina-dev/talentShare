<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\VerificationRequest;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function index()
    {
        return VerificationRequest::where('status', 'pending')->with('verifiable', 'requester')->get();
    }

    public function review(Request $request, VerificationRequest $verificationRequest)
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_note' => ['nullable', 'string'],
        ]);

        $verificationRequest->update([...$data, 'reviewed_by' => $request->user()->id]);

        if ($data['status'] === 'approved') {
            $verificationRequest->verifiable()->update(['is_verified' => true]);
        }

        return $verificationRequest;
    }
}