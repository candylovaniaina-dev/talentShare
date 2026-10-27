<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposition acceptée</title>
</head>
<body style="margin:0; padding:0; background:#F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6; padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        {{-- HEADER VERT --}}
        <tr>
          <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding:48px 30px 40px 30px; text-align:center;">
            <div style="font-size:56px; line-height:1; margin-bottom:16px;">🎉</div>
            <h1 style="margin:0; color:#FFFFFF; font-size:28px; font-weight:800; letter-spacing:-0.5px;">
              Félicitations !
            </h1>
            <p style="margin:12px 0 0 0; color:#D1FAE5; font-size:15px; font-weight:500;">
              Votre proposition a été acceptée
            </p>
          </td>
        </tr>

        {{-- BODY --}}
        <tr>
          <td style="padding:40px 36px 24px 36px;">
            <p style="margin:0 0 20px 0; color:#111827; font-size:16px; line-height:1.6;">
              Bonjour <strong>{{ $candidate?->name ?? 'Candidat' }}</strong>,
            </p>

            <p style="margin:0 0 24px 0; color:#374151; font-size:15px; line-height:1.7;">
              Excellente nouvelle ! <strong style="color:#059669;">{{ $company?->name }}</strong>
              a <strong>accepté votre proposition</strong> pour :
            </p>

            {{-- CARTE --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4; border-left:4px solid #10B981; border-radius:10px; margin-bottom:24px;">
              <tr>
                <td style="padding:20px 22px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:14px; vertical-align:top;">
                        <div style="background:#10B981; border-radius:10px; width:42px; height:42px; text-align:center; line-height:42px; font-size:20px;">
                          🚀
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0; color:#065F46; font-size:18px; font-weight:800; letter-spacing:-0.3px;">
                          {{ $offer?->title ?? 'Mission' }}
                        </p>
                        <p style="margin:6px 0 0 0; color:#059669; font-size:13px; font-weight:500;">
                          Mission #{{ $mission->id }} · Créée le {{ $mission->created_at->format('d/m/Y') }}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            {{-- DÉTAILS MISSION --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; margin-bottom:28px;">
              <tr>
                <td style="padding:20px 22px;">
                  <p style="margin:0 0 12px 0; color:#6B7280; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                    Détails de la mission
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0; color:#6B7280; font-size:13px; font-weight:600; width:120px;">
                        Période
                      </td>
                      <td style="padding:6px 0; color:#111827; font-size:14px;">
                        Du {{ $mission->start_at?->format('d/m/Y') }} au {{ $mission->end_at?->format('d/m/Y') }}
                      </td>
                    </tr>
                    @if($mission->workload_percent)
                    <tr>
                      <td style="padding:6px 0; color:#6B7280; font-size:13px; font-weight:600;">
                        Charge
                      </td>
                      <td style="padding:6px 0; color:#111827; font-size:14px;">
                        {{ $mission->workload_percent }}%
                        {{ $mission->remote ? ' · Télétravail' : '' }}
                      </td>
                    </tr>
                    @endif
                  </table>
                </td>
              </tr>
            </table>

            {{-- ENCADRÉ PROCHAINES ÉTAPES --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF3C7; border-left:4px solid #F59E0B; border-radius:10px; margin-bottom:28px;">
              <tr>
                <td style="padding:20px 22px;">
                  <p style="margin:0 0 6px 0; color:#92400E; font-size:14px; font-weight:800;">
                    💡 Prochaines étapes
                  </p>
                  <ul style="margin:8px 0 0 0; padding-left:20px; color:#92400E; font-size:13px; line-height:1.7;">
                    <li>Confirmez votre disponibilité</li>
                    <li>L'entreprise va vous contacter pour finaliser</li>
                    <li>Suivez l'avancement dans votre espace personnel</li>
                  </ul>
                </td>
              </tr>
            </table>

            {{-- CTA --}}
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px auto;">
              <tr>
                <td align="center" style="border-radius:10px; background:#10B981;">
                  <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/missions/{{ $mission->id }}"
                     style="display:inline-block; padding:16px 40px; color:#FFFFFF; text-decoration:none; font-weight:700; font-size:15px; letter-spacing:0.2px; border-radius:10px;">
                    Voir ma mission →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0; color:#6B7280; font-size:14px; line-height:1.6;">
              Félicitations et bonne chance pour cette mission !<br>
              L'équipe <strong style="color:#10B981;">TalentShare</strong>
            </p>
          </td>
        </tr>

        {{-- FOOTER --}}
        <tr>
          <td style="background:#F9FAFB; padding:24px 30px; text-align:center; border-top:1px solid #E5E7EB;">
            <p style="margin:0; color:#9CA3AF; font-size:12px; line-height:1.6;">
              Cet email a été envoyé automatiquement par TalentShare.<br>
              Merci de ne pas y répondre directement.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>