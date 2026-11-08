<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Réponse à votre candidature</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:20px; background-color:#F3F6FC; font-family:'Plus Jakarta Sans', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 30px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow:0 4px 24px rgba(11,31,51,0.06);">
        <h2 style="color: #0B1F33; font-weight: 800; font-size: 24px; margin-top: 0;">Réponse à votre candidature</h2>
        
        <p style="color: #0B1F33; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{ $application->profile?->user?->name ?? 'Cher candidat' }}</strong>,</p>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Nous vous remercions pour l'intérêt que vous avez porté à l'offre <strong>"{{ $application->jobOffer?->title ?? 'N/A' }}"</strong> chez <strong>{{ $application->jobOffer?->company?->name ?? 'N/A' }}</strong>.</p>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Après étude de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue pour ce poste.</p>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Nous vous souhaitons beaucoup de succès dans vos recherches.</p>

        <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Cordialement,<br>L'équipe <strong style="color:#0B1F33;">TalentShare</strong></p>
    </div>
</body>
</html>