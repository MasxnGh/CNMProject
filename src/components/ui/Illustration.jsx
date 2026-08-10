import { useEffect, useState } from "react";
import { ART, CATEGORY_COLORS, hasSvgArt, vocabImageSrc } from "../../lib/art.js";
import "./Illustration.css";

/**
 * Three-layer word illustration: photo (webp) -> hand-drawn SVG -> hanzi on a color chip.
 * A failed <img> load falls through to the next layer automatically.
 */
export default function Illustration({ vocabKey, category, char, size = 64, alt = "" }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [vocabKey]);

  const colors = CATEGORY_COLORS[category] || { c: "var(--ink3)", cl: "var(--shell)" };
  const showPhoto = Boolean(vocabKey) && !imgFailed;
  const svg = hasSvgArt(vocabKey) ? ART[vocabKey] : null;

  return (
    <div
      className="illus"
      style={{ "--bg": colors.cl, width: size, height: size }}
    >
      {showPhoto && (
        <img
          className="illus-img"
          src={vocabImageSrc(vocabKey)}
          alt={alt}
          loading="lazy"
          draggable="false"
          onError={() => setImgFailed(true)}
        />
      )}
      {!showPhoto &&
        (svg ? (
          <span className="illus-svg" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span className="illus-char zh" style={{ color: colors.c }}>
            {char}
          </span>
        ))}
    </div>
  );
}
