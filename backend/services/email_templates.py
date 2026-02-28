"""Email HTML templates for the platform.

All templates use inline CSS and table layout for maximum email client compatibility.
No external CSS, no images (better deliverability).
"""

# ── i18n strings ─────────────────────────────────────────────────────────

_STRINGS: dict[str, dict[str, str]] = {
    "header": {
        "en": "CLASSIFIED // EPOCH SUMMONS",
        "de": "GEHEIM // EPOCHEN-EINBERUFUNG",
    },
    "title_prefix": {
        "en": "Epoch Summons",
        "de": "Epochen-Einberufung",
    },
    "intro_1": {
        "en": (
            'You have been invited to join an <strong style="color:#f59e0b;">Epoch</strong> on'
            ' <a href="https://metaverse.center" style="color:#f59e0b;text-decoration:underline;">metaverse.center</a>'
            " &mdash; a multi-simulation strategy platform where players compete across"
            " interconnected worlds. Deploy operatives, forge alliances, and shape the"
            " balance of power."
        ),
        "de": (
            'Du wurdest eingeladen, an einer <strong style="color:#f59e0b;">Epoche</strong> auf'
            ' <a href="https://metaverse.center" style="color:#f59e0b;text-decoration:underline;">metaverse.center</a>'
            " teilzunehmen &mdash; einer Multi-Simulations-Strategieplattform, auf der Spieler"
            " in vernetzten Welten gegeneinander antreten. Entsende Agenten, schmiede Allianzen"
            " und bestimme das Gleichgewicht der Macht."
        ),
    },
    "intro_2": {
        "en": (
            "An Epoch is a timed competitive match. Each player commands a simulation and"
            " scores points through diplomacy, espionage, and territorial influence."
            " The briefing below has been prepared for you."
        ),
        "de": (
            "Eine Epoche ist ein zeitlich begrenzter Wettbewerb. Jeder Spieler befehligt eine"
            " Simulation und sammelt Punkte durch Diplomatie, Spionage und territorialen"
            " Einfluss. Das nachfolgende Briefing wurde f\u00fcr dich vorbereitet."
        ),
    },
    "intel_dispatch": {
        "en": "INTEL DISPATCH",
        "de": "GEHEIMDIENSTBERICHT",
    },
    "cta": {
        "en": "ENTER THE COMMAND CENTER",
        "de": "ZUR KOMMANDOZENTRALE",
    },
    "footer": {
        "en": "TRANSMISSION ORIGIN: metaverse.center",
        "de": "URSPRUNG DER \u00dcBERTRAGUNG: metaverse.center",
    },
    "subject": {
        "en": "CLASSIFIED: Epoch Summons",
        "de": "GEHEIM: Epochen-Einberufung",
    },
}


def _t(key: str, locale: str) -> str:
    """Look up a translated string, falling back to English."""
    return _STRINGS[key].get(locale, _STRINGS[key]["en"])


def epoch_invitation_subject(epoch_name: str, locale: str = "en") -> str:
    """Return the localized email subject line."""
    return f"{_t('subject', locale)} \u2014 {epoch_name}"


def render_epoch_invitation(
    epoch_name: str,
    lore_text: str,
    invite_url: str,
    locale: str = "en",
) -> str:
    """Render the epoch invitation email as an HTML string.

    Military tactical dispatch aesthetic:
    - Dark background, monospace font
    - Amber accent color for CTA and epoch name
    - Dashed-border dossier box for lore text
    """
    lang = locale if locale in ("en", "de") else "en"

    return f"""\
<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{_t('title_prefix', lang)} &mdash; {_esc(epoch_name)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Courier New',Courier,monospace;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:2px solid #333;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:#666;text-transform:uppercase;">
                {_t('header', lang)}
              </p>
            </td>
          </tr>
          <!-- Introduction -->
          <tr>
            <td style="padding:32px 32px 16px;">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#ccc;">
                {_t('intro_1', lang)}
              </p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#ccc;">
                {_t('intro_2', lang)}
              </p>
            </td>
          </tr>
          <!-- Epoch Name -->
          <tr>
            <td style="padding:16px 32px 16px;">
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',Courier,monospace;">
                {_esc(epoch_name)}
              </h1>
            </td>
          </tr>
          <!-- Lore Dossier -->
          <tr>
            <td style="padding:0 32px 32px;">
              <div style="border:1px dashed #444;padding:20px;background-color:#111;">
                <p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;color:#666;text-transform:uppercase;">
                  {_t('intel_dispatch', lang)}
                </p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#ccc;">
                  {_esc(lore_text)}
                </p>
              </div>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 32px 40px;">
              <a href="{_esc(invite_url)}"
                 style="display:inline-block;padding:14px 32px;background-color:#f59e0b;color:#0a0a0a;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-decoration:none;border:2px solid #f59e0b;">
                {_t('cta', lang)}
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #222;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:#444;text-transform:uppercase;">
                {_t('footer', lang)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _esc(text: str) -> str:
    """Escape HTML special characters."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
