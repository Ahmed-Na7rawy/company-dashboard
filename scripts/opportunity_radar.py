import os
import json

# Simulated external buying signals scraped from Career boards and PR feeds
alerts = [
    {
        "id": 1,
        "company": "Almarai",
        "source": "Career Board",
        "date": "2026-06-12",
        "title": "Hiring 'Senior Dairy Stabilizer technologist' in Giza",
        "desc": "Almarai is expanding their Giza dairy plant. Hiring a stabilizer specialist suggests upcoming procurement of Carrageenan and Xanthan Gum. Pitch stabilizing solutions immediately.",
        "status": "Active"
    },
    {
        "id": 2,
        "company": "Americana",
        "source": "PR News Feed",
        "date": "2026-06-10",
        "title": "New frozen bakery processing line announcement",
        "desc": "Americana announced a new automated frozen dough line launching in Q4. Emulsifier and starch requirements will spike. Suggest Sodium Tripolyphosphate and Potato Starch.",
        "status": "Active"
    },
    {
        "id": 3,
        "company": "Edita",
        "source": "Career Board",
        "date": "2026-06-08",
        "title": "Hiring 'Gelation R&D Supervisor'",
        "desc": "Edita Cake department is recruiting specialists in gelation agents. High-probability opportunity to cross-sell Carrageenan and Guar Gum lines.",
        "status": "Active"
    }
]

# Write to React source folder
data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

json_path = os.path.join(data_dir, "opportunity_alerts.json")

try:
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(alerts, f, indent=2, ensure_ascii=False)
    print(f"[Opportunity Radar] External signals written successfully at: {json_path}")
except Exception as e:
    print(f"Failed to generate Opportunity Radar alerts: {e}")
