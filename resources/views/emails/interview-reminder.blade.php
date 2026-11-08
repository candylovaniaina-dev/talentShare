<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Rappel d'entretien</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:24px; background-color:#F3F6FC; font-family:'Plus Jakarta Sans', Arial, sans-serif; color: #0B1F33;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #E2E8F0; box-shadow:0 4px 24px rgba(11,31,51,0.06);">
        
        <span style="display: inline-block; background: #FEF3C7; color: #D97706; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 999px;">
            Dans 30 minutes
        </span>
        
        <h1 style="font-size: 22px; font-weight: 800; margin: 16px 0 8px; color: #0B1F33;">Bonjour {{ $recipientName }},</h1>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            {{ $isRecruiter ? "Votre entretien avec le candidat" : "Votre entretien" }}
            pour « <strong style="color:#0B1F33;">{{ $offer->title }}</strong> » commence bientôt.
        </p>
        
        <a href="{{ $application->interview_link }}" 
           style="display: inline-block; background: #0B1F33; color: #FFFFFF !important; text-decoration: none; font-weight: 700; padding: 14px 28px; border-radius: 999px; font-size: 15px;">
            Rejoindre maintenant
        </a>
    </div>
</body>
</html>