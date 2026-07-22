# Dujeen Quest - Pre-fix Audit Report

วันที่ตรวจ: 14 กรกฎาคม 2026  
Baseline: React 18.3.1, Vite 6.4.3, Framer Motion 11.18.2, Tailwind CSS 3.4.17  
ขอบเขต: ตรวจโครงสร้างทั้งหมด, ข้อมูล 15 ด่าน/75 Mission, Loading -> Home -> Chapter -> Map -> Game -> Result, Local Storage, responsive 375x812 / 768x1024 / 1440x900 และ baseline production build

> รายงานนี้บันทึกสภาพก่อนแก้ไข โค้ดยังไม่ได้ถูกปรับในขั้นตรวจสอบนี้

| ระดับ | หน้า/ด่าน | รหัสภารกิจ | ไฟล์ | บรรทัดโดยประมาณ | ปัญหาที่พบ | วิธีทดสอบซ้ำ | วิธีแก้ |
|---|---|---|---|---:|---|---|---|
| Critical | หลายด่าน | Tone/Fill/Pinyin หลายข้อ | `src/components/ChoiceMission.jsx` | 18-20 | Component แสดง `question.pinyin` ก่อนตอบ ทำให้ Tone Choice และ Fill Blank เห็นคำตอบเต็ม | เปิดด่าน 1 ข้อ 4 หรือ Tone Choice ใดก็ได้ | แยก `beforeAnswer`/`answer`/`afterAnswer` และ render พินอินเต็มเฉพาะหลังตอบ |
| Critical | ด่าน 9 สวนสัตว์แพนด้า | 9-1 | `src/data/levels.js` | 745 | โจทย์ให้เติม `m _ o` แต่หัวข้อเขียน `māo` และ hint ระบุ `a` | เปิดด่าน 9 Mission 1 | ก่อนตอบแสดง 猫, แมว, `m _ o`; หลังตอบค่อยแสดง `māo` |
| Critical | หน้าเกมทุกด่าน | ทุก Mission | `src/components/GamePage.jsx` | 53-80 | Timer หลังตอบไม่ถูกเก็บหรือ cleanup; ผู้เล่นกดกลับแผนที่ระหว่าง feedback แล้ว callback ยังเปลี่ยนข้อหรือเปิด Result ได้ | ตอบหนึ่งข้อแล้วกดแผนที่ภายใน 1.35 วินาที | เก็บ timer ใน ref, cleanup ตอน unmount/pause/navigation และ lock navigation transition |
| High | หน้าเกมมือถือ | ทุก Mission | `src/App.jsx`, `src/components/GamePage.jsx` | App 52-72 | เปลี่ยน Home/Map/Game แล้วตำแหน่ง scroll เดิมค้าง; พบเข้าเกมที่ `scrollY=500` บน 375px | เลื่อนหน้า Home ลง กดเริ่ม แล้วเข้าด่าน 2 | reset scroll เมื่อเปลี่ยน scene และ focus heading ใหม่ |
| High | ด่าน 12/15 | 12-1, 12-2, 15-4 | `src/components/HanziTraceMission.jsx` | 55-58 | ตรวจเพียงจำนวน pointer-move; วาดเส้นสุ่มจุดเดียวซ้ำ ๆ ก็ผ่าน ไม่มี stroke/coverage/position | ขีดวนจน points ถึงขั้นต่ำแล้วกดตรวจ | แยก Practice/Challenge และตรวจจำนวน stroke, bounding coverage, quadrant coverage ขั้นพื้นฐาน |
| High | Final Boss | 15-1 ถึง 15-5 | `src/components/FinalBossMission.jsx`, `src/components/ChoiceMission.jsx` | 1-5, 25-29 | Boss เป็น ChoiceMission ธรรมดา แถบพลังใช้ค่าคงที่ของคำถาม ไม่มี 3 Phase หรือ HP ลดตามคำตอบ | ปลดล็อกด่าน 15 แล้วตอบ Mission | เพิ่ม state ของ phase/HP ใน GamePage และ renderer เฉพาะ Boss |
| High | ระบบรางวัล | เล่นซ้ำทุกด่าน | `src/utils/gameLogic.js` | 99-100 | ผ่านซ้ำโดยไม่ทำสถิติใหม่ยังได้ 10 XP และ 5 Coins ไม่จำกัด | ผ่านด่านเดิมซ้ำหลายครั้ง | ให้รางวัลหลักเฉพาะดาวที่เพิ่ม; จำกัด repeat reward หรือไม่แจกซ้ำ |
| High | ระบบทดสอบ | ทั้งโปรเจกต์ | `package.json` | 6-10 | ไม่มี validator, unit test หรือ Playwright script จึงกันเฉลยรั่วและ regression ไม่ได้ | รัน `npm run validate-content` หรือ `npm test` | เพิ่ม content validator, Vitest และ Playwright smoke/e2e |
| High | Matching | 1-1 และทุก Matching | `src/components/MatchingMission.jsx` | 111-145 | ฝั่งซ้ายเรียงตามข้อมูลเดิมทุกครั้ง ฝั่งขวาเท่านั้นที่ shuffle; รูปแบบจำตำแหน่งได้เมื่อเล่นซ้ำ | เล่น Matching เดิมสองรอบ | shuffle ซ้าย/ขวาแยกกันด้วย seed ต่อรอบ และคง state ระหว่าง render |
| High | Matching มือถือ | Matching ทุกข้อ | `src/components/MatchingMission.jsx` | 27-53, 98-108 | SVG เส้นเชื่อมคำนวณด้วย gap แนวนอน แม้ layout แคบ; เส้นจำนวนมากบดบังและวัดใหม่ด้วย state ทุก resize | เล่น 5 คู่ที่ 375px | มือถือใช้ animation การ์ดเข้าคู่/ช่อง matched แทนเส้น; desktop ใช้เส้นสั้นจาก port ถึง port |
| High | หน้าเล่น | ทุกด่าน | `src/components/GamePage.jsx` | 92-145 | HUD ระหว่างเล่นซ้ำข้อมูล XP/Coins/Stars ผ่าน `PlayerStatus` ทำให้ mission ถูกดันลง โดยเฉพาะมือถือ | เปิดด่านที่ 375px | ใช้ game HUD เฉพาะหัวใจ ข้อ คะแนน Hint เสียง และ Pause |
| High | หน้าเกม | ทุกด่าน | ไม่มี Component | - | ไม่มี Mission Intro, Pause Overlay, Settings, restart level หรือ animation toggle | เข้าด่าน/กด Escape | เพิ่ม MissionIntro และ PauseOverlay ที่หยุด timer/input/speech |
| Medium | Loading | เปิดเว็บ | `src/components/LoadingScreen.jsx` | 18-36 | progress เป็นค่าสุ่ม ไม่สัมพันธ์ asset และบังคับรอราว 5-6 วินาทีในการทดสอบ 768px | refresh แล้วจับเวลาถึง Home | ใช้ readiness จริง + minimum display สั้น 700-1200ms และข้ามได้เมื่อพร้อม |
| Medium | Home มือถือ | Home | `src/components/HomePage.jsx`, `src/index.css` | CSS ช่วง 2946+ | HUD สูงกิน first viewport; mascot/ฉากเกมไม่เห็นใน 375x812 และหน้าสูง 1347px | เปิด Home ที่ 375x812 | ย่อ status เป็น star chip, ย้ายรายละเอียดหลัง primary CTA, ให้ mascot อยู่ first viewport |
| Medium | Home | มี progress เดิม | `src/components/HomePage.jsx` | 1-100 | ไม่มีปุ่ม “เล่นต่อ”; ยังแสดง “เริ่มการผจญภัย” เหมือนผู้เล่นใหม่ | ผ่านด่าน 1 แล้ว reload | แสดง Continue ไป current level และปุ่มเลือก Chapter แยก |
| Medium | เปลี่ยน Mission | ทุกด่าน | `src/components/GamePage.jsx` | 45, 126-144 | progress label เปลี่ยนเป็นข้อใหม่ก่อนการ์ดข้อเก่าจบ exit; พบ Mission 3/5 แต่เนื้อหายังเป็น Mission 2 | ตอบแล้ว snapshot ช่วง 1.35-2.2 วินาที | เปลี่ยน index พร้อม keyed scene state หรือวาง progress ภายใน AnimatePresence เดียวกัน |
| Medium | เปลี่ยนหน้า Result | Result | `src/App.jsx`, `src/components/ResultPage.jsx` | App 98-153 | มีช่วงพื้นหลังว่างหลัง Game exit ก่อน Result เข้า | จบข้อ 5 แล้วจับ screenshot ทันที | ลด exit gap, ใช้ shared scene shell หรือ overlap transition แบบ sync/popLayout |
| Medium | เสียง | ตอบคำถามหลายครั้ง | `src/utils/speech.js` | 26-43 | สร้าง `AudioContext` ใหม่ทุก beep และไม่ close/reuse อาจเพิ่ม resource/หน่วงมือถือ | ตอบถูก/ผิดหลายครั้งแล้วดู performance | ใช้ AudioContext singleton, resume หลัง gesture และ close ตอน app teardown |
| Medium | Performance | ทั้งเกม | `src/index.css`, production bundle | CSS 92 KB source; JS 387.66 KB | CSS ซ้ำหลาย generation และ bundle ไม่มี route/component splitting | รัน `npm run build` | ตัด selector เก่า, lazy-load Library/Achievement/Victory และ mission หนัก |
| Medium | Hanzi | 12-1, 12-2, 15-4 | `src/components/HanziTraceMission.jsx` | 61-84 | ทุกข้อมี guide จางตลอด แต่ไม่มีป้าย Practice; ปุ่มตัวอย่างไม่หัก Hint และไม่มี Undo | เปิดด่าน 12 | ระบุ mode, Challenge ซ่อน guide หลัง preview, hint เชื่อมระบบกลาง, เพิ่ม Undo |
| Medium | Feedback | ทุกด่าน | `src/components/GamePage.jsx` | 69-78, 169-173 | auto-next ตายตัว 1.35 วินาที ไม่มีปุ่มไปต่อ; ผู้เรียนอ่านคำอธิบายไม่ทัน | ตอบถูกแล้วพยายามอ่านข้อความ | มี CTA ไปต่อและ auto-advance เฉพาะเมื่อผู้เล่นเปิด setting |
| Low | ภาษา UI | หลายหน้า | หลายไฟล์ | หลายจุด | ใช้คำอังกฤษปนโดยไม่จำเป็น เช่น Portal Sync, Gate Power, Constellation Route, Stars | เปิด Loading/Chapter/Map/Result | เปลี่ยนเป็นข้อความเกมไทยกระชับ ยกเว้นชื่อแบรนด์/Badge ที่ตั้งใจ |

## Baseline ที่ผ่าน

- Production build สำเร็จ: Vite แปลง 1,966 modules, JS 387.66 kB (gzip 116.54 kB), CSS 80.93 kB (gzip 17.89 kB)
- หน้าไม่ blank และไม่มี Vite error overlay
- Console ไม่มี error/warning ในเส้นทาง Loading -> Home -> Chapter -> Map -> ด่าน 1 -> Result
- ดาว 3 ดวง, XP, Coins, Knowledge และ Local Storage บันทึกหลังผ่านด่าน 1 ได้
- ด่าน 2 ปลดล็อกหลังด่าน 1 และด่าน 3 ยังคงล็อกถูกต้อง
- Audio Mission ซ่อน transcript/pinyin ก่อนตอบได้ถูกต้อง
- Pinyin Drag มีทั้ง drag handler และ tap interaction ในโค้ดเดิม แต่ tap บน browser automation ยังต้องทดสอบซ้ำหลังแก้ scroll/viewport

## Post-fix Verification

การแก้ไขตามรายงานนี้ตรวจซ้ำแล้วด้วย:

- `npm.cmd run validate-content`: 75/75 missions, 0 warnings, 0 errors.
- `npm.cmd test`: 129/129 tests passed.
- `npm.cmd run test:e2e`: 11/11 scenarios passed, including 375x812, 768x1024, 1440x900 and seeded Final Boss -> Victory.
- `npm.cmd run build`: passed.

รายการด้านบนของเอกสารยังคงเป็น audit ก่อนแก้ เพื่อเก็บหลักฐานปัญหาเดิม ส่วนสถานะปัจจุบันอยู่ใน `PLAYTEST_REPORT.md` และ `CONTENT_LEAK_REPORT.md` มีผล validator ล่าสุดกำกับไว้แล้ว
