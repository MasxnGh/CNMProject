import { useMemo, useState } from "react";
import Illustration from "../../components/ui/Illustration.jsx";
import { useBurst } from "../../state/BurstContext.jsx";
import { shuffle } from "../../lib/question.js";

const PAIR_COLORS = ["#6FA294", "#C08A2E"];

export default function MatchPad({ words, locked, onResolve }) {
  const { triggerBurst } = useBurst();
  const cells = useMemo(() => {
    const list = [];
    for (const w of words) {
      list.push({ id: `${w.id}-img`, wordId: w.id, type: "img", word: w });
      list.push({ id: `${w.id}-word`, wordId: w.id, type: "word", word: w });
    }
    return shuffle(list);
  }, [words]);

  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState([]);
  const [wrongPair, setWrongPair] = useState([]);
  const [wrongCount, setWrongCount] = useState(0);

  function handleTap(i, el) {
    if (locked || wrongPair.length || done.includes(cells[i].id)) return;
    if (selected === null) {
      setSelected(i);
      return;
    }
    if (selected === i) {
      setSelected(null);
      return;
    }

    const a = cells[selected];
    const b = cells[i];
    if (a.wordId === b.wordId && a.type !== b.type) {
      const newDone = [...done, a.id, b.id];
      setDone(newDone);
      setSelected(null);
      const rect = el.getBoundingClientRect();
      triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, PAIR_COLORS, 20);
      if (newDone.length === cells.length) {
        onResolve(wrongCount <= 1, rect);
      }
    } else {
      setWrongPair([selected, i]);
      setWrongCount((c) => c + 1);
      setSelected(null);
      setTimeout(() => setWrongPair([]), 400);
    }
  }

  return (
    <div className="mgridq">
      {cells.map((c, i) => {
        let cls = "mcell";
        if (selected === i) cls += " sel";
        if (done.includes(c.id)) cls += " done";
        if (wrongPair.includes(i)) cls += " wrong";
        return (
          <button key={c.id} type="button" className={cls} disabled={locked} onClick={(e) => handleTap(i, e.currentTarget)}>
            {c.type === "img" ? (
              <Illustration vocabKey={c.word.art} category={c.word.cat} char={c.word.hanzi[0]} size={54} alt={c.word.hanzi} />
            ) : (
              <div>
                <div className="z zh">{c.word.hanzi}</div>
                <div className="p">{c.word.pinyin}</div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
