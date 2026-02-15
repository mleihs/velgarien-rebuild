from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.dependencies import get_current_user
from backend.models.common import CurrentUser

MOCK_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
MOCK_USER_EMAIL = "test@velgarien.dev"


@pytest.fixture()
def test_app():
    """FastAPI TestClient instance."""
    return TestClient(app)


@pytest.fixture()
def mock_user_token() -> str:
    """A fake JWT token string for testing."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature"


@pytest.fixture()
def mock_current_user():
    """Patch get_current_user to return a mock user without JWT validation."""
    user = CurrentUser(
        id=MOCK_USER_ID,
        email=MOCK_USER_EMAIL,
        access_token="mock-access-token",
    )

    app.dependency_overrides[get_current_user] = lambda: user
    yield user
    app.dependency_overrides.pop(get_current_user, None)
