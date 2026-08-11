import { useNavigate } from "react-router-dom";
import Reveal from "./Reveal.jsx";
import Button from "../../components/ui/Button.jsx";

export default function FinalCta() {
  const navigate = useNavigate();
  return (
    <>
      <section className="fcta">
        <Reveal>
          <h2>พร้อมปล่อยว่าวตัวแรกหรือยัง</h2>
          <p>ไม่ต้องสมัคร ไม่ต้องดาวน์โหลด ใส่ชื่อแล้วเริ่มได้เลย</p>
          <Button onClick={() => navigate("/name")}>เริ่มเล่นเลย</Button>
        </Reveal>
      </section>
      <div className="lfoot">纸鸢 Zhi Yuan</div>
    </>
  );
}
