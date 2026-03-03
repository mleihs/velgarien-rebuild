"""Epoch lifecycle management — create, join, transition, RP allocation."""

import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status

from backend.dependencies import get_admin_supabase
from backend.models.epoch import EpochConfig
from backend.services.game_instance_service import GameInstanceService
from supabase import Client

logger = logging.getLogger(__name__)

# Default epoch config (matches EpochConfig defaults)
DEFAULT_CONFIG = EpochConfig().model_dump()

# RP costs for each operative type
OPERATIVE_RP_COSTS: dict[str, int] = {
    "spy": 3,
    "saboteur": 5,
    "propagandist": 4,
    "assassin": 7,
    "guardian": 4,
    "infiltrator": 5,
}


class EpochService:
    """Service for epoch CRUD and lifecycle management."""

    # ── Read ──────────────────────────────────────────────────

    @classmethod
    async def list_epochs(
        cls,
        supabase: Client,
        *,
        status_filter: str | None = None,
        limit: int = 25,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        """List epochs with optional status filter."""
        query = supabase.table("game_epochs").select("*", count="exact")
        if status_filter:
            query = query.eq("status", status_filter)
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        resp = query.execute()
        return resp.data or [], resp.count or 0

    @classmethod
    async def get(cls, supabase: Client, epoch_id: UUID) -> dict:
        """Get a single epoch by ID."""
        resp = (
            supabase.table("game_epochs")
            .select("*")
            .eq("id", str(epoch_id))
            .single()
            .execute()
        )
        if not resp.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Epoch not found.")
        return resp.data

    @classmethod
    async def get_active_epochs(cls, supabase: Client) -> list[dict]:
        """Get all active epochs (lobby/foundation/competition/reckoning)."""
        resp = (
            supabase.table("game_epochs")
            .select("*")
            .in_("status", ["lobby", "foundation", "competition", "reckoning"])
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data or []

    # ── Create / Update ──────────────────────────────────────

    @classmethod
    async def create(
        cls,
        supabase: Client,
        user_id: UUID,
        name: str,
        description: str | None = None,
        config: dict | None = None,
    ) -> dict:
        """Create a new epoch in lobby status."""
        merged_config = {**DEFAULT_CONFIG, **(config or {})}

        data = {
            "name": name,
            "description": description,
            "created_by_id": str(user_id),
            "config": merged_config,
        }
        resp = supabase.table("game_epochs").insert(data).execute()
        if not resp.data:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create epoch.")
        return resp.data[0]

    @classmethod
    async def update(
        cls,
        supabase: Client,
        epoch_id: UUID,
        updates: dict,
    ) -> dict:
        """Update epoch details (only in lobby phase)."""
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] != "lobby":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Can only edit epoch configuration during lobby phase.",
            )
        resp = (
            supabase.table("game_epochs")
            .update(updates)
            .eq("id", str(epoch_id))
            .execute()
        )
        if not resp.data:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to update epoch.")
        return resp.data[0]

    # ── Lifecycle Transitions ────────────────────────────────

    @classmethod
    async def start_epoch(cls, supabase: Client, epoch_id: UUID, user_id: UUID) -> dict:
        """Transition epoch from lobby -> foundation.

        This triggers the game instance cloning process:
        1. Clone all participating simulations into game instances
        2. epoch_participants are repointed to instance simulation_ids
        3. Transition epoch to foundation phase
        4. Grant initial RP
        """
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] != "lobby":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot start epoch with status '{epoch['status']}'.",
            )

        # Need at least 2 participants
        participants = await cls.list_participants(supabase, epoch_id)
        if len(participants) < 2:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Need at least 2 participants to start an epoch.",
            )

        # Auto-complete drafts for participants who haven't drafted
        # (backwards compatibility: select first N agents by created_at)
        config = {**DEFAULT_CONFIG, **epoch.get("config", {})}
        max_agents = config.get("max_agents_per_player", 6)
        for p in participants:
            if not p.get("drafted_agent_ids"):
                agent_resp = (
                    supabase.table("agents")
                    .select("id")
                    .eq("simulation_id", str(p["simulation_id"]))
                    .is_("deleted_at", "null")
                    .order("created_at")
                    .limit(max_agents)
                    .execute()
                )
                auto_ids = [a["id"] for a in (agent_resp.data or [])]
                if auto_ids:
                    supabase.table("epoch_participants").update({
                        "drafted_agent_ids": auto_ids,
                        "draft_completed_at": datetime.now(UTC).isoformat(),
                    }).eq("id", str(p["id"])).execute()

        # Clone simulations into game instances (atomic batch operation)
        admin = await get_admin_supabase()
        epoch_number = await GameInstanceService.get_epoch_number(supabase)
        instance_mapping = await GameInstanceService.clone_for_epoch(
            admin, epoch_id, user_id, epoch_number
        )

        config = {**DEFAULT_CONFIG, **epoch.get("config", {})}
        duration = timedelta(days=config["duration_days"])
        now = datetime.now(UTC)

        resp = (
            supabase.table("game_epochs")
            .update({
                "status": "foundation",
                "starts_at": now.isoformat(),
                "ends_at": (now + duration).isoformat(),
                "current_cycle": 1,
                "config": {
                    **config,
                    "instance_mapping": instance_mapping,
                },
            })
            .eq("id", str(epoch_id))
            .execute()
        )

        # Grant initial RP to all participants (foundation bonus)
        foundation_rp = int(config["rp_per_cycle"] * 1.5)
        await cls._grant_rp_batch(supabase, epoch_id, foundation_rp, config["rp_cap"])

        if not resp.data:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to start epoch.")
        return resp.data[0]

    @classmethod
    async def advance_phase(cls, supabase: Client, epoch_id: UUID) -> dict:
        """Advance to the next phase (foundation->competition->reckoning->completed).

        When advancing to 'completed', game instances are archived.
        """
        epoch = await cls.get(supabase, epoch_id)
        next_status_map = {
            "foundation": "competition",
            "competition": "reckoning",
            "reckoning": "completed",
        }
        next_status = next_status_map.get(epoch["status"])
        if not next_status:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot advance from '{epoch['status']}'.",
            )

        resp = (
            supabase.table("game_epochs")
            .update({"status": next_status})
            .eq("id", str(epoch_id))
            .execute()
        )

        # Archive game instances when epoch completes
        if next_status == "completed":
            admin = await get_admin_supabase()
            await GameInstanceService.archive_instances(admin, epoch_id)

        if not resp.data:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to advance phase.")
        return resp.data[0]

    @classmethod
    async def cancel_epoch(cls, supabase: Client, epoch_id: UUID) -> dict:
        """Cancel an epoch (any non-terminal state).

        Deletes all game instances created for this epoch.
        """
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] in ("completed", "cancelled"):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot cancel epoch with status '{epoch['status']}'.",
            )

        resp = (
            supabase.table("game_epochs")
            .update({"status": "cancelled"})
            .eq("id", str(epoch_id))
            .execute()
        )

        # Delete game instances (only exist if epoch was started)
        if epoch["status"] != "lobby":
            admin = await get_admin_supabase()
            await GameInstanceService.delete_instances(admin, epoch_id)

        if not resp.data:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to cancel epoch.")
        return resp.data[0]

    # ── Participants ─────────────────────────────────────────

    @classmethod
    async def list_participants(
        cls,
        supabase: Client,
        epoch_id: UUID,
    ) -> list[dict]:
        """List all participants in an epoch."""
        resp = (
            supabase.table("epoch_participants")
            .select(
                "*, simulations(name, slug, simulation_type, source_template_id),"
                " bot_players(name, personality, difficulty)"
            )
            .eq("epoch_id", str(epoch_id))
            .order("joined_at")
            .execute()
        )
        return resp.data or []

    @classmethod
    async def join_epoch(
        cls,
        supabase: Client,
        epoch_id: UUID,
        simulation_id: UUID,
        user_id: UUID | None = None,
    ) -> dict:
        """Join an epoch with a simulation.

        If user_id is provided, verifies the user is at least an editor
        in the simulation before allowing them to join.
        """
        if user_id:
            member_resp = (
                supabase.table("simulation_members")
                .select("member_role")
                .eq("simulation_id", str(simulation_id))
                .eq("user_id", str(user_id))
                .limit(1)
                .execute()
            )
            if not member_resp.data or member_resp.data[0]["member_role"] == "viewer":
                raise HTTPException(
                    status.HTTP_403_FORBIDDEN,
                    "You must be an editor or higher in this simulation to join an epoch.",
                )

        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] != "lobby":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Can only join epochs in lobby phase.",
            )

        # Check not already joined
        existing = (
            supabase.table("epoch_participants")
            .select("id")
            .eq("epoch_id", str(epoch_id))
            .eq("simulation_id", str(simulation_id))
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "This simulation is already in the epoch.",
            )

        resp = (
            supabase.table("epoch_participants")
            .insert({
                "epoch_id": str(epoch_id),
                "simulation_id": str(simulation_id),
            })
            .execute()
        )
        return resp.data[0] if resp.data else {}

    @classmethod
    async def leave_epoch(
        cls,
        supabase: Client,
        epoch_id: UUID,
        simulation_id: UUID,
    ) -> None:
        """Leave an epoch (lobby phase only)."""
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] != "lobby":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Can only leave epochs in lobby phase.",
            )

        supabase.table("epoch_participants").delete().eq(
            "epoch_id", str(epoch_id)
        ).eq("simulation_id", str(simulation_id)).execute()

    # ── Draft ────────────────────────────────────────────────

    @classmethod
    async def draft_agents(
        cls,
        supabase: Client,
        epoch_id: UUID,
        simulation_id: UUID,
        agent_ids: list[UUID],
    ) -> dict:
        """Lock in a draft roster for a participant."""
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] != "lobby":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Can only draft agents during lobby phase.",
            )

        # Check max_agents_per_player
        config = {**DEFAULT_CONFIG, **epoch.get("config", {})}
        max_agents = config.get("max_agents_per_player", 6)
        if len(agent_ids) > max_agents:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot draft more than {max_agents} agents.",
            )

        # Verify all agents belong to the participant's simulation
        for aid in agent_ids:
            agent_resp = (
                supabase.table("agents")
                .select("id")
                .eq("id", str(aid))
                .eq("simulation_id", str(simulation_id))
                .is_("deleted_at", "null")
                .execute()
            )
            if not agent_resp.data:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Agent {aid} not found in simulation {simulation_id}.",
                )

        # Update participant row
        resp = (
            supabase.table("epoch_participants")
            .update({
                "drafted_agent_ids": [str(a) for a in agent_ids],
                "draft_completed_at": datetime.now(UTC).isoformat(),
            })
            .eq("epoch_id", str(epoch_id))
            .eq("simulation_id", str(simulation_id))
            .execute()
        )
        if not resp.data:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Participant not found for this epoch/simulation.",
            )
        return resp.data[0]

    # ── Teams / Alliances ────────────────────────────────────

    @classmethod
    async def list_teams(cls, supabase: Client, epoch_id: UUID) -> list[dict]:
        """List all teams in an epoch."""
        resp = (
            supabase.table("epoch_teams")
            .select("*")
            .eq("epoch_id", str(epoch_id))
            .order("created_at")
            .execute()
        )
        return resp.data or []

    @classmethod
    async def create_team(
        cls,
        supabase: Client,
        epoch_id: UUID,
        simulation_id: UUID,
        name: str,
    ) -> dict:
        """Create a new team/alliance."""
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] not in ("lobby", "foundation"):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Alliances can only be formed during lobby or foundation phase.",
            )

        resp = (
            supabase.table("epoch_teams")
            .insert({
                "epoch_id": str(epoch_id),
                "name": name,
                "created_by_simulation_id": str(simulation_id),
            })
            .execute()
        )
        team = resp.data[0] if resp.data else {}

        # Auto-join creator to team
        if team:
            supabase.table("epoch_participants").update(
                {"team_id": team["id"]}
            ).eq("epoch_id", str(epoch_id)).eq(
                "simulation_id", str(simulation_id)
            ).execute()

        return team

    @classmethod
    async def join_team(
        cls,
        supabase: Client,
        epoch_id: UUID,
        team_id: UUID,
        simulation_id: UUID,
    ) -> dict:
        """Join an existing team."""
        epoch = await cls.get(supabase, epoch_id)
        config = {**DEFAULT_CONFIG, **epoch.get("config", {})}

        if epoch["status"] not in ("lobby", "foundation"):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Alliances can only be joined during lobby or foundation phase.",
            )

        # Check team size limit
        members = (
            supabase.table("epoch_participants")
            .select("id")
            .eq("epoch_id", str(epoch_id))
            .eq("team_id", str(team_id))
            .execute()
        )
        if len(members.data or []) >= config["max_team_size"]:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Team is full (max {config['max_team_size']} members).",
            )

        resp = (
            supabase.table("epoch_participants")
            .update({"team_id": str(team_id)})
            .eq("epoch_id", str(epoch_id))
            .eq("simulation_id", str(simulation_id))
            .execute()
        )
        return resp.data[0] if resp.data else {}

    @classmethod
    async def leave_team(
        cls,
        supabase: Client,
        epoch_id: UUID,
        simulation_id: UUID,
    ) -> dict:
        """Leave current team."""
        resp = (
            supabase.table("epoch_participants")
            .update({"team_id": None})
            .eq("epoch_id", str(epoch_id))
            .eq("simulation_id", str(simulation_id))
            .execute()
        )
        return resp.data[0] if resp.data else {}

    # ── Bot Participants ────────────────────────────────────

    @classmethod
    async def add_bot(
        cls,
        supabase: Client,
        epoch_id: UUID,
        simulation_id: UUID,
        bot_player_id: UUID,
    ) -> dict:
        """Add a bot participant to an epoch lobby."""
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] != "lobby":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Can only add bots during lobby phase.",
            )

        # Verify bot exists
        bot_resp = (
            supabase.table("bot_players")
            .select("id, name, personality")
            .eq("id", str(bot_player_id))
            .single()
            .execute()
        )
        if not bot_resp.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Bot player not found.")

        # Check simulation not already in epoch
        existing = (
            supabase.table("epoch_participants")
            .select("id")
            .eq("epoch_id", str(epoch_id))
            .eq("simulation_id", str(simulation_id))
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "This simulation is already in the epoch.",
            )

        # Auto-draft agents based on bot personality
        from backend.services.bot_personality import auto_draft

        config = {**DEFAULT_CONFIG, **epoch.get("config", {})}
        max_agents = config.get("max_agents_per_player", 6)

        # Load agents with aptitudes for draft selection
        agents_resp = (
            supabase.table("agents")
            .select("id, name")
            .eq("simulation_id", str(simulation_id))
            .is_("deleted_at", "null")
            .order("created_at")
            .execute()
        )
        agents = agents_resp.data or []

        # Load aptitudes for all agents in this sim
        aptitudes_resp = (
            supabase.table("agent_aptitudes")
            .select("agent_id, operative_type, aptitude_level")
            .eq("simulation_id", str(simulation_id))
            .execute()
        )
        apt_map: dict[str, dict[str, int]] = {}
        for row in aptitudes_resp.data or []:
            aid = row["agent_id"]
            if aid not in apt_map:
                apt_map[aid] = {}
            apt_map[aid][row["operative_type"]] = row["aptitude_level"]
        for agent in agents:
            agent["aptitudes"] = apt_map.get(agent["id"], {})

        drafted_ids = auto_draft(
            bot_resp.data["personality"], agents, max_agents
        )

        resp = (
            supabase.table("epoch_participants")
            .insert({
                "epoch_id": str(epoch_id),
                "simulation_id": str(simulation_id),
                "is_bot": True,
                "bot_player_id": str(bot_player_id),
                "drafted_agent_ids": drafted_ids,
                "draft_completed_at": datetime.now(UTC).isoformat(),
            })
            .execute()
        )
        if not resp.data:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to add bot.")
        return resp.data[0]

    @classmethod
    async def remove_bot(
        cls,
        supabase: Client,
        epoch_id: UUID,
        participant_id: UUID,
    ) -> None:
        """Remove a bot participant from epoch lobby."""
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] != "lobby":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Can only remove bots during lobby phase.",
            )

        p_resp = (
            supabase.table("epoch_participants")
            .select("id, is_bot")
            .eq("id", str(participant_id))
            .eq("epoch_id", str(epoch_id))
            .single()
            .execute()
        )
        if not p_resp.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Participant not found.")
        if not p_resp.data.get("is_bot"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "This participant is not a bot.")

        supabase.table("epoch_participants").delete().eq("id", str(participant_id)).execute()

    # ── RP Management ────────────────────────────────────────

    @classmethod
    async def _grant_rp_batch(
        cls,
        supabase: Client,
        epoch_id: UUID,
        amount: int,
        rp_cap: int,
    ) -> None:
        """Grant RP to all participants in an epoch, respecting the cap.

        Uses a single batch query via RPC to avoid N+1 SELECT+UPDATE loops.
        Falls back to per-participant updates if the batch approach isn't available.
        """
        now = datetime.now(UTC).isoformat()
        # Fetch all participants with current RP in a single query
        resp = (
            supabase.table("epoch_participants")
            .select("id, current_rp")
            .eq("epoch_id", str(epoch_id))
            .execute()
        )
        participants = resp.data or []

        # Build batch updates — group by target RP to minimize queries
        rp_groups: dict[int, list[str]] = {}
        for p in participants:
            current = p.get("current_rp", 0)
            new_rp = min(current + amount, rp_cap)
            rp_groups.setdefault(new_rp, []).append(p["id"])

        for new_rp, ids in rp_groups.items():
            supabase.table("epoch_participants").update({
                "current_rp": new_rp,
                "last_rp_grant_at": now,
            }).in_("id", ids).execute()

    @classmethod
    async def spend_rp(
        cls,
        supabase: Client,
        epoch_id: UUID,
        simulation_id: UUID,
        amount: int,
    ) -> int:
        """Spend RP with optimistic locking. Returns remaining RP.

        Prevents race conditions: the UPDATE includes an eq() check on the
        current balance. If two concurrent requests read the same balance,
        the first to write succeeds, the second fails because current_rp
        no longer matches.
        """
        resp = (
            supabase.table("epoch_participants")
            .select("id, current_rp")
            .eq("epoch_id", str(epoch_id))
            .eq("simulation_id", str(simulation_id))
            .single()
            .execute()
        )
        if not resp.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Not a participant.")

        current = resp.data["current_rp"]
        if current < amount:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Insufficient RP: have {current}, need {amount}.",
            )

        new_rp = current - amount
        update_resp = (
            supabase.table("epoch_participants")
            .update({"current_rp": new_rp})
            .eq("id", resp.data["id"])
            .eq("current_rp", current)  # optimistic lock
            .execute()
        )

        if not update_resp.data:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "RP balance changed concurrently. Please retry.",
            )

        return new_rp

    # ── Cycle Resolution ─────────────────────────────────────

    @classmethod
    async def resolve_cycle_full(
        cls,
        supabase: Client,
        epoch_id: UUID,
        admin_supabase: Client,
    ) -> dict:
        """Full cycle resolution pipeline: resolve → bots → scoring → notifications.

        Extracts the multi-step resolve pipeline so it can be called from both
        the manual resolve endpoint and the auto-resolve trigger (all humans ready).
        Returns updated epoch data.
        """
        from backend.services.bot_service import BotService
        from backend.services.cycle_notification_service import CycleNotificationService
        from backend.services.scoring_service import ScoringService

        data = await cls.resolve_cycle(supabase, epoch_id, admin_supabase=admin_supabase)
        config = data.get("config", {})
        cycle_number = data.get("current_cycle", 1)

        # Execute bot decisions (after RP grant, before next cycle)
        try:
            await BotService.execute_bot_cycle(
                supabase=supabase,
                admin_supabase=admin_supabase,
                epoch_id=str(epoch_id),
                cycle_number=cycle_number,
                config=config,
            )
        except Exception:
            logger.warning("Bot cycle execution failed for epoch %s", epoch_id, exc_info=True)

        # Compute scores after missions resolve (best-effort)
        try:
            await ScoringService.compute_cycle_scores(supabase, epoch_id, cycle_number)
        except Exception:
            logger.warning(
                "Scoring failed for epoch %s cycle %s", epoch_id, cycle_number, exc_info=True
            )

        # Send cycle notification emails (best-effort, non-blocking)
        try:
            await CycleNotificationService.send_cycle_notifications(
                admin_supabase,
                str(epoch_id),
                cycle_number,
            )
        except Exception:
            logger.warning("Cycle notification failed for epoch %s", epoch_id, exc_info=True)

        return data

    @classmethod
    async def resolve_cycle(
        cls,
        supabase: Client,
        epoch_id: UUID,
        admin_supabase: Client | None = None,
    ) -> dict:
        """Resolve a cycle: allocate RP, increment cycle counter.

        Mission resolution and scoring are handled by OperativeService
        and ScoringService respectively.
        """
        epoch = await cls.get(supabase, epoch_id)
        if epoch["status"] not in ("foundation", "competition", "reckoning"):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot resolve cycle for epoch with status '{epoch['status']}'.",
            )

        config = {**DEFAULT_CONFIG, **epoch.get("config", {})}
        new_cycle = epoch["current_cycle"] + 1

        # Grant RP to all participants
        rp_amount = config["rp_per_cycle"]
        if epoch["status"] == "foundation":
            rp_amount = int(rp_amount * 1.5)  # Foundation bonus

        await cls._grant_rp_batch(supabase, epoch_id, rp_amount, config["rp_cap"])

        # Reset all cycle_ready flags before advancing
        supabase.table("epoch_participants").update(
            {"cycle_ready": False}
        ).eq("epoch_id", str(epoch_id)).execute()

        # Advance mission timers by one cycle interval so operatives resolve
        # in sync with admin-triggered cycle resolution (not wall-clock time).
        # Subtract cycle_hours from resolves_at for all non-guardian missions.
        cycle_hours = config.get("cycle_hours", 8)
        db = admin_supabase or supabase
        active_missions = (
            db.table("operative_missions")
            .select("id, resolves_at, operative_type")
            .eq("epoch_id", str(epoch_id))
            .in_("status", ["deploying", "active"])
            .neq("operative_type", "guardian")
            .execute()
        )
        # Batch: group by resolves_at, compute new value, update per-group
        from collections import defaultdict
        by_new_resolve: defaultdict[str, list[str]] = defaultdict(list)
        for m in active_missions.data or []:
            old_resolves = datetime.fromisoformat(m["resolves_at"])
            new_resolves = old_resolves - timedelta(hours=cycle_hours)
            by_new_resolve[new_resolves.isoformat()].append(m["id"])
        for new_ts, ids in by_new_resolve.items():
            db.table("operative_missions").update(
                {"resolves_at": new_ts}
            ).in_("id", ids).execute()

        # Increment cycle
        resp = (
            supabase.table("game_epochs")
            .update({"current_cycle": new_cycle})
            .eq("id", str(epoch_id))
            .execute()
        )

        if not resp.data:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to resolve cycle.")
        return resp.data[0]
