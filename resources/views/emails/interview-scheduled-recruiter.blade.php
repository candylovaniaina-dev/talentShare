<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Entretien confirmé</title>
</head>
<body style="margin:0; padding:0; background:#0A1229; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1229; padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0F1E45; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.06);">

        <tr>
          <td style="padding:40px 40px 32px 40px;">

            <p style="margin:0 0 20px 0;">
              <span style="display:inline-block; background:rgba(52,211,153,0.12); color:#34D399; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:6px 12px; border-radius:999px;">
                Entretien confirmé
              </span>
            </p>

            <h1 style="margin:0 0 16px 0; color:#FFFFFF; font-size:22px; font-weight:700; line-height:1.35; letter-spacing:-0.3px;">
              Bonjour {{ $recruiterName }},
            </h1>

            <p style="margin:0 0 28px 0; color:#CBD5E1; font-size:15px; line-height:1.7;">
              Vous avez programmé un entretien avec <strong style="color:#FFFFFF;">{{ $candidate->name }}</strong>
              pour le poste <strong style="color:#FFFFFF;">«&nbsp;{{ $offer->title }}&nbsp;»</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:28px;">
              <tr>
                <td style="padding:20px 22px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0; color:#94A3B8; font-size:13px; font-weight:600; width:100px;">
                        Candidat
                      </td>
                      <td style="padding:6px 0; color:#E2E8F0; font-size:14px; font-weight:500;">
                        {{ $candidate->name }}
                        <span style="color:#94A3B8; font-weight:400;">&lt;{{ $candidate->email }}&gt;</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#94A3B8; font-size:13px; font-weight:600;">
                        Date
                      </td>
                      <td style="padding:6px 0; color:#E2E8F0; font-size:14px; font-weight:500;">
                        {{ $application->interview_at->locale('fr')->isoFormat('dddd D MMMM YYYY') }}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#94A3B8; font-size:13px; font-weight:600;">
                        Heure
                      </td>
                      <td style="padding:6px 0; color:#E2E8F0; font-size:14px; font-weight:500;">
                        {{ $application->interview_at->format('H:i') }} <span style="color:#94A3B8; font-weight:400;">(heure de Madagascar)</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
              <tr>
                <td align="center" style="border-radius:999px; background:#34D399;">
                  <a href="{{ $application->interview_link }}"
                     style="display:inline-block; padding:14px 36px; color:#0A1229; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:0.2px; border-radius:999px;">
                    Rejoindre l'entretien
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0; color:#94A3B8; font-size:13px; line-height:1.7;">
              Un fichier joint vous permet d'ajouter ce rendez-vous à votre calendrier.
              Le candidat a reçu le même lien de visioconférence : vous serez dans la même salle.
            </p>

          </td>
        </tr>

        <tr>
          <td style="background:rgba(0,0,0,0.2); padding:20px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0; color:#64748B; font-size:11px; line-height:1.6;">
              TalentShare — notification automatique.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>