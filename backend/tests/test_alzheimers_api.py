import json


def test_alzheimers_cognitive_only(client):
    payload = {
        "orientation": 6,
        "memory": 5,
        "attention": 6,
        "language": 3,
        "executive": 5,
        "visuospatial": 5,
    }

    response = client.post(
        "/predict/alzheimers",
        data={"cognitive_scores": json.dumps(payload)},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["fmri"] is None
    assert body["data"]["cognitive"]["total_score"] == 30
    assert body["data"]["weights"]["cognitive"] == 1.0
