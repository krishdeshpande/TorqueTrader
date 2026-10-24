"""
TorqueTrader — Unit & Integration Tests for AI Automotive Advisor Engine & Chatbot.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_advisor_analyze_comprehensive_payload():
    """Verify diagnostic payload returns complete 5-part dossier with sweet-spot variant."""
    payload = {
        "category": "Car / SUV",
        "budget": "₹12L - ₹20L",
        "condition": "New or Used",
        "city": "Mumbai",
        "usage": "Daily Bumper-to-Bumper City Traffic",
        "transmission": "Dual-Clutch / DSG / DCT (Lightning Fast)",
        "priorities": [
            "5-Star Crash Safety & Heavy-Duty Build",
            "Pure Performance & High-Speed Dynamics"
        ],
        "features": [
            "Ventilated Front Seats (Summer comfort)",
            "Wireless Android Auto / Apple CarPlay"
        ],
        "maintenance_mindset": "Enthusiast Care",
        "contenders": "Slavia 1.5 vs Virtus GT vs Creta Turbo",
        "notes": "Concerned about DSG overheating in Western Express Highway crawl"
    }

    resp = client.post("/advisor/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "analysis_markdown" in data
    assert "summary_title" in data
    assert "Sweet-Spot Variant" in data["analysis_markdown"] or "Sweet-Spot" in data["analysis_markdown"]
    assert "Real-World" in data["analysis_markdown"]
    assert "Sleeper" in data["analysis_markdown"]


def test_advisor_analyze_budget_category_under_1_5L():
    """Verify lower budget tiers (Under ₹1.5L) recommend entry bikes/cars accurately."""
    payload = {
        "category": "Motorcycle / Superbike",
        "budget": "Under ₹1.5L",
        "condition": "New or Used",
        "city": "Pune",
        "usage": "Daily Bumper-to-Bumper City Traffic",
        "transmission": "Manual",
        "priorities": ["Real-World Mileage in City Traffic", "Bulletproof Reliability & Inexpensive Spares"],
        "features": ["None / Purely Mechanical Simplicity"],
        "maintenance_mindset": "Zero Drama"
    }

    resp = client.post("/advisor/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "Raider" in data["analysis_markdown"] or "Splendor" in data["analysis_markdown"] or "Pulsar" in data["analysis_markdown"]


def test_advisor_chat_automotive_followup():
    """Verify interactive multi-turn chat returns automotive advice."""
    payload = {
        "messages": [
            {"role": "user", "content": "What is the expected maintenance cost of the 1.5 TSI DSG after 50,000 km?"}
        ],
        "diagnostic_context": {
            "budget": "₹12L - ₹20L",
            "city": "Mumbai",
            "transmission": "Dual-Clutch / DSG"
        }
    }

    resp = client.post("/advisor/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "assistant"
    assert len(data["content"]) > 20
    assert "TSI" in data["content"] or "maintenance" in data["content"].lower() or "service" in data["content"].lower()


def test_advisor_chat_guardrails_deflection():
    """Verify non-automotive queries are intercepted by strict domain guardrails."""
    payload = {
        "messages": [
            {"role": "user", "content": "Write me a Python program to sort a binary search tree"}
        ],
        "diagnostic_context": {
            "budget": "₹12L - ₹20L"
        }
    }

    resp = client.post("/advisor/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "assistant"
    assert "strictly calibrated for Indian car and motorcycle buying decisions" in data["content"]
