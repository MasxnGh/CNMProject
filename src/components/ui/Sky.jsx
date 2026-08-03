import { useMemo } from "react";
import "./Sky.css";

const SPARK_COUNT = 18;

export default function Sky() {
  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, () => ({
        left: Math.random() * 100,
        duration: 11 + Math.random() * 13,
        delay: -Math.random() * 20,
      })),
    [],
  );

  return (
    <div className="sky" aria-hidden="true">
      {sparks.map((spark, index) => (
        <div
          key={index}
          className="spark"
          style={{
            left: `${spark.left}%`,
            animationDuration: `${spark.duration}s`,
            animationDelay: `${spark.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
