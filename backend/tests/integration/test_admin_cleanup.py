"""Integration tests for admin data cleanup endpoints.

Tests auth guards and response shapes against the real FastAPI app.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.tests.integration.conftest import requires_supabase

pytestmark = requires_supabase


@pytest.fixture()
def client():
    return TestClient(app)


class TestCleanupAuthGuard:
    """All cleanup endpoints require platform admin."""

    def test_stats_requires_auth(self, client: TestClient):
        r = client.get("/api/v1/admin/cleanup/stats")
        assert r.status_code in (401, 403, 422)

    def test_preview_requires_auth(self, client: TestClient):
        r = client.post(
            "/api/v1/admin/cleanup/preview",
            json={"cleanup_type": "audit_log", "min_age_days": 30},
        )
        assert r.status_code in (401, 403, 422)

    def test_execute_requires_auth(self, client: TestClient):
        r = client.post(
            "/api/v1/admin/cleanup/execute",
            json={"cleanup_type": "audit_log", "min_age_days": 30},
        )
        assert r.status_code in (401, 403, 422)


class TestCleanupValidation:
    """Request validation for cleanup endpoints."""

    def test_preview_invalid_type(self, client: TestClient):
        r = client.post(
            "/api/v1/admin/cleanup/preview",
            json={"cleanup_type": "invalid_type", "min_age_days": 30},
        )
        assert r.status_code == 422

    def test_preview_negative_days(self, client: TestClient):
        r = client.post(
            "/api/v1/admin/cleanup/preview",
            json={"cleanup_type": "audit_log", "min_age_days": -1},
        )
        assert r.status_code == 422

    def test_preview_zero_days(self, client: TestClient):
        r = client.post(
            "/api/v1/admin/cleanup/preview",
            json={"cleanup_type": "audit_log", "min_age_days": 0},
        )
        assert r.status_code == 422

    def test_preview_exceeds_max_days(self, client: TestClient):
        r = client.post(
            "/api/v1/admin/cleanup/preview",
            json={"cleanup_type": "audit_log", "min_age_days": 9999},
        )
        assert r.status_code == 422

    def test_execute_invalid_type(self, client: TestClient):
        r = client.post(
            "/api/v1/admin/cleanup/execute",
            json={"cleanup_type": "nonexistent", "min_age_days": 30},
        )
        assert r.status_code == 422
