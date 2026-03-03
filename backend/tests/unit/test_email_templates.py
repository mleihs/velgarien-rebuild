"""Unit tests for email templates — structure and content verification."""

from backend.services.email_templates import (
    render_cycle_briefing,
    render_epoch_completed,
    render_epoch_invitation,
    render_phase_change,
)

# ── Cycle Briefing ────────────────────────────────────────────


class TestRenderCycleBriefing:
    def _sample_data(self) -> dict:
        return {
            "epoch_name": "Operation Shadow",
            "epoch_status": "competition",
            "cycle_number": 3,
            "rank": 2,
            "prev_rank": 3,
            "total_players": 4,
            "composite": 72.3,
            "composite_delta": 3.2,
            "dimensions": [
                {"name": "stability", "value": 72.3, "delta": 2.1},
                {"name": "influence", "value": 45.0, "delta": -1.3},
                {"name": "sovereignty", "value": 88.1, "delta": 0.0},
                {"name": "diplomatic", "value": 60.5, "delta": 5.2},
                {"name": "military", "value": 33.2, "delta": 8.0},
            ],
            "rp_balance": 18,
            "rp_cap": 40,
            "active_ops": 3,
            "resolved_ops": 2,
            "success_ops": 1,
            "detected_ops": 1,
            "guardians": 2,
            "counter_intel": 0,
            "public_events": [
                {"narrative": "An operative was detected infiltrating Station Null.", "event_type": "detection"},
                {"narrative": "Alliance Shadow Pact dissolved.", "event_type": "betrayal"},
            ],
            "simulation_name": "Velgarien",
            "command_center_url": "https://metaverse.center/epoch",
        }

    def test_contains_epoch_name(self):
        html = render_cycle_briefing(self._sample_data())
        assert "Operation Shadow" in html

    def test_contains_cycle_number(self):
        html = render_cycle_briefing(self._sample_data())
        assert "CYCLE 3 RESOLVED" in html

    def test_contains_rank(self):
        html = render_cycle_briefing(self._sample_data())
        assert "#2 / 4" in html

    def test_contains_composite_score(self):
        html = render_cycle_briefing(self._sample_data())
        assert "72.3" in html

    def test_contains_dimension_names_en(self):
        html = render_cycle_briefing(self._sample_data())
        assert "STABILITY" in html
        assert "INFLUENCE" in html
        assert "SOVEREIGNTY" in html
        assert "DIPLOMATIC" in html
        assert "MILITARY" in html

    def test_contains_dimension_names_de(self):
        """German section should contain translated dimension names."""
        html = render_cycle_briefing(self._sample_data())
        assert "STABILIT" in html  # STABILITÄT
        assert "EINFLUSS" in html
        assert "DIPLOMATIE" in html

    def test_contains_operative_status(self):
        html = render_cycle_briefing(self._sample_data())
        assert "ACTIVE" in html
        assert "RESOLVED" in html

    def test_contains_public_events(self):
        html = render_cycle_briefing(self._sample_data())
        assert "Station Null" in html
        assert "Shadow Pact" in html

    def test_contains_cta_link(self):
        html = render_cycle_briefing(self._sample_data())
        assert "https://metaverse.center/epoch" in html

    def test_contains_german_section(self):
        html = render_cycle_briefing(self._sample_data())
        assert "DEUTSCHE VERSION" in html

    def test_contains_footer_links(self):
        html = render_cycle_briefing(self._sample_data())
        assert "Manage notifications" in html
        assert "Benachrichtigungen verwalten" in html

    def test_html_structure(self):
        html = render_cycle_briefing(self._sample_data())
        assert html.startswith("<!DOCTYPE html>")
        assert "</html>" in html
        assert '<body' in html

    def test_escapes_epoch_name(self):
        data = self._sample_data()
        data["epoch_name"] = "Test <script>alert(1)</script>"
        html = render_cycle_briefing(data)
        assert "<script>" not in html
        assert "&lt;script&gt;" in html

    def test_no_events_shows_no_intercepts(self):
        data = self._sample_data()
        data["public_events"] = []
        html = render_cycle_briefing(data)
        assert "No public signals intercepted" in html


# ── Phase Change ──────────────────────────────────────────────


class TestRenderPhaseChange:
    def test_contains_phase_names(self):
        html = render_phase_change(
            epoch_name="Operation Dawn",
            old_phase="foundation",
            new_phase="competition",
            cycle_count=5,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "FOUNDATION" in html
        assert "COMPETITION" in html
        assert "Operation Dawn" in html

    def test_contains_german_phase_names(self):
        html = render_phase_change(
            epoch_name="Test",
            old_phase="competition",
            new_phase="reckoning",
            cycle_count=10,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "WETTBEWERB" in html
        assert "ABRECHNUNG" in html

    def test_contains_cycle_count(self):
        html = render_phase_change(
            epoch_name="Test",
            old_phase="foundation",
            new_phase="competition",
            cycle_count=7,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "7" in html

    def test_contains_operational_changes(self):
        html = render_phase_change(
            epoch_name="Test",
            old_phase="foundation",
            new_phase="competition",
            cycle_count=5,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "Standard RP allocation" in html

    def test_bilingual(self):
        html = render_phase_change(
            epoch_name="Test",
            old_phase="foundation",
            new_phase="competition",
            cycle_count=5,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "DEUTSCHE VERSION" in html


# ── Epoch Completed ───────────────────────────────────────────


class TestRenderEpochCompleted:
    def _sample_leaderboard(self) -> list[dict]:
        return [
            {
                "rank": 1,
                "simulation_id": "sim-a",
                "simulation_name": "Velgarien",
                "composite": 85.2,
                "stability": 90.0,
                "influence": 75.0,
                "sovereignty": 88.0,
                "diplomatic": 70.0,
                "military": 82.0,
                "stability_title": "The Unshaken",
            },
            {
                "rank": 2,
                "simulation_id": "sim-b",
                "simulation_name": "The Gaslit Reach",
                "composite": 72.1,
                "stability": 65.0,
                "influence": 80.0,
                "sovereignty": 70.0,
                "diplomatic": 75.0,
                "military": 68.0,
                "influence_title": "The Resonant",
            },
        ]

    def test_contains_winner(self):
        html = render_epoch_completed(
            epoch_name="Operation Final",
            leaderboard=self._sample_leaderboard(),
            player_simulation_id="sim-b",
            cycle_count=15,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "Velgarien" in html
        # Crown emoji for winner
        assert "128081" in html or "&#128081;" in html

    def test_contains_leaderboard(self):
        html = render_epoch_completed(
            epoch_name="Test",
            leaderboard=self._sample_leaderboard(),
            player_simulation_id="sim-b",
            cycle_count=15,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "Velgarien" in html
        assert "The Gaslit Reach" in html
        assert "85.2" in html
        assert "72.1" in html

    def test_highlights_player(self):
        """Player's row should have a highlighted background."""
        html = render_epoch_completed(
            epoch_name="Test",
            leaderboard=self._sample_leaderboard(),
            player_simulation_id="sim-b",
            cycle_count=15,
            command_center_url="https://metaverse.center/epoch",
        )
        # The player row has a different bg color
        assert "#1a1a00" in html

    def test_contains_dimension_titles(self):
        html = render_epoch_completed(
            epoch_name="Test",
            leaderboard=self._sample_leaderboard(),
            player_simulation_id="sim-b",
            cycle_count=15,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "The Unshaken" in html
        assert "The Resonant" in html

    def test_contains_german_dimension_titles(self):
        html = render_epoch_completed(
            epoch_name="Test",
            leaderboard=self._sample_leaderboard(),
            player_simulation_id="sim-b",
            cycle_count=15,
            command_center_url="https://metaverse.center/epoch",
        )
        # German section
        assert "Der Unersch" in html  # Der Unerschütterliche
        assert "Der Einflussreiche" in html

    def test_bilingual(self):
        html = render_epoch_completed(
            epoch_name="Test",
            leaderboard=self._sample_leaderboard(),
            player_simulation_id="sim-b",
            cycle_count=15,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "DEUTSCHE VERSION" in html

    def test_total_cycles(self):
        html = render_epoch_completed(
            epoch_name="Test",
            leaderboard=self._sample_leaderboard(),
            player_simulation_id="sim-b",
            cycle_count=15,
            command_center_url="https://metaverse.center/epoch",
        )
        assert "15" in html


# ── Existing Invitation (regression) ─────────────────────────


class TestRenderEpochInvitation:
    def _render(self, **overrides) -> str:
        defaults = {
            "epoch_name": "Test Epoch",
            "lore_text": "The shadows gather in the void...",
            "invite_url": "https://metaverse.center/epoch/join?token=abc",
            "locale": "en",
        }
        defaults.update(overrides)
        return render_epoch_invitation(**defaults)

    def test_renders_without_error(self):
        html = self._render()
        assert "Test Epoch" in html
        assert "The shadows gather" in html
        assert "token=abc" in html

    def test_html_structure(self):
        html = self._render()
        assert html.startswith("<!DOCTYPE html>")
        assert "</html>" in html
        assert "<body" in html
        assert "EPOCH SUMMONS" in html

    def test_bilingual_en_and_de(self):
        html = self._render()
        assert "DEUTSCHE VERSION" in html
        # EN header
        assert "CLASSIFIED // EPOCH SUMMONS" in html
        # DE header
        assert "EPOCHEN-EINBERUFUNG" in html

    def test_contains_intro_en(self):
        html = self._render()
        assert "classified operation" in html
        assert "tactical decisions" in html

    def test_contains_intro_de(self):
        html = self._render()
        assert "geheime Operation" in html
        assert "taktischen Entscheidungen" in html

    def test_contains_operation_label(self):
        html = self._render()
        assert "OPERATION" in html

    def test_contains_intel_dossier(self):
        html = self._render()
        assert "INTEL DISPATCH" in html
        assert "GEHEIMDIENSTBERICHT" in html
        assert "The shadows gather" in html

    def test_contains_mission_parameters(self):
        html = self._render()
        assert "MISSION PARAMETERS" in html
        assert "MISSIONSPARAMETER" in html
        assert "Deploy operatives" in html
        assert "Forge alliances" in html
        assert "8-hour cycles" in html

    def test_contains_rules_of_engagement(self):
        html = self._render()
        assert "RULES OF ENGAGEMENT" in html
        assert "EINSATZREGELN" in html
        assert "Each player commands one simulation" in html
        assert "5 dimensions" in html
        assert "Resource Points" in html
        assert "Fog of war" in html

    def test_contains_cta_buttons(self):
        html = self._render()
        assert "ACCEPT THE SUMMONS" in html
        assert "EINBERUFUNG ANNEHMEN" in html
        # URL appears in both CTA buttons
        assert html.count("token=abc") >= 2

    def test_contains_footer(self):
        html = self._render()
        assert "Manage notifications" in html
        assert "Benachrichtigungen verwalten" in html
        assert "TRANSMISSION ORIGIN" in html

    def test_escapes_epoch_name_xss(self):
        html = self._render(epoch_name='<script>alert("xss")</script>')
        assert "<script>" not in html
        assert "&lt;script&gt;" in html

    def test_escapes_lore_text_xss(self):
        html = self._render(lore_text='<img src=x onerror="alert(1)">')
        assert "<img" not in html
        assert "&lt;img" in html

    def test_escapes_invite_url_xss(self):
        html = self._render(invite_url='https://evil.com/"><script>alert(1)</script>')
        assert '"><script>' not in html

    def test_dossier_box_styling(self):
        """Intel dossier should use dashed border box."""
        html = self._render()
        assert "border:1px dashed" in html

    def test_section_header_pattern(self):
        """Section headers use box-drawing characters."""
        html = self._render()
        # Section headers use ── pattern (U+9472 horizontal box)
        assert "&#9472;&#9472;" in html
