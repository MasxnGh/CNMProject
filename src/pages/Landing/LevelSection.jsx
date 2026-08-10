import Reveal from "./Reveal.jsx";
import CATEGORIES from "../../content/categories.json";
import VOCAB from "../../content/vocab.json";
import CONFIG from "../../content/config.json";
import { ART } from "../../lib/art.js";

const vocabById = new Map(VOCAB.map((w) => [w.id, w]));
const wordCountByCat = (catId) => VOCAB.filter((w) => w.cat === catId).length;
const illustratedCount = VOCAB.filter((w) => w.art).length;

export default function LevelSection() {
  return (
    <section className="sec" id="level">
      <Reveal className="secH">
        <div className="kk">LEVEL &amp; VOCABULARY</div>
        <h2>ใช้ภาษาระดับไหน</h2>
        <p>
          ทุกคำในเกมคัดจากระดับ HSK 1 ซึ่งเป็นระดับเริ่มต้นที่สุดของการสอบวัดระดับภาษาจีน
          และคัดซ้ำอีกชั้นให้เหลือเฉพาะคำที่ใช้บ่อยจริงในชีวิตประจำวัน
        </p>
      </Reveal>

      <div className="lvlWrap">
        <Reveal className="lvlCard">
          <div className="seal2" />
          <div className="badge">
            <b>HSK</b> ระดับ 1 · ผู้เริ่มต้น
          </div>
          <h3>ระดับเริ่มต้นที่สุด เรียนได้แม้ไม่เคยรู้ภาษาจีนมาก่อน</h3>
          <p>
            HSK คือการสอบวัดระดับภาษาจีนมาตรฐานของทางการจีน แบ่งเป็น 6 ระดับ
            ระดับ 1 คือขั้นแรกสุด ครอบคลุมคำศัพท์พื้นฐานราว 150 คำ
            ผู้ที่ผ่านระดับนี้จะสื่อสารประโยคง่ายๆ ในชีวิตประจำวันได้
            <br />
            <br />
            เกมนี้เลือกใช้ระดับ 1 ทั้งหมด เพราะต้องการให้คนไทยที่ไม่เคยเรียนภาษาจีนมาก่อน
            เริ่มเล่นได้ทันทีโดยไม่ต้องเตรียมตัว และคำที่จำได้จากเกมเอาไปใช้พูดได้จริง
          </p>
          <div className="lvlStats">
            <div className="lvlStat">
              <b>{VOCAB.length}</b>
              <span>คำศัพท์</span>
            </div>
            <div className="lvlStat">
              <b>{CATEGORIES.length}</b>
              <span>หมวดหมู่</span>
            </div>
            <div className="lvlStat">
              <b>{illustratedCount}</b>
              <span>ภาพประกอบ</span>
            </div>
            <div className="lvlStat">
              <b>1</b>
              <span>ระดับ HSK</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} style={{ display: "grid", gap: 14 }}>
          <div className="notCard">
            <div className="ni2" dangerouslySetInnerHTML={{ __html: ART.target }} />
            <div>
              <b>คัดเฉพาะคำที่ใช้บ่อยจริง</b>
              <p>
                ไม่ได้ยัดคำศัพท์ทั้งบัญชีมาให้ท่อง แต่เลือกเฉพาะคำที่โผล่ในบทสนทนาประจำวัน
                เช่น การทักทาย การถามราคา การบอกเวลา และคำกริยาที่ใช้ทุกวัน
                คำที่เจอน้อยหรือใช้เฉพาะในตำราจะถูกตัดออก
              </p>
            </div>
          </div>
          <div className="notCard" style={{ background: "var(--gold-l)", boxShadow: "inset 0 0 0 1px rgba(192,138,46,.22)" }}>
            <div className="ni2" dangerouslySetInnerHTML={{ __html: ART.chart }} />
            <div>
              <b>เรียงจากที่จำเป็นที่สุดก่อน</b>
              <p>
                หมวดที่มีคำเยอะที่สุดคือคำกริยา {wordCountByCat("verb")} คำ และตัวเลข {wordCountByCat("num")} คำ
                เพราะสองหมวดนี้คือสิ่งที่ต้องใช้ทุกประโยค
                ส่วนคำที่คุณยังตอบผิดบ่อยจะถูกสุ่มมาถามซ้ำถี่กว่าคำที่จำได้แล้ว
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal as="h3" style={{ fontSize: 18, fontWeight: 500, margin: "36px 0 14px" }}>
        {CATEGORIES.length} หมวดหมู่ในเกม
      </Reveal>
      <Reveal className="catList">
        {CATEGORIES.map((c) => (
          <div className="catRow" key={c.id} style={{ "--c": c.color, "--cl": c.colorLight }}>
            <div className="ci2" dangerouslySetInnerHTML={{ __html: ART[c.icon] || "" }} />
            <div>
              <div className="cz2">{c.zh}</div>
              <div className="cn2">{c.th}</div>
            </div>
            <div className="cw2">{wordCountByCat(c.id)} คำ</div>
          </div>
        ))}
      </Reveal>

      <Reveal as="h3" style={{ fontSize: 18, fontWeight: 500, margin: "32px 0 0" }}>
        ตัวอย่างคำที่ใช้บ่อยที่สุด
      </Reveal>
      <Reveal className="sampleGrid">
        {CONFIG.landingSampleWords.map((id) => {
          const w = vocabById.get(id);
          if (!w) return null;
          return (
            <div className="samp" key={id}>
              <div>
                <div className="sh">{w.hanzi}</div>
                <div className="sp2">{w.pinyin}</div>
              </div>
              <div className="st2">{w.thai}</div>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
