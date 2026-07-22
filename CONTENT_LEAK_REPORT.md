# Dujeen Quest - Content Leak Report (Pre-fix)

ตรวจข้อมูลครบ 15 ด่าน 75 Mission จาก `src/data/levels.js` และตรวจเส้นทาง render ใน `GamePage`, `ChoiceMission`, `PinyinDragMission`, `MatchingMission`, `SentenceOrderMission`, `ShoppingMission` และ `AudioChoiceMission`

## สรุป

- Mission ทั้งหมด: 75
- เฉลยรั่วทันทีจาก UI/data ปัจจุบัน: 30 Mission
- Hint บอกคำตอบตรงเกินไปเพิ่มเติม: 26 Mission (บาง Mission ซ้ำกับกลุ่มแรก)
- Matching ที่ไม่ shuffle สองฝั่งและ hint เปิดคู่แรก: 10 Mission
- Audio Mission ซ่อน transcript ก่อนตอบได้ถูกต้อง: 14 Mission

## เฉลยรั่วทันที

| ด่าน | Mission ID | Type | ไฟล์/บรรทัด | ข้อความที่ทำให้รั่ว | คำตอบที่ถูก | วิธีแก้ |
|---:|---|---|---|---|---|---|
| 1 ตลาดจีน | 1-2 | shopping | `levels.js:240` | แสดง `水 / 茶` พร้อม “น้ำและชา” และ item card มีจีน+ไทย | 水, 茶 | ก่อนตอบแสดงรายการจีน แต่สินค้าใช้ภาพ/ชื่อไทยอย่างใดอย่างหนึ่ง ไม่แสดงคู่แปลครบ |
| 1 ตลาดจีน | 1-4 | fillBlank | `levels.js:255` | `pinyin: miàntiáo` ถูก render เหนือ options | 面条 | ซ่อน pinyin ก่อนตอบ; เปิด `miàntiáo` หลังตอบ |
| 2 ร้านชาโบราณ | 2-1 | pinyinDrag | `levels.js:295` | “เติมเสียงที่หายไปให้เป็น nǐ hǎo” | ǐ | ใช้ “ประกอบเสียงของคำทักทาย” และ pattern เท่านั้น |
| 2 ร้านชาโบราณ | 2-2 | toneChoice | `levels.js:310` | `pinyin: lǎo` ถูก render ก่อนเลือก tone | lǎo | ก่อนตอบแสดง 老 + ความหมาย; หลังตอบค่อยแสดง lǎo |
| 2 ร้านชาโบราณ | 2-4 | pinyinDrag | `levels.js:322` | “เติม final ให้เป็น zài” | ai | ไม่ใส่ zài ใน question; แสดง 再 และ pattern `z _` |
| 2 ร้านชาโบราณ | 2-5 | toneChoice | `levels.js:337` | `pinyin: xuéshēng` ถูก render ก่อนเลือก | xuéshēng | ย้าย pinyin ไป `afterAnswer` |
| 3 พระราชวังต้องห้าม | 3-2 | multipleChoice | `levels.js:378` | พินอิน `Nǐ jiào shénme míngzi?` แปลกลับเป็น option ที่ถูกได้ตรง ๆ | 你叫什么名字？ | ก่อนตอบแสดงสถานการณ์ไทยเท่านั้น |
| 3 พระราชวังต้องห้าม | 3-4 | fillBlank | `levels.js:399` | พินอินเต็ม `Hěn gāoxìng rènshi nǐ.` เผยคำในช่อง | 认识 | ซ่อนพินอินเต็มก่อนตอบ |
| 4 ถนนเซี่ยงไฮ้ | 4-2 | toneChoice | `levels.js:442` | `pinyin: yī` แสดงเหนือ tone options | yī | ย้าย pinyin ไปหลังตอบ |
| 4 ถนนเซี่ยงไฮ้ | 4-3 | fillBlank | `levels.js:453` | `míngtiān jiàn` เผยคำหน้าช่อง | 明天 | ก่อนตอบใช้ประโยคจีนเว้นช่อง + คำแปลเท่านั้น |
| 5 สถานีรถไฟ | 5-4 | fillBlank | `levels.js:511` | `Wǒ yào qù Běijīng.` เผย 北京 | 北京 | ย้ายพินอินเต็มไปหลังตอบ |
| 5 สถานีรถไฟ | 5-5 | shopping | `levels.js:521` | เป้าหมาย “รถไฟและตั๋ว” แสดงคู่กับ item card จีน+ไทย | 火车, 票 | แสดงคำสั่งจีนและใช้ visual item ที่ไม่ติดคำแปลคู่ตรง ๆ |
| 6 ร้านอาหารจีน | 6-1 | shopping | `levels.js:555` | “เมนูและข้าว” ปรากฏพร้อม item card แปลไทย | 菜单, 米饭 | ซ่อนคำแปลรายการจนตรวจเสร็จ |
| 6 ร้านอาหารจีน | 6-3 | fillBlank | `levels.js:579` | `Wǒ yào zhège.` เผย 这个 | 这个 | ซ่อนพินอินเต็มก่อนตอบ |
| 7 ตรุษจีน | 7-5 | shopping | `levels.js:644` | “อั่งเปาและโคมไฟ” แสดงพร้อมคำเป้าหมาย | 红包, 灯笼 | ใช้ภาพสินค้าและคำสั่งจีน; เฉลยไทยหลังตอบ |
| 8 โรงเรียน | 8-2 | fillBlank | `levels.js:685` | `Zhè shì wǒ de shū.` เผย 书 | 书 | ซ่อนพินอินเต็มก่อนตอบ |
| 8 โรงเรียน | 8-3 | shopping | `levels.js:695` | “หนังสือและปากกา” แสดงพร้อม cards | 书, 笔 | ซ่อนคำแปล target ก่อนตอบ |
| 9 สวนแพนด้า | 9-1 | pinyinDrag | `levels.js:745` | question แสดง `māo`; hint ระบุเสียงกลาง `a` | a | แสดง 猫, แมว, `m _ o`; hint ใช้ “ลงท้ายคล้าย เอา” |
| 9 สวนแพนด้า | 9-4 | toneChoice | `levels.js:768` | `pinyin: gǒu` แสดงก่อนเลือก | gǒu | ย้าย pinyin ไปหลังตอบ |
| 9 สวนแพนด้า | 9-5 | shopping | `levels.js:779` | “ปลาและแมว” แสดงพร้อมจีนและคำแปล item | 鱼, 猫 | ใช้คำสั่งจีน + ภาพสัตว์ ไม่แสดงคู่จีน-ไทยพร้อมกัน |
| 10 บ้านครอบครัว | 10-1 | fillBlank | `levels.js:813` | `Zhè shì wǒ de jiā.` เผย 家 | 家 | ซ่อนพินอินเต็มก่อนตอบ |
| 10 บ้านครอบครัว | 10-5 | toneChoice | `levels.js:841` | `pinyin: mā` แสดงก่อนเลือก | mā | ย้าย pinyin ไปหลังตอบ |
| 11 ซูเปอร์มาร์เก็ต | 11-1 | shopping | `levels.js:872` | “แอปเปิลและกล้วย” แสดงพร้อม item จีน+ไทย | 苹果, 香蕉 | แสดง shopping list จีนและสินค้าเป็นภาพ |
| 11 ซูเปอร์มาร์เก็ต | 11-3 | fillBlank | `levels.js:893` | `Píngguǒ shì hóngsè de.` เผย 红色 | 红色 | ซ่อน pinyin เต็มก่อนตอบ |
| 11 ซูเปอร์มาร์เก็ต | 11-5 | pinyinDrag | `levels.js:904` | question เขียน `lǜsè` | ü | ใช้ “เติมสระพิเศษของคำว่าสีเขียว” + pattern |
| 12 ซีอาน | 12-4 | toneChoice | `levels.js:963` | `pinyin: kǒu` แสดงก่อนเลือก | kǒu | ย้ายพินอินไปหลังตอบ |
| 13 หอสมุด | 13-2 | fillBlank | `levels.js:1005` | `Wǒ xǐhuān Zhōngguó cài.` เผย 喜欢 | 喜欢 | ซ่อนพินอินก่อนตอบ |
| 13 หอสมุด | 13-4 | fillBlank | `levels.js:1025` | `Zhè shì wǒ de shū.` เผย 书 | 书 | ซ่อนพินอินก่อนตอบ |
| 14 กำแพงเมืองจีน | 14-1 | pinyinDrag | `levels.js:1056` | question แสดง `māo` | a | ใช้ pattern + ความหมายเท่านั้น |
| 14 กำแพงเมืองจีน | 14-2 | toneChoice | `levels.js:1071` | `pinyin: mǎ` แสดงก่อนเลือก | mǎ | ย้ายพินอินไปหลังตอบ |
| 15 Final Boss | 15-1 | finalBoss | `levels.js:1128` | `pinyin: xīnnián kuàilè` ถูก ChoiceMission render ก่อนเลือก | 新年快乐 | ก่อนตอบแสดงสถานการณ์ปีใหม่ ไม่มี transcript/pinyin |

## Hint ที่บอกคำตอบตรงเกินไป

| กลุ่ม | Mission IDs | ข้อความ/รูปแบบที่รั่ว | วิธีแก้ |
|---|---|---|---|
| Matching | 1-1, 5-3, 6-5, 7-3, 8-1, 9-3, 10-3, 11-2, 12-3, 14-5 | ทุกข้อใช้ `เริ่มจาก [จีน] = [ไทย]` เปิดคู่แรกตรง ๆ | ให้ hint เป็นลักษณะคำ/หมวด หรือ highlight การ์ดจีนหนึ่งใบโดยไม่บอกคู่ |
| Audio | 1-3, 2-3, 3-5, 4-5, 5-2, 6-4, 7-4, 8-4, 9-2, 10-4, 11-4, 12-5, 13-5, 15-3 | `คำนี้แปลว่า ...` ทำให้จับ option จีนจากความหมายได้ตรง | ให้ hint เป็นจำนวนพยางค์, initial/final, tone contour หรือเล่นเสียงช้าลง |
| Fill Blank | 1-4, 3-4, 4-3, 6-3, 8-2, 10-1, 13-2, 13-4 | hint ระบุพินอินหรือเขียน `[คำตอบ] แปลว่า...` | ใช้หลักไวยากรณ์/จำนวนตัวอักษร/ตำแหน่งคำ โดยไม่พิมพ์คำตอบ |
| Pinyin Drag | 8-5, 9-1, 11-5, 15-2 | hint มี `zhuo`, `a`, `lǜ` ซึ่งเปิดชิ้นส่วนที่ต้องเลือก | ใช้คำอธิบายเสียงโดยประมาณหรือรูปปาก ไม่พิมพ์ final |
| Tone | 2-2, 2-5, 9-4, 10-5, 12-4 | hint บอกหมายเลข tone โดยตรง | แสดงกราฟ contour หรือคำว่า “เสียงตกแล้วขึ้น” แทนหมายเลข/พินอินเฉลย |

## Matching Order Leak

Mission Matching ทั้ง 10 ข้อมี `pairs` ฝั่งซ้ายตามลำดับคงที่จาก data และ shuffle เฉพาะ options ฝั่งขวาใน `MatchingMission.jsx:10-13` จึงจำตำแหน่งฝั่งซ้ายได้เมื่อเล่นซ้ำ แม้คำแปลฝั่งขวาจะสุ่มแล้ว การแก้ควร shuffle ทั้งสองฝั่งแยกกันเมื่อ mount และไม่ re-shuffle ระหว่าง render

## ส่วนที่ไม่พบ Transcript รั่ว

`AudioChoiceMission` ส่ง `audioOnly` ให้ `ChoiceMission` ทำให้ก่อนตอบแสดง “ฟังเสียงจากแผ่นหยก” แทน `chineseText` และไม่ render `pinyin`/`thaiMeaning` ตรวจจริงใน Mission 1-3 แล้ว ไม่พบ transcript ก่อนตอบ จุดนี้ควรรักษาพฤติกรรมเดิมและเพิ่ม test ป้องกัน regression

## Current Validator Result

หลัง migrate เป็น `beforeAnswer`/`answer`/`afterAnswer` และแก้ renderer boundary แล้ว:

- Total missions: 75
- Passed: 75
- Warnings: 0
- Errors: 0

ตรวจซ้ำด้วย `npm.cmd run validate-content` และ browser tests ใน `tests/e2e/content-safety.spec.js` ครอบคลุม Pinyin Drag, Audio Choice และ Sentence Order
