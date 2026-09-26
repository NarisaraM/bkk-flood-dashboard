# เฝ้าระวังน้ำท่วม กทม.–ปริมณฑล

Dashboard สถานการณ์น้ำท่วมกรุงเทพฯ และ 5 จังหวัดปริมณฑล: แผนที่เขต/อำเภอพร้อม popup,
ระดับน้ำคลองเทียบตลิ่ง, ฝนสะสม 24 ชม. และถนนที่ควรเลี่ยง

เปิด `index.html` ในเบราว์เซอร์ได้เลย (ไฟล์เดียว ไม่ต้องมีเซิร์ฟเวอร์)

## อัปเดตข้อมูล

```bash
python fetch_data.py   # ดึงระดับน้ำ + ฝนล่าสุดจาก ThaiWater -> data/data.json
python build.py        # ประกอบ index.html ใหม่
```

ข้อความสรุปรายพื้นที่ จุดถนนน้ำท่วม และเวลาที่แสดงบนหัวหน้า อยู่ใน `src/template.html`
(`ZONES`, `ROADS_A`, `ROADS_B`) ต้องแก้เองตามข่าวล่าสุด พิกัดจุดถนนอยู่ใน `src/mapjs.js`

## โครงสร้าง

| ไฟล์ | หน้าที่ |
|---|---|
| `src/template.html` | หน้าเว็บ, CSS, ข้อมูลพื้นที่และถนน |
| `src/mapjs.js` | แผนที่ Leaflet และ popup |
| `src/leaflet.css` | CSS ของ Leaflet 1.9.4 (ฝังในหน้า) |
| `data/data.json` | ระดับน้ำและฝนจาก ThaiWater |
| `data/dist_small.json` | ขอบเขตเขต/อำเภอ (ย่อจาก OpenGISData-Thailand) |

## ที่มาข้อมูล

- ระดับน้ำ/ฝน: [ThaiWater](https://www.thaiwater.net/) (สสน.)
- ขอบเขตปกครอง: [OpenGISData-Thailand](https://github.com/chingchai/OpenGISData-Thailand)
- จุดน้ำท่วม/ประกาศ: ศูนย์ป้องกันน้ำท่วม กทม., Nation Thailand, กรุงเทพธุรกิจ, Thai PBS

ระดับสถานการณ์รายพื้นที่เป็นการประเมินจากข้อมูลข้างต้น ไม่ใช่ประกาศทางราชการ
