# PROMPT: ระบบเช็คชื่อสโมสรนักศึกษาปี 69
### วิทยาลัยเทคโนโลยีทางการแพทย์และสาธารณสุข กาญจนาภิเษก

> **สำหรับ AI Agent ที่รับ Prompt นี้ไปทำงาน (Codex / Claude Code / Antigravity ฯลฯ):**
> ให้สร้างโปรเจกต์นี้ทั้งหมดตามเฟสด้านล่าง แล้ว **สร้าง GitHub repository ใหม่ (public), push โค้ดทั้งหมดขึ้นไป และเปิดใช้งาน GitHub Pages** เพื่อให้เจ้าของโปรเจกต์เปิดดูหน้าตาเว็บได้ทันทีจากลิงก์ Pages หลังจบแต่ละเฟส (ไม่ใช่รอจบทั้งหมดค่อยส่ง)

---

## 1. ภาพรวมระบบ (Overview)

เว็บแอปเช็คชื่อสมาชิกสโมสรนักศึกษา เชื่อมต่อ **Google Sheets** เป็นฐานข้อมูลผ่าน **Google Apps Script (Code.gs)**, ใช้งานแบบเรียลไทม์ มีหน้า public leaderboard, ระบบ Login สำหรับผู้เช็คชื่อ/แอดมิน, แยกข้อมูลตามสาขาวิชาได้

### Roles & สิทธิ์

| Role | ต้องล็อกอิน? | สิทธิ์ |
|---|---|---|
| **Guest** (บุคคลทั่วไป) | ไม่ต้อง | ดูหน้าแรก (public dashboard) แบบ read-only เรียลไทม์: ใครเช็คชื่อแล้ว / ใครยังไม่มา / ใครมาสาย / ใครขาด, และ Leaderboard สรุปทั้งเทอม |
| **ผู้เช็คชื่อ / แอดมิน** (Checker/Admin) | ต้องล็อกอิน (ID + PIN) | ทำได้ทุกอย่างในหน้าเช็คชื่อ: สร้างหัวข้อ/องค์ประชุม, เช็คสถานะรายบุคคล, บันทึก/ส่งข้อมูล, ดูแดชบอร์ดเต็มรูปแบบทุกสาขา |

---

## 2. Tech Stack

| ส่วน | เทคโนโลยี | หมายเหตุ |
|---|---|---|
| Frontend | HTML/CSS/JS static site (React+Vite ก็ได้ ถ้า build ออกมาเป็น static แล้ว deploy GitHub Pages ได้จริง) | ต้อง deploy ผ่าน GitHub Pages ได้ |
| Backend/API | Google Apps Script deploy เป็น Web App | ไฟล์หลักชื่อ `Code.gs` ต้องมีฟังก์ชัน `setSheet()` |
| Database | Google Sheets (หลาย tab ตามสคีมาข้อ 3) | เป็น source of truth ของทั้งระบบ |
| Auth | ID + PIN เทียบกับ sheet `Admins`, เก็บ session ที่ `localStorage` ฝั่ง client | ไม่ต้อง OAuth เต็มรูปแบบ |
| Hosting | GitHub Pages | repo ใหม่, เปิด Pages ให้ใช้งานได้จริง |
| Sync | Poll ข้อมูลทุก 5–10 วินาที (Apps Script ไม่รองรับ WebSocket) | ทุกการกดสถานะยิงบันทึกทันที ไม่ต้องรอกดส่ง |

---

## 3. โครงสร้างข้อมูลใน Google Sheets (Data Model)

### Sheet: `Branches` (สาขาวิชา — *รายชื่อจริงจะส่งให้ภายหลัง ให้ mock ไว้ก่อน 2–3 สาขา*)
| Column | ตัวอย่าง |
|---|---|
| branch_id | RT01 |
| branch_name | รังสีเทคนิค |
| color_hex | #2563EB |

### Sheet: `Students` (*รายชื่อจริงจะส่งให้ภายหลัง — ห้าม hardcode*)
| Column | ตัวอย่าง |
|---|---|
| student_id | 6712345 |
| full_name | สมชาย ใจดี |
| branch_id | RT01 |

### Sheet: `Sessions` (หัวข้อ/องค์ประชุมการเช็คชื่อ)
| Column | ตัวอย่าง |
|---|---|
| session_id | auto (timestamp-based) |
| session_title | องค์ประชุมที่ 1 |
| session_date | 2026-09-20 |
| branch_scope | RT01 หรือ ALL |
| status | draft / submitted |
| created_by | admin_id |
| created_at | timestamp |

### Sheet: `Attendance` (บันทึกรายบุคคลต่อ session)
| Column | ตัวอย่าง |
|---|---|
| session_id | อ้างอิง Sessions |
| student_id | อ้างอิง Students |
| status | มา / สาย / ลา / ขาด |
| checked_by | admin_id |
| timestamp | อัปเดตล่าสุด |

### Sheet: `Admins`
| Column | ตัวอย่าง |
|---|---|
| admin_id | admin01 |
| pin | รหัสเข้าใช้งาน |
| role | admin / checker |

### Sheet: `Dashboard_Summary` (แดชบอร์ดรายบุคคล — ตามที่ขอให้อยู่ในชีตด้วย)
1 แถวต่อ 1 คน: จำนวน **มา / สาย / ลา / ขาด** รวมทั้งหมด — อัปเดตด้วย Apps Script ทุกครั้งที่มีการ **submit** session ใหม่ (ไม่พึ่งสูตรในชีตอย่างเดียว เพื่อความชัวร์)

---

## 4. สถานะการเช็คชื่อ & สี

| สถานะ | English | สีแนะนำ |
|---|---|---|
| มา (เข้าร่วม) | Present | เขียว `#16A34A` |
| สาย | Late | เหลือง `#EAB308` |
| ลา | Excused | ฟ้า `#3B82F6` |
| ขาด | Absent | แดง `#DC2626` |
| ยังไม่เช็ค | Pending | เทา `#9CA3AF` |

---

## 5. ฟังก์ชันที่ต้องมีใน `Code.gs`

| ฟังก์ชัน | หน้าที่ |
|---|---|
| `setSheet(sheetName)` | เลือก/สร้าง sheet ตามชื่อ (**บังคับต้องมี**) |
| `doGet(e)` | routing ดึงข้อมูล ผ่าน parameter: `?action=getSessions / getStudents / getLeaderboard / getDashboard` |
| `doPost(e)` | routing บันทึกข้อมูล: `action=createSession / saveAttendance / submitAttendance / login` |
| `createSession(title, date, branchScope, adminId)` | สร้างหัวข้อ/องค์ประชุมใหม่ |
| `saveAttendanceDraft(sessionId, records[])` | บันทึกสถานะทีละคน/หลายคน แบบเรียลไทม์ ไม่ต้องรอกดส่ง |
| `submitAttendance(sessionId)` | ปิดรอบ → status = submitted → เรียก `updateDashboardSummary()` |
| `getLeaderboard()` | คืนอันดับมาเยอะสุด/ขาดเยอะสุด (public, ไม่ต้อง login) |
| `getDashboard(filterBranch)` | ข้อมูลเต็มสำหรับแอดมิน (filter ตามสาขาได้) |
| `loginCheck(adminId, pin)` | ตรวจสิทธิ์เข้าใช้งาน คืน role |
| `updateDashboardSummary()` | คำนวณสรุปรายคนใหม่ทั้งหมด |

---

## 6. หน้าเว็บ (Pages/Tabs)

| หน้า | เข้าถึงโดย | เนื้อหา |
|---|---|---|
| **หน้าแรก** (Public Stats/Leaderboard) | ทุกคน | เรียลไทม์: ใครเช็คแล้ว/ยังไม่มา/สาย/ขาด ของ session ปัจจุบัน + Leaderboard สรุปทั้งเทอม (มาเยอะสุด/ขาดเยอะสุด) |
| **หน้าล็อกอิน** | ผู้เช็คชื่อ/แอดมิน | กรอก ID + PIN |
| **หน้าเช็คชื่อ** | หลังล็อกอิน | (1) ตั้งหัวข้อ+วันที่ก่อนเริ่ม (2) เลือกสาขาที่จะเช็ค — สีแยกตามสาขาชัดเจน (3) list รายชื่อ กดสถานะรายคน (4) ปุ่ม **"บันทึก"** (save draft ระหว่างเช็คไปเรื่อยๆ) กับปุ่ม **"ส่ง"** (submit เมื่อครบทุกคนแล้ว) |
| **แดชบอร์ดแอดมิน** | แอดมิน | สถิติทุกคน/ทุกสาขา/ทุก session ย้อนหลัง, filter ตามสาขา/ช่วงวันที่ |

---

## 7. Design/UI

- หัวเรื่องหลัก: **"ระบบเช็คชื่อสโมสรนักศึกษาปี 69 วิทยาลัยเทคโนโลยีทางการแพทย์และสาธารณสุข กาญจนาภิเษก"**
- สไตล์: ทันสมัย เป็นทางการ (modern, formal), font อ่านง่าย, การ์ด/ตารางเรียบ, responsive ทั้งมือถือและคอม
- สีสาขาแสดงเป็น badge/แถบข้างชื่อ ให้แยกสาขาได้ด้วยตาทันที

---

## 8. เฟสการพัฒนา (Phase Breakdown)

### Phase 0 — Setup & Repo
- สร้าง GitHub repo ใหม่ (public), โครงสร้าง `frontend/` + `apps-script/`
- สร้าง Google Sheet + Apps Script project พร้อม `setSheet()` และสร้าง sheet ทั้งหมดตามข้อ 3 (ใส่ mock data)
- เปิด GitHub Pages ให้ใช้งานได้ตั้งแต่ต้น (แม้ยังเป็นหน้า placeholder)

### Phase 1 — Backend (Apps Script)
- เขียน `Code.gs` ครบตามฟังก์ชันข้อ 5
- Deploy เป็น Web App (execute as me, access: anyone), เก็บ URL ไว้ใช้ฝั่ง frontend
- ทดสอบด้วย mock data (2–3 สาขา, ~10 คน)

### Phase 2 — หน้า Public (Leaderboard/Stats)
- fetch ข้อมูลจาก Apps Script URL, แสดงผลเรียลไทม์ (poll 5–10 วิ), ไม่ต้อง login

### Phase 3 — Login System
- หน้า login, ตรวจกับ `Admins`, เก็บ session ใน localStorage, แยกสิทธิ์ admin/checker

### Phase 4 — หน้าเช็คชื่อ
- ตั้งหัวข้อ+วันที่+เลือกสาขาก่อนเริ่ม
- list รายชื่อพร้อมปุ่มสถานะ 4 แบบ, ปุ่มบันทึก (draft เรียลไทม์) และปุ่มส่ง (submit)

### Phase 5 — แดชบอร์ดแอดมิน (ในเว็บ)
- ตารางสรุปรายคน, filter สาขา/ช่วงเวลา, ดูย้อนหลังทุก session

### Phase 6 — Dashboard ในชีต
- `Dashboard_Summary` อัปเดตอัตโนมัติทุกครั้งที่ submit

### Phase 7 — Polish UI/Design
- ปรับดีไซน์ตามข้อ 7, สีสาขา, responsive, header ตามชื่อที่กำหนด

### Phase 8 — Deploy & Handoff
- push ทุกอย่างขึ้น GitHub, เปิด Pages, ทดสอบ end-to-end
- เขียน README: วิธีตั้งค่า Apps Script URL ในฝั่ง frontend, วิธี deploy ใหม่, วิธีเพิ่มรายชื่อ/สาขาจริงทีหลัง

---

## 9. หมายเหตุสำคัญสำหรับ AI ผู้พัฒนา

- รายชื่อนักศึกษาและสาขาจริง **จะส่งมาให้ภายหลัง** — ออกแบบให้ import/แก้ไขข้อมูลใน Sheet ได้ง่าย ห้าม hardcode ชื่อคน/สาขาลงโค้ด
- ทำทีละเฟส ให้เปิดดูหน้าตาเว็บผ่าน GitHub Pages ได้หลังจบแต่ละเฟส
- ถ้าเจอปัญหา CORS จาก Apps Script ให้ใช้ JSONP หรือ deploy Web App แบบ access "Anyone"
- **ห้ามลืม:** สร้าง GitHub repo ใหม่ + push + เปิด GitHub Pages ทุกครั้งที่ส่งงานแต่ละเฟส
