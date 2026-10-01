<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, Arial, sans-serif; background: #0A1229; padding: 24px; color: #fff; margin: 0; }
        .card { max-width: 480px; margin: 0 auto; background: #0F1E45; border-radius: 16px; padding: 32px; text-align: center; }
        .badge { display: inline-block; background: rgba(245,158,11,0.15); color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 999px; }
        h1 { font-size: 22px; margin: 16px 0 4px; }
        p { color: #cbd5e1; font-size: 14px; line-height: 1.6; }
        .btn { display: inline-block; background: #34d399; color: #0A1229 !important; text-decoration: none; font-weight: 700; padding: 14px 28px; border-radius: 999px; margin-top: 20px; font-size: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">Dans 30 minutes</span>
        <h1>Bonjour {{ $recipientName }},</h1>
        <p>
            {{ $isRecruiter ? "Votre entretien avec le candidat" : "Votre entretien" }}
            pour « {{ $offer->title }} » commence bientôt.
        </p>
        <a href="{{ $application->interview_link }}" class="btn">Rejoindre maintenant</a>
    </div>
</body>
</html>