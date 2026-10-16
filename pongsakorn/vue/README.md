# ระบบแจ้งเตือนภัยน้ำท่วม (Flood Alert)

เว็บแอปแสดงสถานะความเสี่ยงน้ำท่วมและปริมาณฝนรายพื้นที่ในไทย ดึงข้อมูลจาก Open-Meteo (ฟรี ไม่ต้องใช้ API key)

## Stack

- **frontend/** — Vue 3 + TypeScript + Vite + Pinia + Vue Router
- **backend/** — NestJS + TypeScript

## วิธีรัน

### Backend (port 3000)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Vite proxy `/api` ไปที่ `http://localhost:3000` ให้แล้ว เปิดเบราว์เซอร์ที่ http://localhost:5173

## API

| Method | Endpoint | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/health` | ตรวจสอบสถานะเซิร์ฟเวอร์ |
| GET | `/api/flood/status` | สถานะ/ระดับความเสี่ยงน้ำท่วมตามพิกัด |
| GET | `/api/rainfall` | ข้อมูลปริมาณฝนย้อนหลังและพยากรณ์ |
| GET | `/api/locations/presets` | รายการพื้นที่ที่ตั้งไว้ล่วงหน้า |
| GET | `/api/locations/search` | ค้นหาพื้นที่จากชื่อ |
| GET | `/api/locations/reverse` | แปลงพิกัดกลับเป็นชื่อพื้นที่ |

## หน้าจอ

- **Dashboard** — ภาพรวมความเสี่ยง กราฟปริมาณฝน และปัจจัยที่ใช้ประเมิน
- **Alert** — หน้าแจ้งเตือนเมื่อความเสี่ยงอยู่ในระดับสูง
