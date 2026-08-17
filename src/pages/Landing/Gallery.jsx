import { useMemo } from "react";
import Reveal from "./Reveal.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import { useIsPhone } from "../../lib/useIsPhone.js";
import VOCAB from "../../content/vocab.json";

function pickRandom(list, n) {
  const pool = [...list];
  const picked = [];
  while (pool.length && picked.length < n) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

export default function Gallery() {
  const isPhone = useIsPhone();
  const words = useMemo(() => pickRandom(VOCAB.filter((w) => w.art), 24), []);

  return (
    <section className="sec tint" id="words">
      <Reveal className="secH">
        <div className="kk">ILLUSTRATIONS</div>
        <h2>ทุกคำมีภาพของตัวเอง</h2>
      </Reveal>
      <Reveal className="gal">
        {words.map((w) => (
          <div className="gw" key={w.id}>
            <Illustration vocabKey={w.art} category={w.cat} char={w.hanzi[0]} size={isPhone ? 72 : 96} alt={w.hanzi} />
            <div className="h">{w.hanzi}</div>
            <div className="p">{w.pinyin}</div>
            <div className="t">{w.thai}</div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
