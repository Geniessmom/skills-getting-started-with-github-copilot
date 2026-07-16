from fastapi.testclient import TestClient

from src import app as app_module

client = TestClient(app_module.app)


def test_duplicate_signup_is_rejected():
    original_participants = app_module.activities["Chess Club"]["participants"].copy()
    app_module.activities["Chess Club"]["participants"] = ["michael@mergington.edu"]

    try:
        response = client.post(
            "/activities/Chess Club/signup?email=michael@mergington.edu"
        )
    finally:
        app_module.activities["Chess Club"]["participants"] = original_participants

    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"


def test_full_activity_rejects_new_signups():
    original_participants = app_module.activities["Chess Club"]["participants"].copy()
    original_max = app_module.activities["Chess Club"]["max_participants"]
    app_module.activities["Chess Club"]["participants"] = [
        f"student{i}@mergington.edu" for i in range(original_max)
    ]
    app_module.activities["Chess Club"]["max_participants"] = original_max

    try:
        response = client.post(
            "/activities/Chess Club/signup?email=another@mergington.edu"
        )
    finally:
        app_module.activities["Chess Club"]["participants"] = original_participants
        app_module.activities["Chess Club"]["max_participants"] = original_max

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"


def test_participant_can_be_removed_from_activity():
    original_participants = app_module.activities["Chess Club"]["participants"].copy()
    app_module.activities["Chess Club"]["participants"] = [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]

    try:
        response = client.delete(
            "/activities/Chess Club/participants/michael@mergington.edu"
        )
        remaining_participants = app_module.activities["Chess Club"]["participants"]
    finally:
        app_module.activities["Chess Club"]["participants"] = original_participants

    assert response.status_code == 200
    assert response.json()["message"] == "Removed michael@mergington.edu from Chess Club"
    assert "michael@mergington.edu" not in remaining_participants
