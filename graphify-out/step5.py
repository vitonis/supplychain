import sys, json
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from pathlib import Path

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
analysis   = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis['communities'].items()}
cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}

LABELS_DICT = {
    0: "KYC Storage",
    1: "Dashboard & Tracking",
    2: "Notification Storage",
    3: "Supply Chain Actions",
    4: "Global Error Boundary",
    5: "Pinata Integration",
    6: "Active Shipments Admin",
    7: "Admin Stats",
    8: "Pending KYC Admin",
    9: "Dashboard Quick Actions",
    10: "Dashboard Stats Card",
    11: "Custom Connect Button",
    12: "Header",
    13: "Layout",
    14: "Sidebar",
    15: "App Root",
    16: "Deploy Scripts",
    17: "Next Config",
    18: "Postcss Config",
    19: "Tailwind Config",
    20: "Wagmi Config",
    21: "Contract ABI",
    22: "User Storage",
    23: "Hardhat Config"
}

labels = LABELS_DICT

questions = suggest_questions(G, communities, labels)
input_path = str(Path('.').absolute())
report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, input_path, suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}))
print('Report updated with community labels')
