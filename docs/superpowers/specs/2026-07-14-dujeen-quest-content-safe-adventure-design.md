# Dujeen Quest Content-safe Adventure Redesign

วันที่: 14 กรกฎาคม 2026  
สถานะ: อนุมัติแนวทางที่ 1 แล้ว  
เอกสารอ้างอิง: `AUDIT_REPORT.md`, `CONTENT_LEAK_REPORT.md`

## เป้าหมาย

ปรับโปรเจกต์ React เดิมให้เป็นเกมผจญภัยไขปริศนาภาษาจีนที่สนุกและเล่นได้จริง โดยรักษา 15 ด่าน 75 Mission ระบบดาว XP Coins Badge Knowledge และ Local Storage เดิม พร้อมปิดเฉลยรั่วอย่างเป็นระบบ เพิ่ม Mission Intro, Pause, mini-game feedback, responsive controls และ automated validation

## ขอบเขตที่รักษาไว้

- ใช้ React + Vite + Tailwind CSS + Framer Motion + Lucide React เดิม
- ไม่ใช้ backend, database หรือ login
- เก็บจำนวนด่านและ Mission เดิม: 15 ด่าน ด่านละ 5 Mission
- รักษา `levelStars`, `totalStars`, XP, Coins, Badge, Knowledge และเงื่อนไขปลดล็อกเดิม
- การเล่นซ้ำบันทึกเฉพาะดาวสูงสุด ห้ามลดดาวเดิม
- ใช้ Web Speech API และ Web Audio API โดยไม่เพิ่มไฟล์เสียงภายนอก

## สถาปัตยกรรมข้อมูล Mission

Mission ทุกข้อจะมี contract เดียวกัน:

```js
{
  id: "9-1",
  levelId: 9,
  type: "pinyinDrag",
  beforeAnswer: {
    title: "ประกอบเสียงของคำว่าแมว",
    instruction: "ลากหรือแตะชิ้นส่วนไปวางในช่องว่าง",
    chineseText: "猫",
    thaiMeaning: "แมว",
    pinyinPattern: "m _ o",
    options: ["a", "e", "i", "u"]
  },
  answer: {
    correctAnswer: "a",
    finalPinyin: "māo"
  },
  afterAnswer: {
    chineseText: "猫",
    pinyin: "māo",
    thaiMeaning: "แมว",
    explanation: "m + ao รวมเป็น māo และใช้วรรณยุกต์เสียงที่ 1"
  },
  hint: "คำนี้ลงท้ายด้วยเสียงคล้ายคำว่า เอา",
  audioText: "猫",
  reward: { score: 20 }
}
```

`beforeAnswer` เป็นข้อมูลเดียวที่ Mission component รับระหว่างเล่น ส่วน `answer` ใช้เฉพาะ game engine เพื่อตรวจ และ `afterAnswer` ถูกเปิดเมื่อสถานะเป็น `feedback` เท่านั้น ห้าม spread object ทั้ง Mission เข้า child component เพื่อป้องกัน component เผลอ render เฉลย

ข้อมูลเดิมจะถูกย้ายด้วย helper constructors ใน `levels.js` เพื่อรักษา 75 Mission และลดการแก้ซ้ำ ไม่สร้างไฟล์ข้อมูลชุดที่สองซึ่งอาจไม่ตรงกัน

## Content Safety

เพิ่ม `src/utils/contentLeakValidator.js` เป็น pure validator ที่ใช้ได้ทั้ง runtime test และ Node CLI กฎแยกตาม type:

- Pinyin Drag ตรวจ `finalPinyin` ใน title/instruction/question ก่อนตอบ โดยเทียบ token และ normalized diacritics ไม่ค้นตัวอักษรสั้นอย่าง `a` แบบกว้าง
- Tone Choice ห้ามพินอินคำตอบอยู่ใน `beforeAnswer`
- Audio Choice ห้าม transcript, pinyin, Chinese target และคำแปลเฉลยอยู่ใน `beforeAnswer`
- Sentence Order ห้ามประโยคจีนที่ประกอบเสร็จอยู่ใน `beforeAnswer`
- Fill Blank ห้ามคำตอบหรือพินอินเต็มที่เติมช่องแล้วอยู่ก่อนตอบ
- Matching ห้ามการ์ดเดียวมีจีน+คำแปลก่อน matched และต้องตรวจ option uniqueness
- Hint ห้ามเท่ากับ correct answer หรือมีรูป `คำตอบคือ ...`; กฎเฉพาะ tone/final ตรวจ token เพิ่ม
- ตรวจ duplicate options, จำนวนคำตอบถูก, correct answer ใน options, explanation/pinyin/translation หลังตอบ

CLI `npm run validate-content` ต้องคืน exit code 1 เมื่อมี error และพิมพ์ total/passed/warnings/errors พร้อม Level/Mission ID

## Game State Flow

`GamePage` ใช้สถานะ scene ชัดเจน:

```text
intro -> playing -> feedback -> playing(next) -> result
                  -> failed
       -> paused -> playing
```

- Mission Intro แสดงสถานที่ เป้าหมาย ประเภทเกม รางวัล 3 ดาว และคำแนะนำที่ไม่ใช้ข้อมูลข้อจริง ผู้เล่นกดเริ่มหรือข้ามได้
- Input ถูกปิดใน feedback/paused/transition
- Feedback ไม่เปลี่ยนข้อทันที มีปุ่ม “ไปต่อ”; auto-advance ใช้ได้เฉพาะ setting ที่เปิดไว้
- Timer ทุกตัวเก็บใน ref และ cleanup เมื่อเปลี่ยน Mission, pause, กลับ Map หรือ unmount
- เปลี่ยน Mission progress และ card ใน AnimatePresence boundary เดียวกัน ป้องกันเลขข้อใหม่คู่กับการ์ดเก่า
- เปลี่ยน scene แล้ว scroll top และ focus heading เพื่อ mobile/accessibility

## Mission Components

### Pinyin Builder

รองรับ drag desktop และ tap-select/tap-drop mobile ใช้ `pinyinPattern` ก่อนตอบ เมื่อสำเร็จจึง animate ชิ้นส่วนรวมและแสดง tone mark/finalPinyin

### Tone Challenge

ก่อนตอบแสดง Hanzi ความหมาย และกราฟ tone 1-4 ไม่แสดงพินอินเต็ม หลังตอบแสดงพินอินและปุ่มฟังความต่าง

### Audio Hunt

ก่อนตอบมีปุ่มเสียงและตัวเลือกเท่านั้น Transcript/pinyin/translation อยู่หลังตอบ ปุ่มเสียงมี playing state และ cancel speech เมื่อออกจาก Mission

### Matching Cards

shuffle ซ้ายและขวาแยกกันครั้งเดียวต่อรอบ Desktop ใช้เส้นสั้นจาก port ที่เว้นระยะจากการ์ด Mobile ไม่วาดเส้นข้ามจอ แต่ animate คู่ที่ถูกเข้าหากันและเก็บใน matched tray

### Sentence Builder

ก่อนตอบแสดงคำแปลไทยและ word bank ที่ shuffle มี Undo/Clear/Check หลังตอบจึงแสดงประโยคจีนเต็มและพินอิน

### Shopping Mission

แสดง shopping list ภาษาจีนและสินค้าเป็นภาพ/emoji พร้อม label ที่ไม่จับคู่จีน-ไทยครบในใบเดียว มีตะกร้าและจำนวน item หลังตอบเปิดคำศัพท์ครบ

### Hanzi Writing

- Practice: guide จาง ลำดับขีด ไม่เสียหัวใจ และมีป้าย “ฝึกเขียน”
- Challenge: preview 2.5 วินาทีแล้วซ่อน มี Undo/Clear/Hint/Check; Hint เปิด guide และนับในระบบกลาง
- ตรวจพื้นฐานด้วย stroke count, ink bounds coverage, quadrant coverage และตำแหน่งโดยประมาณ ไม่อ้างว่าเป็น AI handwriting recognition
- Canvas ใช้ pointer events, pointer capture และ `touch-action: none`

### Final Boss

ด่าน 15 แบ่ง UI เป็น 3 phase: ประตูเสียง, ตราประโยค, ผนึกอักษร แต่ยังใช้ 5 Mission เดิม HP ลดตาม Mission ที่ถูกและต้องเหลือ 0 เมื่อผ่านครบเกณฑ์ การตอบผิดลดหัวใจ แถบ HP เป็น state จริง ไม่ใช่ค่าคงที่

## HUD, Pause และ Settings

HUD ระหว่างเล่นแสดงเฉพาะหัวใจ Mission x/5 คะแนน Hint เสียง และ Pause ไม่ render XP/Coins/Stars ซ้ำ

Pause Overlay มีเล่นต่อ, เสียง, ลด motion, เริ่มด่านใหม่ และกลับ Map เมื่อ pause ต้องหยุด timer, speech และ input ด้านหลัง Escape เปิด/ปิด Pause; Enter ตรวจ; 1-4 เลือก choice; Space เล่นเสียงใน Audio Mission

`soundEnabled` และ `reducedMotion` บันทึกใน progress schema โดย migration ต้องยอมรับ save เดิมที่ไม่มีฟิลด์เหล่านี้

## Visual Direction

- แฟนตาซีจีนแบบเกมมือถือ สีแดงจีน ทอง ครีม เขียวหยก และฟ้าอ่อน
- ใช้ฉากเต็มพื้นที่มากกว่ากล่อง dashboard; HUD คงเหลือ cluster หลักเดียว
- Ambient motion จำกัดเฉพาะเมฆ โคม ใบไผ่ และ panda breathing
- Interaction motion เกิดเมื่อ hover/tap/drag/drop
- Reward motion ใช้กับดาว Badge Boss และ Victory
- Error motion สั่นสั้น สีแดงอ่อน ไม่มี flash
- Animation ใช้ transform/opacity และเคารพ `prefers-reduced-motion`

## Page Design

- Loading ใช้ readiness จริงและ minimum duration 700-1200ms ไม่บังคับรอนาน
- Home มี mascot และ CTA ใน first viewport; มี Continue เมื่อมี progress และ status เป็น star chip เดียว
- Chapter เป็นฉาก 3 chapter พร้อม progress และเงื่อนไขดาวสั้น ๆ
- Map เป็นเส้นทางคดเคี้ยว desktop/แนวตั้ง mobile และ reset scroll เมื่อเข้า
- Result เป็น reward reveal ไม่เป็นตาราง ใช้ confetti เฉพาะ clear/new record
- Knowledge เป็น travel journal cards; locked card ไม่เผยคำศัพท์
- Victory แสดง 3 phase clear, chest, total stars และ certificate

## Performance

- lazy-load Knowledge, Achievement, Victory และ mission component ที่หนัก
- ใช้ AudioContext singleton และ cleanup speech/timers
- ไม่เพิ่ม particle จำนวนมาก; ปิด ambient motion บน mobile/reduced motion
- memoize เฉพาะ component/list ที่วัดแล้วว่าหนัก ไม่ memoize expression เล็ก
- ลด CSS generation เก่าที่ซ้ำโดยไม่เปลี่ยน class ที่ยังถูกใช้งาน
- preload เฉพาะฉาก chapter/level ถัดไปเมื่อ idle

## Testing Strategy

### Unit/Data

- validator ครบ 75 Mission และ regression fixtures ของ Pinyin/Tone/Audio/Sentence/Fill/Matching
- star calculation, replay max-stars, reward cap, unlock thresholds, Local Storage migration
- Mission state reducer: pause, feedback, next, timer cleanup, failure

### Playwright

ทดสอบ Loading -> Home, Chapter/Map, locked level, level 1, Pinyin drag mouse/tap, no-answer-leak, Sentence Builder, Audio transcript hidden, Hanzi draw/clear, stars/replay/persistence/reset และ Final Boss -> Victory

ใช้ isolated Local Storage ต่อ test เพื่อไม่แก้ progress ผู้ใช้ และเก็บ screenshot ตามรายการที่ผู้ใช้กำหนดที่ 375x812, 768x1024 และ 1440x900

## Error Handling

- Web Speech ไม่รองรับ: แจ้งข้อความในเกมและยังเล่น Mission ได้
- AudioContext สร้างไม่ได้: ปิดเฉพาะ SFX ไม่หยุดเกม
- Local Storage เสีย/JSON ไม่ถูกต้อง: fallback default และรักษา schema migration
- Mission data invalid: validator fail ใน build/test; runtime แสดง recovery panel พร้อมกลับ Map แทน blank screen
- Canvas context unavailable: แสดง practice fallback ที่ให้แตะลำดับขีด ไม่ค้างด่าน

## เกณฑ์เสร็จ

- `npm run validate-content` ผ่าน 75/75 โดยไม่มี error
- automated tests และ production build ผ่าน
- ไม่มีคำตอบ/pinyin/transcript/explanation ปรากฏก่อนตอบตามกฎแต่ละ Mission
- ระบบดาวและ progress ไม่ลดเมื่อ replay/refresh
- เล่น Pinyin Drag และ Hanzi Writing ได้จริงทั้ง mouse/touch
- เส้นทาง Loading -> Victory ผ่าน playtest และไม่มี console error สำคัญ
- มี `PLAYTEST_REPORT.md` และ screenshot หลักครบ
