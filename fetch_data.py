"""ดึงระดับน้ำและฝน 24 ชม. ล่าสุดจาก ThaiWater แล้วเขียน data/data.json

เฉพาะ กทม. และปริมณฑล: 10 กรุงเทพฯ, 11 สมุทรปราการ, 12 นนทบุรี,
13 ปทุมธานี, 73 นครปฐม, 74 สมุทรสาคร
"""
import json
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/"
PROVINCES = {"10", "11", "12", "13", "73", "74"}


def get(endpoint):
    with urllib.request.urlopen(API + endpoint, timeout=90) as r:
        return json.load(r)


rain, wl = [], []
for x in get("rain_24h")["data"]:
    g, s = x["geocode"], x["station"]
    if g.get("province_code") not in PROVINCES:
        continue
    rain.append(dict(p=g["province_name"]["th"], a=g["amphoe_name"]["th"],
                     n=s["tele_station_name"]["th"], r24=x.get("rain_24h"),
                     r1=x.get("rain_1h"), t=x["rainfall_datetime"],
                     lat=s["tele_station_lat"], lon=s["tele_station_long"]))

for x in get("waterlevel_load")["waterlevel_data"]["data"]:
    g, s = x["geocode"], x["station"]
    if g.get("province_code") not in PROVINCES or not x.get("waterlevel_msl"):
        continue
    prev = x.get("waterlevel_msl_previous")
    wl.append(dict(p=g["province_name"]["th"], a=g["amphoe_name"]["th"],
                   n=s["tele_station_name"]["th"], code=s.get("tele_station_oldcode"),
                   wl=float(x["waterlevel_msl"]), prev=float(prev) if prev else None,
                   bank=s.get("min_bank"), pct=float(x["storage_percent"]),
                   lv=x["situation_level"], t=x["waterlevel_datetime"],
                   lat=s["tele_station_lat"], lon=s["tele_station_long"]))

fetched = datetime.now(timezone(timedelta(hours=7))).strftime("%Y-%m-%d %H:%M")
rain.sort(key=lambda x: -(x["r24"] or 0))
wl.sort(key=lambda x: -x["pct"])
out = Path(__file__).parent / "data" / "data.json"
out.write_text(json.dumps(dict(fetched=fetched, rain=rain, wl=wl), ensure_ascii=False,
                          separators=(",", ":")), encoding="utf-8")
print(f"rain stations: {len(rain)}, water level stations: {len(wl)}")
