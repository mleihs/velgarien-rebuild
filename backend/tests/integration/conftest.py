"""Shared fixtures for integration tests that need a live Supabase instance."""

import pytest

from backend.config import settings


def _supabase_available() -> bool:
    """Check if Supabase credentials are configured (non-empty anon key)."""
    return bool(settings.supabase_anon_key)


requires_supabase = pytest.mark.skipif(
    not _supabase_available(),
    reason="Supabase not available (SUPABASE_ANON_KEY not set)",
)
