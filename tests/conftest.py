import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities as activities_dict


INITIAL_ACTIVITIES = copy.deepcopy(activities_dict)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities before each test to avoid cross-test state."""
    activities_dict.clear()
    activities_dict.update(copy.deepcopy(INITIAL_ACTIVITIES))
    yield
    activities_dict.clear()
    activities_dict.update(copy.deepcopy(INITIAL_ACTIVITIES))
