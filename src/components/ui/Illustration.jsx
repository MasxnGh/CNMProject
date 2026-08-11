import { useEffect, useState } from "react";
import { ART, CATEGORY_COLORS, hasSvgArt, isEmojiArt, vocabImageSrc } from "../../lib/art.js";
import "./Illustration.css";

/**
 * Four-layer word illustration: photo (webp) -> hand-drawn SVG -> emoji -> hanzi on a color chip.
 * A failed <img> load falls through to the next layer automatically.
 */
export default function Illustration({ vocabKey, category, char, size = 64, alt = "" }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [vocabKey]);

  const colors = CATEGORY_COLORS[category] || { c: "var(--ink3)", cl: "var(--shell)" };
  const emoji = isEmojiArt(vocabKey) ? vocabKey : null;
  const showPhoto = Boolean(vocabKey) && !emoji && !imgFailed;
  const svg = !emoji && hasSvgArt(vocabKey) ? ART[vocabKey] : null;

  return (
    <div
      className={`illus${showPhoto ? " photo" : ""}`}
      // emoji/hanzi sizing is in em (see Illustration.css) so it scales with
      // this circle's own size, not with whatever font-size the caller happens
      // to be nested inside
      style={{ "--bg": colors.cl, width: size, height: size, fontSize: size }}
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
        (emoji ? (
          <span className="illus-emoji" role="img" aria-label={alt}>
            {emoji}
          </span>
        ) : svg ? (
          <span className="illus-svg" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span className="illus-char zh" style={{ color: colors.c }}>
            {char}
          </span>
        ))}
    </div>
  );
}
