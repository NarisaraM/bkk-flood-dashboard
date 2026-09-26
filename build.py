"""ประกอบ index.html จาก src/ และ data/"""
from pathlib import Path

root = Path(__file__).parent
read = lambda p: (root / p).read_text(encoding="utf-8")

html = read("src/template.html")
for key, path in [
    ("__LEAFLETCSS__", "src/leaflet.css"),
    ("__MAPJS__", "src/mapjs.js"),
    ("__DATA__", "data/data.json"),
    ("__DIST__", "data/dist_small.json"),
]:
    html = html.replace(key, read(path))

(root / "index.html").write_text(html, encoding="utf-8")
print(f"index.html: {len(html):,} chars")
