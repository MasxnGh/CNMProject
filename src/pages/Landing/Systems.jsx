import Reveal from "./Reveal.jsx";
import { ART } from "../../lib/art.js";
import CATEGORIES from "../../content/categories.json";
import CONFIG from "../../content/config.json";

const boardCount = CATEGORIES.length * CONFIG.difficulties.length;

const FEATURES = [
  {
    icon: "brain",
    title: "คำที่ยังไม่แม่นโผล่บ่อยกว่า",
    body: "ทุกคำมีระดับความจำ 5 ขั้น ระบบถ่วงน้ำหนักให้คำที่คุณอ่อนโผล่บ่อยขึ้นเอง",
  },
  {
    icon: "sky",
    title: "ฟ้าของคุณเอง",
    body: "ทุกคำที่ตอบถูกกลายเป็นว่าวหนึ่งตัวบนฟ้า จบเกมแล้วได้เห็นฟ้าที่ตัวเองปล่อยไว้",
  },
  {
    icon: "chart",
    title: "ระดับยากคูณคะแนนจริง",
    body: "ไม่ได้แค่เร็วขึ้น แต่ตัวลวงคล้ายคำตอบมากขึ้นและซ่อนตัวช่วยทั้งหมด",
  },
  {
    icon: "trophy",
    title: "กระดานแยกตามหมวดและระดับ",
    body: `${CATEGORIES.length} หมวด คูณ ${CONFIG.difficulties.length} ระดับ เท่ากับ ${boardCount} กระดาน ทำอันดับหนึ่งในหมวดที่ถนัดได้ง่ายกว่า`,
  },
  {
    icon: "sound",
    title: "เสียงทุกคำ",
    body: "ทุกคำมีเสียงอ่าน กดฟังซ้ำได้ตลอด",
  },
  {
    icon: "phone2",
    title: "เล่นได้ทุกเครื่อง",
    body: "ออกแบบให้ใช้นิ้วบนมือถือสะดวก และขยายเต็มจอบนคอมพิวเตอร์",
  },
];

export default function Systems() {
  return (
    <section className="sec tint" id="feat">
      <Reveal className="secH">
        <div className="kk">SYSTEMS</div>
        <h2>ระบบเบื้องหลัง</h2>
      </Reveal>
      <div className="feat">
        {FEATURES.map((f) => (
          <Reveal as="div" key={f.icon} className="fit">
            <div className="fi" dangerouslySetInnerHTML={{ __html: ART[f.icon] }} />
            <div>
              <h4>{f.title}</h4>
              <p>{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
