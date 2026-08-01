/** dujeen-quest-prototype.html's <nav class="rail"> sits outside <main> and
    is rendered unconditionally on every screen, not just the chapter grid -
    shared here since StartScreen/ChapterSelect/ChapterPath all need the
    same three entries. */
export const buildNavItems = (navigate) => [
  { key: "learn", icon: "🏮", label: "เรียน", onClick: () => navigate("/chapters") },
  { key: "review", icon: "🎯", label: "ทวน", onClick: () => navigate("/practice") },
  { key: "me", icon: "🧧", label: "ฉัน", onClick: () => navigate("/profile") },
];
