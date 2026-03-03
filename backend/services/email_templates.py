"""Email HTML templates for the platform.

All templates use inline CSS and table layout for maximum email client compatibility.
No external CSS, no images (better deliverability).
"""

# ── i18n strings (legacy — kept for backward compat) ─────────────────────


def epoch_invitation_subject(epoch_name: str, locale: str = "en") -> str:
    """Return the localized email subject line."""
    return f"{_nt('inv_subject', 'en')} \u2014 {epoch_name}"


def render_epoch_invitation(
    epoch_name: str,
    lore_text: str,
    invite_url: str,
    locale: str = "en",
) -> str:
    """Render the epoch invitation email as bilingual HTML (EN + DE).

    Military tactical dispatch aesthetic matching newer notification emails:
    - Dark background, monospace font, amber accent
    - Bilingual: English first, then German (same email)
    - Reuses shared building blocks (_email_shell, _section_header, etc.)
    - Sections: intro, operation name, intel dossier, mission params, rules, CTA
    """
    safe_name = _esc(epoch_name)
    safe_lore = _esc(lore_text)

    en_block = _render_invitation_block(safe_name, safe_lore, invite_url, "en")
    en_cta = _cta_button(invite_url, _nt("inv_cta", "en"))

    divider = _language_divider()

    de_block = _render_invitation_block(safe_name, safe_lore, invite_url, "de")
    de_cta = _cta_button(invite_url, _nt("inv_cta", "de"))

    footer = _footer_row()

    content = f"{en_block}\n{en_cta}\n{divider}\n{de_block}\n{de_cta}\n{footer}"
    return _email_shell(f"CLASSIFIED // EPOCH SUMMONS \u2014 {safe_name}", content)


def _render_invitation_block(
    epoch_name: str,
    lore_text: str,
    invite_url: str,
    lang: str,
) -> str:
    """Render a single language block for the epoch invitation email."""
    is_primary = lang == "en"
    heading_tag = "h1" if is_primary else "h2"
    heading_size = "22px" if is_primary else "20px"

    # Header (only EN gets the top border)
    if is_primary:
        header = f"""\
          <tr>
            <td style="padding:24px 32px;border-bottom:2px solid {_BORDER};">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('inv_header', lang)}
              </p>
            </td>
          </tr>"""
    else:
        header = f"""\
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('inv_header', lang)}
              </p>
            </td>
          </tr>"""

    # Introduction paragraphs
    intro = f"""\
          <tr>
            <td style="padding:{'24px' if is_primary else '8px'} 32px 16px;">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:{_TEXT};">
                {_nt('inv_intro_1', lang)}
              </p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:{_TEXT};">
                {_nt('inv_intro_2', lang)}
              </p>
            </td>
          </tr>"""

    # Operation name
    op_name = f"""\
          <tr>
            <td style="padding:8px 32px 4px;">
              <p style="margin:0 0 2px;font-size:10px;letter-spacing:3px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('inv_operation', lang)}
              </p>
              <{heading_tag} style="margin:0;font-size:{heading_size};font-weight:900;color:{_AMBER};letter-spacing:2px;text-transform:uppercase;font-family:{_MONO};">
                {epoch_name}
              </{heading_tag}>
              <p style="margin:4px 0 0;font-size:11px;color:{_BORDER};letter-spacing:1px;">
                &#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;
              </p>
            </td>
          </tr>"""

    # Intel dossier (AI-generated lore)
    intel = _section_header(_nt("inv_intel", lang))
    intel += f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:20px;background-color:{_SURFACE};">
                <p style="margin:0;font-size:14px;line-height:1.7;color:{_TEXT};font-style:italic;">
                  {lore_text}
                </p>
              </div>
            </td>
          </tr>"""

    # Mission parameters
    mp_bullets = [
        _nt("inv_mp_1", lang),
        _nt("inv_mp_2", lang),
        _nt("inv_mp_3", lang),
        _nt("inv_mp_4", lang),
    ]
    mp_items = ""
    for bullet in mp_bullets:
        mp_items += f"""\
                <p style="margin:0 0 6px;font-size:13px;color:{_TEXT};line-height:1.6;">
                  &#9656; {bullet}
                </p>"""

    mission = _section_header(_nt("inv_mission_params", lang))
    mission += f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
{mp_items}
              </div>
            </td>
          </tr>"""

    # Rules of engagement
    roe_bullets = [
        _nt("inv_roe_1", lang),
        _nt("inv_roe_2", lang),
        _nt("inv_roe_3", lang),
        _nt("inv_roe_4", lang),
    ]
    roe_items = ""
    for bullet in roe_bullets:
        roe_items += f"""\
                <p style="margin:0 0 6px;font-size:13px;color:{_TEXT};line-height:1.6;">
                  &#9656; {bullet}
                </p>"""

    rules = _section_header(_nt("inv_rules", lang))
    rules += f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
{roe_items}
              </div>
            </td>
          </tr>"""

    return f"{header}\n{intro}\n{op_name}\n{intel}\n{mission}\n{rules}"


def _esc(text: str) -> str:
    """Escape HTML special characters."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


# ── Shared building blocks ──────────────────────────────────────────────

_MONO = "'Courier New',Courier,monospace"
_BG = "#0a0a0a"
_SURFACE = "#111"
_BORDER = "#333"
_BORDER_SUBTLE = "#222"
_TEXT = "#ccc"
_TEXT_DIM = "#666"
_TEXT_DARK = "#444"
_AMBER = "#f59e0b"
_GREEN = "#4ade80"
_RED = "#ef4444"
_GRAY = "#666"


def _delta_arrow(delta: float) -> str:
    """Return colored arrow for a score delta."""
    if delta > 0:
        return f'<span style="color:{_GREEN};">&#9650; +{delta:.1f}</span>'
    if delta < 0:
        return f'<span style="color:{_RED};">&#9660; {delta:.1f}</span>'
    return f'<span style="color:{_GRAY};">&#9472; 0.0</span>'


def _rank_arrow(current: int, previous: int) -> str:
    """Return colored arrow for rank change (lower rank = better)."""
    if previous == 0:
        return ""
    diff = previous - current  # positive = improved
    if diff > 0:
        return f'<span style="color:{_GREEN};">&#9650; (+{diff})</span>'
    if diff < 0:
        return f'<span style="color:{_RED};">&#9660; ({diff})</span>'
    return f'<span style="color:{_GRAY};">&#9472;</span>'


def _score_bar(value: float, max_val: float = 100.0) -> str:
    """Render a 10-cell ASCII-style score bar as HTML table cells."""
    filled = min(10, max(0, round(value / max_val * 10))) if max_val > 0 else 0
    cells = ""
    for i in range(10):
        bg = _AMBER if i < filled else "#1a1a1a"
        cells += f'<td style="width:16px;height:12px;background-color:{bg};border:1px solid #222;padding:0;"></td>'
    return f'<table role="presentation" cellpadding="0" cellspacing="1" style="display:inline-table;vertical-align:middle;"><tr>{cells}</tr></table>'


def _email_shell(title: str, content: str) -> str:
    """Wrap content in the standard dark email shell."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:{_BG};font-family:{_MONO};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{_BG};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
{content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _section_header(label: str) -> str:
    """Render a dossier section header row."""
    return f"""\
          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0;font-size:10px;letter-spacing:3px;color:{_TEXT_DIM};text-transform:uppercase;border-bottom:1px dashed {_BORDER_SUBTLE};padding-bottom:6px;">
                &#9472;&#9472; {_esc(label)} &#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;
              </p>
            </td>
          </tr>"""


def _cta_button(url: str, label: str) -> str:
    """Render the CTA button row."""
    return f"""\
          <tr>
            <td align="center" style="padding:24px 32px 32px;">
              <a href="{_esc(url)}"
                 style="display:inline-block;padding:14px 32px;background-color:{_AMBER};color:{_BG};font-family:{_MONO};font-size:13px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-decoration:none;border:2px solid {_AMBER};">
                &#9608; {_esc(label)} &#9608;
              </a>
            </td>
          </tr>"""


def _language_divider() -> str:
    """Render the EN/DE language divider."""
    return f"""\
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;color:{_TEXT_DIM};text-align:center;">
                &#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;
              </p>
              <p style="margin:4px 0 0;font-size:10px;letter-spacing:3px;color:{_TEXT_DIM};text-transform:uppercase;text-align:center;">
                DEUTSCHE VERSION
              </p>
              <p style="margin:4px 0 0;font-size:11px;letter-spacing:3px;color:{_TEXT_DIM};text-align:center;">
                &#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;
              </p>
            </td>
          </tr>"""


def _footer_row() -> str:
    """Render the standard footer with notification management link."""
    return f"""\
          <tr>
            <td style="padding:16px 32px;border-top:1px solid {_BORDER_SUBTLE};">
              <p style="margin:0 0 4px;font-size:10px;color:{_TEXT_DARK};">
                <a href="https://metaverse.center/settings" style="color:{_TEXT_DARK};text-decoration:underline;">Manage notifications</a>
                &nbsp;&middot;&nbsp;
                <a href="https://metaverse.center/settings" style="color:{_TEXT_DARK};text-decoration:underline;">Benachrichtigungen verwalten</a>
              </p>
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:{_TEXT_DARK};text-transform:uppercase;">
                TRANSMISSION ORIGIN: metaverse.center
              </p>
            </td>
          </tr>"""


# ── Bilingual strings for notification emails ────────────────────────────

_NOTIF_STRINGS: dict[str, dict[str, str]] = {
    "sitrep_header": {
        "en": "CLASSIFIED // SITUATION REPORT",
        "de": "GEHEIM // LAGEBERICHT",
    },
    "cycle_resolved": {
        "en": "CYCLE {n} RESOLVED",
        "de": "ZYKLUS {n} ABGESCHLOSSEN",
    },
    "phase_label": {
        "en": "PHASE",
        "de": "PHASE",
    },
    "your_standing": {
        "en": "YOUR STANDING",
        "de": "DEINE POSITION",
    },
    "rank": {
        "en": "RANK",
        "de": "RANG",
    },
    "composite": {
        "en": "COMPOSITE",
        "de": "GESAMT",
    },
    "rp_reserve": {
        "en": "RP RESERVE",
        "de": "RP-RESERVE",
    },
    "dimension_analysis": {
        "en": "DIMENSION ANALYSIS",
        "de": "DIMENSIONSANALYSE",
    },
    "stability": {
        "en": "STABILITY",
        "de": "STABILIT\u00c4T",
    },
    "influence": {
        "en": "INFLUENCE",
        "de": "EINFLUSS",
    },
    "sovereignty": {
        "en": "SOVEREIGNTY",
        "de": "SOUVER\u00c4NIT\u00c4T",
    },
    "diplomatic": {
        "en": "DIPLOMATIC",
        "de": "DIPLOMATIE",
    },
    "military": {
        "en": "MILITARY",
        "de": "MILIT\u00c4R",
    },
    "operative_status": {
        "en": "OPERATIVE STATUS",
        "de": "AGENTENSTATUS",
    },
    "active": {
        "en": "ACTIVE",
        "de": "AKTIV",
    },
    "resolved": {
        "en": "RESOLVED",
        "de": "ABGESCHLOSSEN",
    },
    "guardians": {
        "en": "GUARDIANS",
        "de": "W\u00c4CHTER",
    },
    "counter_intel": {
        "en": "COUNTER-INTEL",
        "de": "SPIONAGEABWEHR",
    },
    "signal_intercepts": {
        "en": "SIGNAL INTERCEPTS",
        "de": "ABGEFANGENE SIGNALE",
    },
    "no_intercepts": {
        "en": "No public signals intercepted this cycle.",
        "de": "Keine \u00f6ffentlichen Signale in diesem Zyklus abgefangen.",
    },
    "cta": {
        "en": "ENTER THE COMMAND CENTER",
        "de": "ZUR KOMMANDOZENTRALE",
    },
    # Phase change strings
    "phase_change_header": {
        "en": "CLASSIFIED // PHASE TRANSITION",
        "de": "GEHEIM // PHASEN\u00dcBERGANG",
    },
    "phase_transition": {
        "en": "PHASE TRANSITION",
        "de": "PHASEN\u00dcBERGANG",
    },
    "from_to": {
        "en": "{old} &#10132; {new}",
        "de": "{old} &#10132; {new}",
    },
    "cycles_elapsed": {
        "en": "CYCLES ELAPSED",
        "de": "VERGANGENE ZYKLEN",
    },
    "phase_foundation": {
        "en": "FOUNDATION",
        "de": "GRUNDSTEINLEGUNG",
    },
    "phase_competition": {
        "en": "COMPETITION",
        "de": "WETTBEWERB",
    },
    "phase_reckoning": {
        "en": "RECKONING",
        "de": "ABRECHNUNG",
    },
    "phase_completed": {
        "en": "COMPLETED",
        "de": "ABGESCHLOSSEN",
    },
    "what_changes": {
        "en": "OPERATIONAL CHANGES",
        "de": "OPERATIVE \u00c4NDERUNGEN",
    },
    # Epoch completed strings
    "epoch_complete_header": {
        "en": "CLASSIFIED // OPERATION COMPLETE",
        "de": "GEHEIM // OPERATION ABGESCHLOSSEN",
    },
    "final_standings": {
        "en": "FINAL STANDINGS",
        "de": "ENDSTAND",
    },
    "winner": {
        "en": "OPERATION VICTOR",
        "de": "OPERATIONSSIEGER",
    },
    "your_result": {
        "en": "YOUR FINAL POSITION",
        "de": "DEINE ENDPOSITION",
    },
    "dimension_titles": {
        "en": "DIMENSION TITLES AWARDED",
        "de": "VERLIEHENE DIMENSIONSTITEL",
    },
    "total_cycles": {
        "en": "TOTAL CYCLES",
        "de": "ZYKLEN GESAMT",
    },
    # Epoch invitation strings
    "inv_subject": {
        "en": "CLASSIFIED // EPOCH SUMMONS",
        "de": "GEHEIM // EPOCHEN-EINBERUFUNG",
    },
    "inv_header": {
        "en": "CLASSIFIED // EPOCH SUMMONS",
        "de": "GEHEIM // EPOCHEN-EINBERUFUNG",
    },
    "inv_intro_1": {
        "en": "You have been selected for a classified operation. The Bureau has identified you as a viable operative for the next competitive epoch on metaverse.center.",
        "de": "Sie wurden für eine geheime Operation ausgewählt. Das Büro hat Sie als geeigneten Agenten für die nächste kompetitive Epoche auf metaverse.center identifiziert.",
    },
    "inv_intro_2": {
        "en": "Each epoch pits simulation commanders against each other in a strategic contest across five dimensions. Your tactical decisions shape the multiverse.",
        "de": "In jeder Epoche treten Simulationskommandanten in einem strategischen Wettbewerb über fünf Dimensionen gegeneinander an. Ihre taktischen Entscheidungen formen das Multiversum.",
    },
    "inv_operation": {
        "en": "OPERATION",
        "de": "OPERATION",
    },
    "inv_intel": {
        "en": "INTEL DISPATCH",
        "de": "GEHEIMDIENSTBERICHT",
    },
    "inv_mission_params": {
        "en": "MISSION PARAMETERS",
        "de": "MISSIONSPARAMETER",
    },
    "inv_mp_1": {
        "en": "Deploy operatives across 5 strategic dimensions",
        "de": "Entsenden Sie Agenten über 5 strategische Dimensionen",
    },
    "inv_mp_2": {
        "en": "Forge alliances or betray your rivals",
        "de": "Schmieden Sie Allianzen oder verraten Sie Ihre Rivalen",
    },
    "inv_mp_3": {
        "en": "Score through diplomacy, espionage, and military strength",
        "de": "Punkten Sie durch Diplomatie, Spionage und Militärstärke",
    },
    "inv_mp_4": {
        "en": "Real-time decisions with 8-hour cycles",
        "de": "Echtzeit-Entscheidungen in 8-Stunden-Zyklen",
    },
    "inv_rules": {
        "en": "RULES OF ENGAGEMENT",
        "de": "EINSATZREGELN",
    },
    "inv_roe_1": {
        "en": "Each player commands one simulation",
        "de": "Jeder Spieler kommandiert eine Simulation",
    },
    "inv_roe_2": {
        "en": "5 dimensions: Stability, Influence, Sovereignty, Diplomatic, Military",
        "de": "5 Dimensionen: Stabilität, Einfluss, Souveränität, Diplomatie, Militär",
    },
    "inv_roe_3": {
        "en": "Resource Points fuel your operations",
        "de": "Ressourcenpunkte treiben Ihre Operationen an",
    },
    "inv_roe_4": {
        "en": "Fog of war \u2014 your intel is limited",
        "de": "Kriegsnebel \u2014 Ihre Aufklärung ist begrenzt",
    },
    "inv_cta": {
        "en": "ACCEPT THE SUMMONS",
        "de": "EINBERUFUNG ANNEHMEN",
    },
}


def _nt(key: str, locale: str, **kwargs: str | int) -> str:
    """Look up a notification translated string, with optional format vars."""
    template = _NOTIF_STRINGS[key].get(locale, _NOTIF_STRINGS[key]["en"])
    if kwargs:
        return template.format(**kwargs)
    return template


# ── Phase descriptions ───────────────────────────────────────────────────

_PHASE_DESCRIPTIONS: dict[str, dict[str, list[str]]] = {
    "foundation": {
        "en": [
            "1.5x RP bonus per cycle during this phase.",
            "Build your foundation before competition begins.",
            "All operative types available for deployment.",
        ],
        "de": [
            "1,5-facher RP-Bonus pro Zyklus in dieser Phase.",
            "Baue dein Fundament, bevor der Wettbewerb beginnt.",
            "Alle Agententypen stehen zur Verf\u00fcgung.",
        ],
    },
    "competition": {
        "en": [
            "Standard RP allocation per cycle.",
            "Full competitive scoring is now active.",
            "Alliances and betrayals shape the leaderboard.",
        ],
        "de": [
            "Standard-RP-Zuteilung pro Zyklus.",
            "Volle Wettbewerbswertung ist jetzt aktiv.",
            "Allianzen und Verrat pr\u00e4gen die Rangliste.",
        ],
    },
    "reckoning": {
        "en": [
            "Final phase &mdash; last chance to turn the tide.",
            "Score multipliers may be amplified.",
            "Decisive moves carry greater weight.",
        ],
        "de": [
            "Letzte Phase &mdash; letzte Chance, das Blatt zu wenden.",
            "Punktemultiplikatoren k\u00f6nnen verst\u00e4rkt werden.",
            "Entscheidende Z\u00fcge haben gr\u00f6\u00dferes Gewicht.",
        ],
    },
    "completed": {
        "en": [
            "The operation has concluded.",
            "Final standings have been recorded.",
            "Game instances are being archived.",
        ],
        "de": [
            "Die Operation ist abgeschlossen.",
            "Der Endstand wurde festgehalten.",
            "Spielinstanzen werden archiviert.",
        ],
    },
}


# Dimension title translations
_TITLE_TRANSLATIONS: dict[str, dict[str, str]] = {
    "The Unshaken": {"en": "The Unshaken", "de": "Der Unersch\u00fctterliche"},
    "The Resonant": {"en": "The Resonant", "de": "Der Einflussreiche"},
    "The Sovereign": {"en": "The Sovereign", "de": "Der Souver\u00e4ne"},
    "The Architect": {"en": "The Architect", "de": "Der Architekt"},
    "The Shadow": {"en": "The Shadow", "de": "Der Schatten"},
}


# ── Cycle Briefing Template ─────────────────────────────────────────────


def _render_briefing_block(data: dict, lang: str) -> str:
    """Render a single language block for the cycle briefing."""
    dims = data.get("dimensions", [])
    events = data.get("public_events", [])

    # Standing box
    rank_str = f"#{data['rank']} / {data['total_players']}"
    rank_delta = _rank_arrow(data["rank"], data.get("prev_rank", 0))

    standing_html = f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:16px 20px;background-color:{_SURFACE};">
                <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:{_TEXT_DIM};text-transform:uppercase;">
                  {_nt('your_standing', lang)}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
                  <tr>
                    <td style="font-size:12px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:4px 0;">{_nt('rank', lang)}</td>
                    <td style="font-size:14px;color:{_TEXT};text-align:right;padding:4px 0;">{rank_str} {rank_delta}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:4px 0;">{_nt('composite', lang)}</td>
                    <td style="font-size:14px;color:{_AMBER};font-weight:bold;text-align:right;padding:4px 0;">{data['composite']:.1f} {_delta_arrow(data['composite_delta'])}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:4px 0;">{_nt('rp_reserve', lang)}</td>
                    <td style="font-size:14px;color:{_TEXT};text-align:right;padding:4px 0;">{data['rp_balance']} / {data['rp_cap']}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>"""

    # Dimension bars
    dim_name_map = {
        "stability": _nt("stability", lang),
        "influence": _nt("influence", lang),
        "sovereignty": _nt("sovereignty", lang),
        "diplomatic": _nt("diplomatic", lang),
        "military": _nt("military", lang),
    }
    dim_rows = ""
    for d in dims:
        label = dim_name_map.get(d["name"], d["name"].upper())
        bar = _score_bar(d["value"])
        dim_rows += f"""\
                  <tr>
                    <td style="font-size:11px;color:{_TEXT_DIM};letter-spacing:1px;text-transform:uppercase;padding:5px 0;white-space:nowrap;width:100px;">{label}</td>
                    <td style="padding:5px 8px;">{bar}</td>
                    <td style="font-size:12px;color:{_TEXT};text-align:right;padding:5px 0;white-space:nowrap;width:50px;">{d['value']:.1f}</td>
                    <td style="font-size:11px;text-align:right;padding:5px 0;white-space:nowrap;width:60px;">{_delta_arrow(d['delta'])}</td>
                  </tr>"""

    dims_html = f"""\
{_section_header(_nt('dimension_analysis', lang))}
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
{dim_rows}
                </table>
              </div>
            </td>
          </tr>"""

    # Operative status
    ops_html = f"""\
{_section_header(_nt('operative_status', lang))}
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
                <p style="margin:0;font-size:13px;color:{_TEXT};line-height:1.8;">
                  {_nt('active', lang)}: <strong style="color:{_AMBER};">{data['active_ops']}</strong>
                  &nbsp;&middot;&nbsp;
                  {_nt('resolved', lang)}: <strong>{data['resolved_ops']}</strong>
                  ({data['success_ops']}&#10003; {data['detected_ops']}&#10007;)
                </p>
                <p style="margin:4px 0 0;font-size:13px;color:{_TEXT};line-height:1.8;">
                  {_nt('guardians', lang)}: <strong>{data['guardians']}</strong>
                  &nbsp;&middot;&nbsp;
                  {_nt('counter_intel', lang)}: <strong>{data['counter_intel']}</strong>
                </p>
              </div>
            </td>
          </tr>"""

    # Signal intercepts (public events)
    events_html = f"{_section_header(_nt('signal_intercepts', lang))}\n"
    if events:
        event_items = ""
        for ev in events[:5]:
            event_items += f"""\
                <p style="margin:0 0 6px;font-size:13px;color:{_TEXT};line-height:1.6;">
                  &#9656; {_esc(ev['narrative'])}
                </p>"""
        events_html += f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
{event_items}
              </div>
            </td>
          </tr>"""
    else:
        events_html += f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <p style="margin:0;font-size:12px;color:{_TEXT_DIM};font-style:italic;padding:0 4px;">
                {_nt('no_intercepts', lang)}
              </p>
            </td>
          </tr>"""

    return f"{standing_html}\n{dims_html}\n{ops_html}\n{events_html}"


def render_cycle_briefing(data: dict) -> str:
    """Render the cycle briefing email — bilingual (EN first, then DE).

    data keys: epoch_name, epoch_status, cycle_number, rank, prev_rank,
    total_players, composite, composite_delta, dimensions, rp_balance,
    rp_cap, active_ops, resolved_ops, success_ops, detected_ops,
    guardians, counter_intel, public_events, simulation_name,
    command_center_url
    """
    epoch_name = _esc(data.get("epoch_name", "Unknown"))
    cycle_number = data.get("cycle_number", 0)
    status_display = data.get("epoch_status", "competition").upper()
    cta_url = data.get("command_center_url", "https://metaverse.center/epoch")

    # ── EN block ──
    en_header = f"""\
          <tr>
            <td style="padding:24px 32px;border-bottom:2px solid {_BORDER};">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('sitrep_header', 'en')}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <h1 style="margin:0 0 4px;font-size:22px;font-weight:900;color:{_AMBER};letter-spacing:2px;text-transform:uppercase;font-family:{_MONO};">
                {epoch_name}
              </h1>
              <p style="margin:0;font-size:12px;color:{_TEXT_DIM};letter-spacing:2px;">
                {_nt('cycle_resolved', 'en', n=cycle_number)} &middot; {_nt('phase_label', 'en')}: {status_display}
              </p>
            </td>
          </tr>"""

    en_block = _render_briefing_block(data, "en")
    en_cta = _cta_button(cta_url, _nt("cta", "en"))

    # ── DE block ──
    divider = _language_divider()

    de_header = f"""\
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('sitrep_header', 'de')}
              </p>
              <h2 style="margin:0 0 4px;font-size:20px;font-weight:900;color:{_AMBER};letter-spacing:2px;text-transform:uppercase;font-family:{_MONO};">
                {epoch_name}
              </h2>
              <p style="margin:0;font-size:12px;color:{_TEXT_DIM};letter-spacing:2px;">
                {_nt('cycle_resolved', 'de', n=cycle_number)} &middot; {_nt('phase_label', 'de')}: {status_display}
              </p>
            </td>
          </tr>"""

    de_block = _render_briefing_block(data, "de")
    de_cta = _cta_button(cta_url, _nt("cta", "de"))

    footer = _footer_row()

    content = f"{en_header}\n{en_block}\n{en_cta}\n{divider}\n{de_header}\n{de_block}\n{de_cta}\n{footer}"
    return _email_shell(f"CLASSIFIED // SITREP \u2014 {epoch_name}", content)


# ── Phase Change Template ────────────────────────────────────────────────


def _render_phase_block(
    epoch_name: str,
    old_phase: str,
    new_phase: str,
    cycle_count: int,
    lang: str,
) -> str:
    """Render a single language block for the phase change email."""
    phase_names = {
        "lobby": {"en": "LOBBY", "de": "LOBBY"},
        "foundation": {"en": "FOUNDATION", "de": "GRUNDSTEINLEGUNG"},
        "competition": {"en": "COMPETITION", "de": "WETTBEWERB"},
        "reckoning": {"en": "RECKONING", "de": "ABRECHNUNG"},
        "completed": {"en": "COMPLETED", "de": "ABGESCHLOSSEN"},
        "cancelled": {"en": "CANCELLED", "de": "ABGEBROCHEN"},
    }

    old_name = phase_names.get(old_phase, {}).get(lang, old_phase.upper())
    new_name = phase_names.get(new_phase, {}).get(lang, new_phase.upper())

    descriptions = _PHASE_DESCRIPTIONS.get(new_phase, {}).get(lang, [])
    desc_items = ""
    for desc in descriptions:
        desc_items += f"""\
                <p style="margin:0 0 6px;font-size:13px;color:{_TEXT};line-height:1.6;">
                  &#9656; {desc}
                </p>"""

    return f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:16px 20px;background-color:{_SURFACE};">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size:12px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:4px 0;">{_nt('phase_transition', lang)}</td>
                    <td style="font-size:14px;color:{_AMBER};font-weight:bold;text-align:right;padding:4px 0;">{old_name} &#10132; {new_name}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:4px 0;">{_nt('cycles_elapsed', lang)}</td>
                    <td style="font-size:14px;color:{_TEXT};text-align:right;padding:4px 0;">{cycle_count}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
{_section_header(_nt('what_changes', lang))}
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
{desc_items}
              </div>
            </td>
          </tr>"""


def render_phase_change(
    epoch_name: str,
    old_phase: str,
    new_phase: str,
    cycle_count: int,
    command_center_url: str,
) -> str:
    """Render the phase change notification email — bilingual (EN first, then DE)."""
    safe_name = _esc(epoch_name)
    cta_url = command_center_url

    # EN block
    en_header = f"""\
          <tr>
            <td style="padding:24px 32px;border-bottom:2px solid {_BORDER};">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('phase_change_header', 'en')}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 16px;">
              <h1 style="margin:0;font-size:22px;font-weight:900;color:{_AMBER};letter-spacing:2px;text-transform:uppercase;font-family:{_MONO};">
                {safe_name}
              </h1>
            </td>
          </tr>"""

    en_block = _render_phase_block(safe_name, old_phase, new_phase, cycle_count, "en")
    en_cta = _cta_button(cta_url, _nt("cta", "en"))

    # DE block
    divider = _language_divider()

    de_header = f"""\
          <tr>
            <td style="padding:24px 32px 16px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('phase_change_header', 'de')}
              </p>
              <h2 style="margin:0;font-size:20px;font-weight:900;color:{_AMBER};letter-spacing:2px;text-transform:uppercase;font-family:{_MONO};">
                {safe_name}
              </h2>
            </td>
          </tr>"""

    de_block = _render_phase_block(safe_name, old_phase, new_phase, cycle_count, "de")
    de_cta = _cta_button(cta_url, _nt("cta", "de"))

    footer = _footer_row()
    content = f"{en_header}\n{en_block}\n{en_cta}\n{divider}\n{de_header}\n{de_block}\n{de_cta}\n{footer}"
    return _email_shell(f"CLASSIFIED // PHASE TRANSITION \u2014 {safe_name}", content)


# ── Epoch Completed Template ─────────────────────────────────────────────


def _render_completed_block(
    epoch_name: str,
    leaderboard: list[dict],
    player_simulation_id: str,
    cycle_count: int,
    lang: str,
) -> str:
    """Render a single language block for the epoch completed email."""
    # Winner
    winner = leaderboard[0] if leaderboard else None
    winner_name = _esc(winner.get("simulation_name", "Unknown")) if winner else "N/A"

    winner_html = f"""\
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:2px solid {_AMBER};padding:16px 20px;background-color:{_SURFACE};text-align:center;">
                <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:{_TEXT_DIM};text-transform:uppercase;">
                  {_nt('winner', lang)}
                </p>
                <p style="margin:0;font-size:20px;font-weight:900;color:{_AMBER};letter-spacing:2px;">
                  &#128081; {winner_name}
                </p>
                <p style="margin:4px 0 0;font-size:14px;color:{_TEXT};">
                  {_nt('composite', lang)}: {winner['composite']:.1f}
                </p>
              </div>
            </td>
          </tr>"""

    # Leaderboard table
    lb_rows = ""
    for entry in leaderboard:
        is_player = entry.get("simulation_id") == player_simulation_id
        row_bg = "#1a1a00" if is_player else "transparent"
        name_color = _AMBER if is_player else _TEXT
        sim_name = _esc(entry.get("simulation_name", "Unknown"))

        lb_rows += f"""\
                  <tr style="background-color:{row_bg};">
                    <td style="font-size:13px;color:{_TEXT_DIM};padding:6px 4px;text-align:center;border-bottom:1px solid {_BORDER_SUBTLE};">#{entry['rank']}</td>
                    <td style="font-size:13px;color:{name_color};padding:6px 4px;border-bottom:1px solid {_BORDER_SUBTLE};font-weight:{'bold' if is_player else 'normal'};">{sim_name}</td>
                    <td style="font-size:13px;color:{_AMBER};padding:6px 4px;text-align:right;border-bottom:1px solid {_BORDER_SUBTLE};font-weight:bold;">{entry['composite']:.1f}</td>
                  </tr>"""

    leaderboard_html = f"""\
{_section_header(_nt('final_standings', lang))}
          <tr>
            <td style="padding:0 32px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{_SURFACE};border:1px dashed {_BORDER};">
                <tr>
                  <td style="font-size:10px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:8px 4px;text-align:center;border-bottom:1px solid {_BORDER};">#</td>
                  <td style="font-size:10px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:8px 4px;border-bottom:1px solid {_BORDER};">SIM</td>
                  <td style="font-size:10px;color:{_TEXT_DIM};letter-spacing:2px;text-transform:uppercase;padding:8px 4px;text-align:right;border-bottom:1px solid {_BORDER};">{_nt('composite', lang)}</td>
                </tr>
{lb_rows}
              </table>
            </td>
          </tr>"""

    # Player result
    player_entry = next(
        (e for e in leaderboard if e.get("simulation_id") == player_simulation_id),
        None,
    )
    player_result_html = ""
    if player_entry:
        player_result_html = f"""\
{_section_header(_nt('your_result', lang))}
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
                <p style="margin:0;font-size:14px;color:{_TEXT};line-height:1.8;">
                  {_nt('rank', lang)}: <strong style="color:{_AMBER};">#{player_entry['rank']}</strong> / {len(leaderboard)}
                  &nbsp;&middot;&nbsp;
                  {_nt('composite', lang)}: <strong style="color:{_AMBER};">{player_entry['composite']:.1f}</strong>
                </p>
              </div>
            </td>
          </tr>"""

    # Dimension titles
    dim_titles = {
        "stability_title": ("stability", _nt("stability", lang)),
        "influence_title": ("influence", _nt("influence", lang)),
        "sovereignty_title": ("sovereignty", _nt("sovereignty", lang)),
        "diplomatic_title": ("diplomatic", _nt("diplomatic", lang)),
        "military_title": ("military", _nt("military", lang)),
    }
    title_items = ""
    for title_key, (_dim_key, dim_label) in dim_titles.items():
        for entry in leaderboard:
            title = entry.get(title_key)
            if title:
                translated_title = _TITLE_TRANSLATIONS.get(title, {}).get(lang, title)
                sim_name = _esc(entry.get("simulation_name", "Unknown"))
                title_items += f"""\
                <p style="margin:0 0 4px;font-size:13px;color:{_TEXT};line-height:1.6;">
                  &#9656; <strong style="color:{_AMBER};">{translated_title}</strong> ({dim_label}) &mdash; {sim_name}
                </p>"""

    titles_html = ""
    if title_items:
        titles_html = f"""\
{_section_header(_nt('dimension_titles', lang))}
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border:1px dashed {_BORDER};padding:12px 16px;background-color:{_SURFACE};">
{title_items}
              </div>
            </td>
          </tr>"""

    # Stats
    stats_html = f"""\
          <tr>
            <td style="padding:8px 32px 16px;">
              <p style="margin:0;font-size:12px;color:{_TEXT_DIM};letter-spacing:1px;">
                {_nt('total_cycles', lang)}: <strong style="color:{_TEXT};">{cycle_count}</strong>
              </p>
            </td>
          </tr>"""

    return f"{winner_html}\n{leaderboard_html}\n{player_result_html}\n{titles_html}\n{stats_html}"


def render_epoch_completed(
    epoch_name: str,
    leaderboard: list[dict],
    player_simulation_id: str,
    cycle_count: int,
    command_center_url: str,
) -> str:
    """Render the epoch completed notification email — bilingual (EN first, then DE)."""
    safe_name = _esc(epoch_name)
    cta_url = command_center_url

    # EN block
    en_header = f"""\
          <tr>
            <td style="padding:24px 32px;border-bottom:2px solid {_AMBER};">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('epoch_complete_header', 'en')}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 16px;">
              <h1 style="margin:0;font-size:22px;font-weight:900;color:{_AMBER};letter-spacing:2px;text-transform:uppercase;font-family:{_MONO};">
                {safe_name}
              </h1>
            </td>
          </tr>"""

    en_block = _render_completed_block(safe_name, leaderboard, player_simulation_id, cycle_count, "en")
    en_cta = _cta_button(cta_url, _nt("cta", "en"))

    # DE block
    divider = _language_divider()

    de_header = f"""\
          <tr>
            <td style="padding:24px 32px 16px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;color:{_TEXT_DIM};text-transform:uppercase;">
                {_nt('epoch_complete_header', 'de')}
              </p>
              <h2 style="margin:0;font-size:20px;font-weight:900;color:{_AMBER};letter-spacing:2px;text-transform:uppercase;font-family:{_MONO};">
                {safe_name}
              </h2>
            </td>
          </tr>"""

    de_block = _render_completed_block(safe_name, leaderboard, player_simulation_id, cycle_count, "de")
    de_cta = _cta_button(cta_url, _nt("cta", "de"))

    footer = _footer_row()
    content = f"{en_header}\n{en_block}\n{en_cta}\n{divider}\n{de_header}\n{de_block}\n{de_cta}\n{footer}"
    return _email_shell(f"CLASSIFIED // OPERATION COMPLETE \u2014 {safe_name}", content)
