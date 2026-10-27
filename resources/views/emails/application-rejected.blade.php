<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Réponse à votre candidature</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px;">
        <h2 style="color: #ef4444;">Réponse à votre candidature</h2>
        
        <p>Bonjour <strong>{{ $application->profile?->user?->name ?? 'Cher candidat' }}</strong>,</p>
        
        <p>Nous vous remercions pour l'intérêt que vous avez porté à l'offre <strong>"{{ $application->jobOffer?->title ?? 'N/A' }}"</strong> chez <strong>{{ $application->jobOffer?->company?->name ?? 'N/A' }}</strong>.</p>
        
        <p>Après étude de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue pour ce poste.</p>
        
        <p>Nous vous souhaitons beaucoup de succès dans vos recherches.</p>

        <p>Cordialement,<br>L'équipe TalentShare</p>
    </div>
</body>
</html>