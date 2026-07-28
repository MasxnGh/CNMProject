import { motion, useReducedMotion } from "framer-motion";
import { Check, ShoppingBasket } from "lucide-react";
import React, { useState } from "react";

export default function ShoppingMission({ missionView, onSubmit, disabled, feedback }) {
  const [selected, setSelected] = useState([]);
  const reduceMotion = useReducedMotion();
  const correctItems = Array.isArray(feedback?.correctOption) ? feedback.correctOption : [];

  const toggle = (hanzi) => {
    if (disabled) return;
    setSelected((current) => (current.includes(hanzi) ? current.filter((item) => item !== hanzi) : [...current, hanzi]));
  };

  const submit = () => onSubmit(selected);

  return (
    <div className="mission-shell">
      <div className="mission-prompt shopping-list">
        <div>
          <span className="mission-label">รายการภารกิจ</span>
          <strong>{missionView.question}</strong>
        </div>
        <div role="status" aria-label="จำนวนสินค้าในตะกร้า" className="flex shrink-0 items-center gap-2 font-black text-red-800">
          <ShoppingBasket size={24} />
          <span>{selected.length}</span>
        </div>
      </div>

      <div className="shopping-grid">
        {(missionView.items ?? []).map((item) => {
          const picked = selected.includes(item.id);
          const isCorrect = feedback && correctItems.includes(item.id);
          const isWrong = feedback && picked && !correctItems.includes(item.id);
          return (
            <motion.button
              key={item.id}
              className={`shop-item ${picked ? "picked" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -5, scale: 1.025 }}
              whileTap={reduceMotion ? undefined : { y: 3, scale: 0.96 }}
              animate={picked && !reduceMotion ? { y: [0, -4, 0] } : {}}
              onClick={() => toggle(item.id)}
              disabled={disabled}
            >
              <span>{item.emoji}</span>
              <strong>{item.label ?? item.id}</strong>
            </motion.button>
          );
        })}
      </div>
      <motion.button className="game-button primary w-full" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={submit} disabled={disabled || selected.length === 0}>
        <Check size={19} />
        ตรวจรายการ
      </motion.button>
    </div>
  );
}
