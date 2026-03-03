"""Cycle notification service — email notifications for epoch events.

Sends tactical briefing emails to human players when cycles resolve,
phases change, or epochs complete. Respects fog-of-war and notification
preferences. Uses SMTP for delivery.
"""

import asyncio
import logging

from backend.services.email_service import EmailService
from backend.services.email_templates import (
    render_cycle_briefing,
    render_epoch_completed,
    render_phase_change,
)
from supabase import Client

logger = logging.getLogger(__name__)

# Sequential send delay between emails (ms)
_SEND_DELAY_MS = 200


class CycleNotificationService:
    """Sends email notifications for epoch lifecycle events."""

    # ── Recipient Resolution ───────────────────────────────

    @classmethod
    async def _resolve_recipients(
        cls,
        admin_supabase: Client,
        epoch_id: str,
        *,
        notification_type: str = "cycle_resolved",
    ) -> list[dict]:
        """Resolve human participants to email addresses with preference checks.

        Chain: epoch_participants → source_template_id → simulation_members → auth.users → preferences

        Returns list of dicts: {user_id, email, simulation_id, simulation_name, email_locale}
        """
        # 1. Get human participants (not bots) with simulation info
        participants_resp = (
            admin_supabase.table("epoch_participants")
            .select("simulation_id, is_bot, simulations(name, source_template_id)")
            .eq("epoch_id", epoch_id)
            .eq("is_bot", False)
            .execute()
        )
        participants = participants_resp.data or []
        if not participants:
            return []

        # 2. Resolve template simulation IDs → user_ids via simulation_members
        # Game instances point to their template via source_template_id
        template_to_participant: dict[str, dict] = {}
        for p in participants:
            sim_info = p.get("simulations") or {}
            template_id = sim_info.get("source_template_id") or p["simulation_id"]
            template_to_participant[template_id] = {
                "simulation_id": p["simulation_id"],
                "simulation_name": sim_info.get("name", "Unknown"),
            }

        template_ids = list(template_to_participant.keys())

        # Batch fetch members (editors+) for all template simulations
        members_resp = (
            admin_supabase.table("simulation_members")
            .select("user_id, simulation_id")
            .in_("simulation_id", template_ids)
            .in_("member_role", ["editor", "admin", "owner"])
            .execute()
        )
        members = members_resp.data or []
        if not members:
            return []

        # 3. Get email addresses via SECURITY DEFINER RPC
        user_ids = list({m["user_id"] for m in members})
        email_resp = admin_supabase.rpc(
            "get_user_emails_batch", {"user_ids": user_ids}
        ).execute()
        email_map: dict[str, str] = {
            row["id"]: row["email"] for row in (email_resp.data or [])
        }

        # 4. Get notification preferences (batch)
        prefs_resp = (
            admin_supabase.table("notification_preferences")
            .select("user_id, cycle_resolved, phase_changed, epoch_completed, email_locale")
            .in_("user_id", user_ids)
            .execute()
        )
        prefs_map: dict[str, dict] = {
            row["user_id"]: row for row in (prefs_resp.data or [])
        }

        # 5. Build recipient list with preference filtering
        recipients = []
        for m in members:
            user_id = m["user_id"]
            email = email_map.get(user_id)
            if not email:
                continue

            prefs = prefs_map.get(user_id, {})
            # Default: all notifications enabled
            if not prefs.get(notification_type, True):
                continue

            participant_info = template_to_participant.get(m["simulation_id"], {})
            recipients.append({
                "user_id": user_id,
                "email": email,
                "simulation_id": participant_info.get("simulation_id", m["simulation_id"]),
                "simulation_name": participant_info.get("simulation_name", "Unknown"),
                "email_locale": prefs.get("email_locale", "en"),
            })

        return recipients

    # ── Player Briefing Data ───────────────────────────────

    @classmethod
    async def _build_player_briefing(
        cls,
        admin_supabase: Client,
        epoch_id: str,
        simulation_id: str,
        cycle_number: int,
        epoch_name: str,
        epoch_status: str,
    ) -> dict:
        """Gather fog-of-war compliant briefing data for a single player.

        Returns dict with: rank, composite, delta, dimensions, operatives, rp, public_events
        """
        # Current cycle scores
        current_resp = (
            admin_supabase.table("epoch_scores")
            .select("*")
            .eq("epoch_id", epoch_id)
            .eq("cycle_number", cycle_number)
            .order("composite_score", desc=True)
            .execute()
        )
        current_scores = current_resp.data or []

        # Previous cycle scores (for deltas)
        prev_cycle = cycle_number - 1
        prev_scores_map: dict[str, dict] = {}
        if prev_cycle >= 1:
            prev_resp = (
                admin_supabase.table("epoch_scores")
                .select(
                "simulation_id, composite_score, stability_score,"
                " influence_score, sovereignty_score, diplomatic_score, military_score"
            )
                .eq("epoch_id", epoch_id)
                .eq("cycle_number", prev_cycle)
                .execute()
            )
            prev_scores_map = {s["simulation_id"]: s for s in (prev_resp.data or [])}

        # Find this player's score and rank
        player_score = None
        player_rank = 0
        total_players = len(current_scores)
        prev_rank = 0

        for idx, s in enumerate(current_scores, start=1):
            if s["simulation_id"] == simulation_id:
                player_score = s
                player_rank = idx

        # Compute previous rank
        if prev_cycle >= 1:
            prev_all = (
                admin_supabase.table("epoch_scores")
                .select("simulation_id, composite_score")
                .eq("epoch_id", epoch_id)
                .eq("cycle_number", prev_cycle)
                .order("composite_score", desc=True)
                .execute()
            )
            for idx, s in enumerate(prev_all.data or [], start=1):
                if s["simulation_id"] == simulation_id:
                    prev_rank = idx

        prev_score = prev_scores_map.get(simulation_id, {})
        dimensions = ["stability", "influence", "sovereignty", "diplomatic", "military"]

        dim_data = []
        if player_score:
            for dim in dimensions:
                col = f"{dim}_score"
                current_val = float(player_score.get(col, 0))
                prev_val = float(prev_score.get(col, 0)) if prev_score else 0
                dim_data.append({
                    "name": dim,
                    "value": round(current_val, 1),
                    "delta": round(current_val - prev_val, 1),
                })

        composite = float(player_score["composite_score"]) if player_score else 0
        prev_composite = float(prev_score.get("composite_score", 0)) if prev_score else 0

        # Operative summary (this player's missions only — fog-of-war)
        ops_resp = (
            admin_supabase.table("operative_missions")
            .select("operative_type, status")
            .eq("epoch_id", epoch_id)
            .eq("source_simulation_id", simulation_id)
            .execute()
        )
        ops = ops_resp.data or []
        active_ops = sum(1 for o in ops if o["status"] == "active")
        resolved_ops = [o for o in ops if o["status"] in ("success", "failed", "detected", "captured")]
        success_ops = sum(1 for o in resolved_ops if o["status"] == "success")
        detected_ops = sum(1 for o in resolved_ops if o["status"] in ("detected", "captured"))
        guardians = sum(1 for o in ops if o["operative_type"] == "guardian" and o["status"] == "active")
        counter_intel = sum(1 for o in ops if o["operative_type"] == "counter_intel" and o["status"] == "active")

        # RP balance
        rp_resp = (
            admin_supabase.table("epoch_participants")
            .select("resource_points")
            .eq("epoch_id", epoch_id)
            .eq("simulation_id", simulation_id)
            .maybe_single()
            .execute()
        )
        rp_balance = rp_resp.data.get("resource_points", 0) if rp_resp.data else 0

        # Public battle log events from this cycle
        log_resp = (
            admin_supabase.table("battle_log")
            .select("narrative, event_type")
            .eq("epoch_id", epoch_id)
            .eq("cycle_number", cycle_number)
            .eq("is_public", True)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        public_events = [
            {"narrative": e["narrative"], "event_type": e["event_type"]}
            for e in (log_resp.data or [])
        ]

        return {
            "epoch_name": epoch_name,
            "epoch_status": epoch_status,
            "cycle_number": cycle_number,
            "rank": player_rank,
            "prev_rank": prev_rank,
            "total_players": total_players,
            "composite": round(composite, 1),
            "composite_delta": round(composite - prev_composite, 1),
            "dimensions": dim_data,
            "rp_balance": rp_balance,
            "rp_cap": 40,
            "active_ops": active_ops,
            "resolved_ops": len(resolved_ops),
            "success_ops": success_ops,
            "detected_ops": detected_ops,
            "guardians": guardians,
            "counter_intel": counter_intel,
            "public_events": public_events,
            "command_center_url": "https://metaverse.center/epoch",
        }

    # ── Send Methods ───────────────────────────────────────

    @classmethod
    async def send_cycle_notifications(
        cls,
        admin_supabase: Client,
        epoch_id: str,
        cycle_number: int,
    ) -> int:
        """Send cycle-resolved briefing emails to all human participants.

        Returns the number of emails successfully sent.
        """
        # Fetch epoch info
        epoch_resp = (
            admin_supabase.table("game_epochs")
            .select("name, status, config")
            .eq("id", epoch_id)
            .single()
            .execute()
        )
        if not epoch_resp.data:
            logger.warning("Epoch %s not found for cycle notifications", epoch_id)
            return 0

        epoch = epoch_resp.data
        epoch_name = epoch.get("name", "Unknown Operation")
        epoch_status = epoch.get("status", "competition")

        recipients = await cls._resolve_recipients(
            admin_supabase, epoch_id, notification_type="cycle_resolved"
        )
        if not recipients:
            logger.info("No recipients for cycle %d notifications (epoch %s)", cycle_number, epoch_id)
            return 0

        sent_count = 0
        for recipient in recipients:
            try:
                briefing = await cls._build_player_briefing(
                    admin_supabase,
                    epoch_id,
                    recipient["simulation_id"],
                    cycle_number,
                    epoch_name,
                    epoch_status,
                )
                briefing["simulation_name"] = recipient["simulation_name"]

                html_body = render_cycle_briefing(briefing)
                subject = f"CLASSIFIED // SITREP \u2014 {epoch_name} \u2014 Cycle {cycle_number}"

                if await EmailService.send(recipient["email"], subject, html_body):
                    sent_count += 1

                # Rate limit: 200ms between sends
                await asyncio.sleep(_SEND_DELAY_MS / 1000)

            except Exception:
                logger.warning(
                    "Failed to send cycle notification to %s",
                    recipient["email"],
                    exc_info=True,
                )

        logger.info(
            "Sent %d/%d cycle %d notifications for epoch %s",
            sent_count, len(recipients), cycle_number, epoch_id,
        )
        return sent_count

    @classmethod
    async def send_phase_change_notifications(
        cls,
        admin_supabase: Client,
        epoch_id: str,
        old_phase: str,
        new_phase: str,
    ) -> int:
        """Send phase-change emails to all human participants."""
        epoch_resp = (
            admin_supabase.table("game_epochs")
            .select("name, current_cycle")
            .eq("id", epoch_id)
            .single()
            .execute()
        )
        if not epoch_resp.data:
            return 0

        epoch_name = epoch_resp.data.get("name", "Unknown Operation")
        cycle_count = epoch_resp.data.get("current_cycle", 0)

        recipients = await cls._resolve_recipients(
            admin_supabase, epoch_id, notification_type="phase_changed"
        )
        if not recipients:
            return 0

        html_body = render_phase_change(
            epoch_name=epoch_name,
            old_phase=old_phase,
            new_phase=new_phase,
            cycle_count=cycle_count,
            command_center_url="https://metaverse.center/epoch",
        )
        subject = f"CLASSIFIED // PHASE TRANSITION \u2014 {epoch_name}"

        sent_count = 0
        for recipient in recipients:
            try:
                if await EmailService.send(recipient["email"], subject, html_body):
                    sent_count += 1
                await asyncio.sleep(_SEND_DELAY_MS / 1000)
            except Exception:
                logger.warning(
                    "Failed to send phase change notification to %s",
                    recipient["email"],
                    exc_info=True,
                )

        logger.info(
            "Sent %d/%d phase change notifications (%s→%s) for epoch %s",
            sent_count, len(recipients), old_phase, new_phase, epoch_id,
        )
        return sent_count

    @classmethod
    async def send_epoch_completed_notifications(
        cls,
        admin_supabase: Client,
        epoch_id: str,
    ) -> int:
        """Send epoch-completed emails with final leaderboard."""
        epoch_resp = (
            admin_supabase.table("game_epochs")
            .select("name, current_cycle")
            .eq("id", epoch_id)
            .single()
            .execute()
        )
        if not epoch_resp.data:
            return 0

        epoch_name = epoch_resp.data.get("name", "Unknown Operation")
        cycle_count = epoch_resp.data.get("current_cycle", 0)

        recipients = await cls._resolve_recipients(
            admin_supabase, epoch_id, notification_type="epoch_completed"
        )
        if not recipients:
            return 0

        # Get final leaderboard
        from backend.services.scoring_service import ScoringService

        leaderboard = await ScoringService.get_final_standings(admin_supabase, epoch_id)

        sent_count = 0
        for recipient in recipients:
            try:
                html_body = render_epoch_completed(
                    epoch_name=epoch_name,
                    leaderboard=leaderboard,
                    player_simulation_id=recipient["simulation_id"],
                    cycle_count=cycle_count,
                    command_center_url="https://metaverse.center/epoch",
                )
                subject = f"CLASSIFIED // OPERATION COMPLETE \u2014 {epoch_name}"

                if await EmailService.send(recipient["email"], subject, html_body):
                    sent_count += 1
                await asyncio.sleep(_SEND_DELAY_MS / 1000)
            except Exception:
                logger.warning(
                    "Failed to send epoch completed notification to %s",
                    recipient["email"],
                    exc_info=True,
                )

        logger.info(
            "Sent %d/%d epoch completed notifications for epoch %s",
            sent_count, len(recipients), epoch_id,
        )
        return sent_count

