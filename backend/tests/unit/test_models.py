from datetime import datetime
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

from backend.models.common import CurrentUser, PaginatedResponse, PaginationMeta
from backend.models.simulation import SimulationCreate


class TestCurrentUser:
    def test_valid_current_user(self):
        user = CurrentUser(
            id=uuid4(),
            email="test@velgarien.dev",
            access_token="token-abc-123",
        )
        assert isinstance(user.id, UUID)
        assert user.email == "test@velgarien.dev"
        assert user.access_token == "token-abc-123"

    def test_invalid_uuid_raises(self):
        with pytest.raises(ValidationError):
            CurrentUser(
                id="not-a-uuid",
                email="test@velgarien.dev",
                access_token="token",
            )

    def test_missing_email_raises(self):
        with pytest.raises(ValidationError):
            CurrentUser(
                id=uuid4(),
                access_token="token",
            )


class TestSimulationCreate:
    def test_valid_simulation_create(self):
        sim = SimulationCreate(
            name="Test Simulation",
            slug="test-simulation",
            description="A test world",
            theme="dystopian",
            content_locale="de",
            additional_locales=["en"],
        )
        assert sim.name == "Test Simulation"
        assert sim.slug == "test-simulation"
        assert sim.theme == "dystopian"
        assert sim.content_locale == "de"
        assert sim.additional_locales == ["en"]

    def test_defaults(self):
        sim = SimulationCreate(name="Minimal")
        assert sim.slug is None
        assert sim.description is None
        assert sim.theme == "custom"
        assert sim.content_locale == "en"
        assert sim.additional_locales == []

    def test_empty_name_raises(self):
        with pytest.raises(ValidationError):
            SimulationCreate(name="")

    def test_invalid_slug_raises(self):
        with pytest.raises(ValidationError):
            SimulationCreate(name="Test", slug="INVALID SLUG!")

    def test_slug_pattern_valid(self):
        sim = SimulationCreate(name="Test", slug="my-sim-123")
        assert sim.slug == "my-sim-123"


class TestPaginatedResponse:
    def test_paginated_response(self):
        response = PaginatedResponse[dict](
            data=[{"id": "1"}, {"id": "2"}],
            meta=PaginationMeta(count=2, total=10, limit=25, offset=0),
        )
        assert response.success is True
        assert len(response.data) == 2
        assert response.meta.count == 2
        assert response.meta.total == 10
        assert response.meta.limit == 25
        assert response.meta.offset == 0
        assert isinstance(response.timestamp, datetime)
        assert response.timestamp.tzinfo is not None

    def test_paginated_response_empty(self):
        response = PaginatedResponse[str](
            data=[],
            meta=PaginationMeta(count=0, total=0, limit=25, offset=0),
        )
        assert response.success is True
        assert response.data == []
        assert response.meta.count == 0
