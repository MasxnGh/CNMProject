import Reveal from "./Reveal.jsx";
import CONFIG from "../../content/config.json";

export default function Modes() {
  return (
    <section className="sec" id="modes">
      <Reveal className="secH">
        <div className="kk">GAME MODES</div>
        <h2>ห้าโหมด ห้าความรู้สึก</h2>
      </Reveal>
      <div className="modes">
        {CONFIG.modes.map((m, i) => (
          <Reveal
            as="div"
            key={m.id}
            className="mc"
            delay={i * 80}
            style={{ "--c": m.color, "--cl": m.colorLight }}
          >
            <div className="mh">
              <div className="mi">{m.zh}</div>
              <div>
                <div className="mt">{m.th}</div>
                <div className="mz">{m.pinyin}</div>
              </div>
            </div>
            <p>{m.description}</p>
            <div className="chips">
              {m.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
