import Reveal from "./Reveal.jsx";
import Kite from "../../components/ui/Kite.jsx";
import { ART } from "../../lib/art.js";

const STEPS = [
  {
    c: "var(--verm)",
    cl: "var(--verm-l)",
    num: "一",
    icon: "target",
    title: "ตั้งค่าก่อนเล่น",
    body: "เลือกระดับความยาก และเลือกหมวดคำศัพท์ได้หลายหมวดพร้อมกัน คำที่คุณยังไม่แม่นจะถูกสุ่มมาบ่อยกว่าคำที่จำได้แล้ว",
    delay: 0,
  },
  {
    c: "var(--cel)",
    cl: "var(--cel-l)",
    num: "二",
    icon: "kiteIcon",
    title: "ตอบก่อนว่าวลอยพ้น",
    body: "ว่าวลอยขึ้นเรื่อยๆ พร้อมภาพและคำถาม ถ้าปล่อยให้ถึงเขตลมบนถือว่าพลาด ตอบตอนว่าวยังอยู่ต่ำจะได้คะแนนโบนัสมากกว่า",
    delay: 100,
  },
  {
    c: "var(--lapis)",
    cl: "var(--lapis-l)",
    num: "三",
    icon: "cards",
    title: "จบรอบเลือกการ์ด",
    body: "ทุกครั้งที่จบรอบจะได้เลือกการ์ด 1 ใบจาก 3 ใบ การ์ดเปลี่ยนกติกาของรอบถัดไป ยากขึ้นแลกกับตัวคูณคะแนนที่สูงขึ้น",
    delay: 200,
  },
];

const DEMO_CLOUDS = [
  { top: 14, left: 60, size: 44 },
  { top: 70, left: 26, size: 32 },
  { top: 48, left: 120, size: 38 },
];

export default function HowToPlay() {
  return (
    <section className="sec" id="how">
      <Reveal className="secH">
        <div className="kk">HOW TO PLAY</div>
        <h2>เล่นยังไง</h2>
        <p>ไม่มีด่านให้ผ่าน เลือกเองว่าจะฝึกหมวดไหนและยากแค่ไหน</p>
      </Reveal>

      <div className="big3">
        {STEPS.map((s) => (
          <Reveal as="div" key={s.num} className="b3" delay={s.delay} style={{ "--c": s.c, "--cl": s.cl }}>
            <div className="no zhb">{s.num}</div>
            <div className="si" dangerouslySetInnerHTML={{ __html: ART[s.icon] }} />
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="demoSky">
        <div className="zone">
          <div className="zl">เขตลมบน — ห้ามให้ว่าวลอยถึง</div>
        </div>
        {DEMO_CLOUDS.map((c, i) => (
          <div
            key={i}
            className="cloud"
            style={{ top: `${c.top}%`, left: c.left, width: c.size * 2, height: c.size }}
          />
        ))}
        <Kite c1="#C08A2E" c2="#835811" className="dk" />
      </Reveal>
    </section>
  );
}
