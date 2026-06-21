from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "teststudent@example.com"

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # Remove
    resp = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert resp.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]


def test_signup_nonexistent_activity_404():
    resp = client.post("/activities/Nonexistent/signup", params={"email": "a@b.com"})
    assert resp.status_code == 404


def test_duplicate_signup_400():
    activity = "Chess Club"
    existing = "michael@mergington.edu"
    resp = client.post(f"/activities/{activity}/signup", params={"email": existing})
    assert resp.status_code == 400
