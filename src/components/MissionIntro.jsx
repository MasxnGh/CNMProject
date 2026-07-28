import { ArrowRight, Check, MapPin, Target } from "lucide-react";
import React from "react";

export default function MissionIntro({ intro, skipMissionIntro, onSkipMissionIntro, onStart }) {
  return (
    <main className="v2-mission-arena" aria-label="คำแนะนำภารกิจ">
      <div className="v2-quest-title">
        <span>สรุปภารกิจ</span>
        <h2>{intro.topic}</h2>
        <p>{intro.description}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="min-w-0">
          <h3 className="flex items-center gap-2 text-gold"><MapPin size={18} /> จุดหมาย</h3>
          <p className="mt-2 text-sm text-muted">{intro.location}</p>
        </section>
        <section className="min-w-0">
          <h3 className="flex items-center gap-2 text-gold"><Target size={18} /> ประเภทภารกิจ</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
            {intro.missionTypes.map((type) => <li className="inline-flex items-center gap-1" key={type}><Check size={16} /> {type}</li>)}
          </ul>
        </section>
      </div>

      <label className="v2-hint-panel mt-4">
        <input
          type="checkbox"
          checked={skipMissionIntro}
          onChange={(event) => onSkipMissionIntro(event.target.checked)}
        />
        ข้ามการแนะนำภารกิจครั้งหน้า
      </label>

      <button className="v2-button primary mt-3 w-full" type="button" onClick={onStart}>
        เริ่มเล่นเลย
        <ArrowRight size={20} />
      </button>
    </main>
  );
}
