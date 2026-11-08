<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vérification requise</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background:#F3F6FC; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#0B1F33;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F6FC; padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:16px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 8px 30px rgba(11,31,51,0.06);">
        <tr>
          <td style="padding:40px 40px 32px 40px;">
            <p style="margin:0 0 20px 0;">
              <span style="display:inline-block; background:#FEF3C7; color:#D97706; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:6px 12px; border-radius:999px;">
                Action requise
              </span>
            </p>

            <h1 style="margin:0 0 16px 0; color:#0B1F33; font-size:22px; font-weight:800; line-height:1.35; letter-spacing:-0.3px;">
              Bonjour {{ $candidateName }},
            </h1>

            <p style="margin:0 0 24px 0; color:#475569; font-size:15px; line-height:1.7;">
              <strong style="color:#0B1F33;">{{ $company?->name }}</strong> souhaite vous rencontrer pour le poste
              <strong style="color:#0B1F33;">«&nbsp;{{ $offer->title }}&nbsp;»</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF3C7; border-left:3px solid #F59E0B; border-radius:8px; margin-bottom:28px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 8px 0; color:#92400E; font-size:14px; font-weight:700;">
                    Confirmez votre adresse email
                  </p>
                  <p style="margin:0; color:#B45309; font-size:14px; line-height:1.6;">
                    Pour recevoir les détails de votre entretien (date, heure, lien de visioconférence),
                    merci de confirmer votre adresse email en cliquant sur le bouton ci-dessous.
                  </p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F6FC; border:1px solid #E2E8F0; border-radius:12px; margin-bottom:28px;">
              <tr>
                <td style="padding:20px 22px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0; color:#64748B; font-size:13px; font-weight:600; width:100px;">Date prévue</td>
                      <td style="padding:6px 0; color:#0B1F33; font-size:14px; font-weight:600;">
                        {{ $interviewAt->locale('fr')->isoFormat('dddd D MMMM YYYY [à] HH:mm') }}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
              <tr>
                <td align="center" style="border-radius:999px; background:#0B1F33;">
                  <a href="{{ $verificationUrl }}"
                     style="display:inline-block; padding:14px 36px; color:#FFFFFF; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:0.2px; border-radius:999px;">
                    Confirmer mon adresse email
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0; color:#64748B; font-size:13px; line-height:1.7;">
              Dès que votre adresse sera confirmée, vous recevrez automatiquement l'invitation complète
              à l'entretien avec le lien de visioconférence.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#F8FAFC; padding:20px 40px; text-align:center; border-top:1px solid #E2E8F0;">
            <p style="margin:0; color:#94A3B8; font-size:11px; line-height:1.6;">
              TalentShare — vérification de sécurité.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>