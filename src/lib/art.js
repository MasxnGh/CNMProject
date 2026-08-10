/**
 * 3-layer illustration system.
 * Layer 1: /img/vocab/<key>.webp if present.
 * Layer 2: inline SVG from ART if the key has no photo yet.
 * Layer 3: the hanzi itself on a category-colored circle if neither exists.
 * Resolution/fallback happens in components/ui/Illustration.jsx — this file only holds data.
 */

const P = {
  ink: "#3A332B",
  red: "#CE4430",
  red2: "#8E2415",
  cel: "#6FA294",
  cel2: "#3F6D62",
  gold: "#C08A2E",
  gold2: "#835811",
  lap: "#3F6BA8",
  lap2: "#24446F",
  plum: "#A65682",
  skin: "#E8B98F",
  skin2: "#C9915F",
  wh: "#FFFDF8",
  cream: "#F2E7D2",
  gy: "#B9AFA0",
  grn: "#5C9B54",
  brn: "#8A5F3C",
  blu: "#6BA8D8",
};

function S(body) {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

const head = (y, c) => `<circle cx="32" cy="${y}" r="9" fill="${c || P.skin}"/>`;

export const ART = {
  // greetings
  nihao: S(`${head(20)}<path d="M32 30c-8 0-13 5-13 12v10h26V42c0-7-5-12-13-12z" fill="${P.red}"/>
   <path d="M18 34l-6-9" stroke="${P.skin}" stroke-width="5" stroke-linecap="round"/>
   <circle cx="11" cy="23" r="5" fill="${P.skin}"/>
   <path d="M6 17l2-3M11 15l0-4M17 17l2-3" stroke="${P.gold}" stroke-width="2" stroke-linecap="round"/>`),
  xiexie: S(`${head(19)}<path d="M32 29c-8 0-13 5-13 12v11h26V41c0-7-5-12-13-12z" fill="${P.cel}"/>
   <path d="M26 38l6-6 6 6-6 8z" fill="${P.skin}"/>
   <path d="M26 38l6 6 6-6" stroke="${P.skin2}" stroke-width="1.6" fill="none"/>`),
  zaijian: S(`${head(20)}<path d="M32 30c-8 0-13 5-13 12v10h26V42c0-7-5-12-13-12z" fill="${P.lap}"/>
   <path d="M46 32l7-8" stroke="${P.skin}" stroke-width="5" stroke-linecap="round"/>
   <circle cx="54" cy="21" r="5" fill="${P.skin}"/>
   <path d="M44 20q5-5 10 0" stroke="${P.gy}" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  duibuqi: S(`<circle cx="32" cy="26" r="9" fill="${P.skin}"/>
   <path d="M32 36c-8 0-14 5-14 12v6h28v-6c0-7-6-12-14-12z" fill="${P.plum}"/>
   <path d="M24 24q3 3 6 0M34 24q3 3 6 0" stroke="${P.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
   <path d="M28 32q4 3 8 0" stroke="${P.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),
  // family
  baba: S(`${head(20)}<path d="M32 30c-9 0-14 5-14 13v9h28v-9c0-8-5-13-14-13z" fill="${P.lap}"/>
   <path d="M23 12q9-6 18 0v3H23z" fill="${P.ink}"/>
   <path d="M27 39h10v13h-10z" fill="${P.lap2}"/>`),
  mama: S(`${head(20)}<path d="M32 30c-9 0-14 5-14 13v9h28v-9c0-8-5-13-14-13z" fill="${P.plum}"/>
   <path d="M21 20q0-13 11-13t11 13q-3-7-11-7T21 20z" fill="${P.ink}"/>
   <path d="M22 22q-3 6-1 12M42 22q3 6 1 12" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`),
  gege: S(`${head(22, P.skin)}<path d="M32 32c-8 0-12 4-12 11v9h24v-9c0-7-4-11-12-11z" fill="${P.cel}"/>
   <path d="M24 15q8-5 16 0v3H24z" fill="${P.ink}"/>`),
  jiejie: S(`${head(22, P.skin)}<path d="M32 32c-8 0-12 4-12 11v9h24v-9c0-7-4-11-12-11z" fill="${P.red}"/>
   <path d="M22 22q0-11 10-11t10 11q-3-6-10-6t-10 6z" fill="${P.ink}"/>
   <circle cx="43" cy="18" r="3" fill="${P.gold}"/>`),
  jia: S(`<path d="M32 10L54 30v24H10V30z" fill="${P.cream}"/>
   <path d="M32 8L58 31H6z" fill="${P.red}"/>
   <rect x="26" y="38" width="12" height="16" rx="1.5" fill="${P.brn}"/>
   <rect x="14" y="34" width="8" height="8" rx="1.5" fill="${P.lap}"/>
   <rect x="42" y="34" width="8" height="8" rx="1.5" fill="${P.lap}"/>`),
  // food
  mifan: S(`<path d="M12 32h40c0 12-9 20-20 20s-20-8-20-20z" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.4"/>
   <path d="M14 32q18-14 36 0z" fill="${P.wh}"/>
   <ellipse cx="32" cy="31" rx="19" ry="5" fill="${P.cream}"/>
   <path d="M42 14l6 18" stroke="${P.brn}" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M48 14l-2 18" stroke="${P.brn}" stroke-width="2.4" stroke-linecap="round"/>`),
  shui: S(`<path d="M20 14h24l-3 38H23z" fill="${P.blu}" opacity=".3"/>
   <path d="M21 26h22l-2 25H23z" fill="${P.blu}"/>
   <path d="M20 14h24l-3 38H23z" fill="none" stroke="${P.lap2}" stroke-width="1.6"/>
   <ellipse cx="32" cy="26" rx="11" ry="2.5" fill="${P.wh}" opacity=".7"/>`),
  cha: S(`<path d="M14 26h30v12c0 8-7 14-15 14s-15-6-15-14z" fill="${P.cel}"/>
   <ellipse cx="29" cy="26" rx="15" ry="4" fill="${P.cel2}"/>
   <path d="M44 30h5a5 5 0 010 10h-5" fill="none" stroke="${P.cel2}" stroke-width="3"/>
   <path d="M26 16q2-5 5 0M33 14q2-5 5 0" stroke="${P.gy}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),
  mian: S(`<path d="M10 30h44c0 13-10 22-22 22s-22-9-22-22z" fill="${P.cream}" stroke="${P.gy}" stroke-width="1.4"/>
   <path d="M16 30q6-8 16-8t16 8" fill="none" stroke="${P.gold}" stroke-width="3" stroke-linecap="round"/>
   <path d="M20 30q4-13 12-13t12 13" fill="none" stroke="${P.gold2}" stroke-width="2.4" stroke-linecap="round"/>
   <circle cx="26" cy="38" r="4" fill="${P.gold}"/><circle cx="40" cy="40" r="3" fill="${P.grn}"/>`),
  pingguo: S(`<path d="M32 20c-4-4-14-3-14 10s7 22 14 22 14-9 14-22-10-14-14-10z" fill="${P.red}"/>
   <path d="M32 20c0-6 2-9 6-11" stroke="${P.brn}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
   <path d="M34 12q7-3 9 3-6 3-9-3z" fill="${P.grn}"/>
   <path d="M24 28q-2 6 0 11" stroke="${P.wh}" stroke-width="2.4" opacity=".5" fill="none" stroke-linecap="round"/>`),
  yu: S(`<path d="M46 32c0 8-9 14-19 14-8 0-14-6-14-14s6-14 14-14c10 0 19 6 19 14z" fill="${P.blu}"/>
   <path d="M46 32l10-9v18z" fill="${P.lap}"/>
   <circle cx="22" cy="29" r="2.6" fill="${P.wh}"/><circle cx="22" cy="29" r="1.3" fill="${P.ink}"/>
   <path d="M30 24q6 8 0 16" stroke="${P.lap2}" stroke-width="1.8" fill="none" opacity=".6"/>`),
  // animals
  mao: S(`<path d="M17 26l-3-12 11 6zM47 26l3-12-11 6z" fill="${P.gold}"/>
   <ellipse cx="32" cy="34" rx="18" ry="16" fill="${P.gold}"/>
   <circle cx="25" cy="31" r="2.6" fill="${P.ink}"/><circle cx="39" cy="31" r="2.6" fill="${P.ink}"/>
   <path d="M32 37l-3 3h6z" fill="${P.red}"/>
   <path d="M32 40v3M28 43q4 3 8 0" stroke="${P.ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
   <path d="M14 34h-8M14 38h-8M50 34h8M50 38h8" stroke="${P.ink}" stroke-width="1.3" stroke-linecap="round"/>`),
  gou: S(`<ellipse cx="32" cy="35" rx="17" ry="15" fill="${P.brn}"/>
   <path d="M15 20q-6 4-3 14 6 2 8-6z" fill="${P.brn}"/><path d="M49 20q6 4 3 14-6 2-8-6z" fill="${P.brn}"/>
   <circle cx="26" cy="32" r="2.6" fill="${P.ink}"/><circle cx="38" cy="32" r="2.6" fill="${P.ink}"/>
   <ellipse cx="32" cy="40" rx="4.4" ry="3.4" fill="${P.ink}"/>
   <path d="M32 44v3M28 47q4 3 8 0" stroke="${P.ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
  niao: S(`<ellipse cx="30" cy="34" rx="15" ry="13" fill="${P.cel}"/>
   <circle cx="42" cy="24" r="8" fill="${P.cel}"/>
   <path d="M50 24l7 3-7 3z" fill="${P.gold}"/>
   <circle cx="44" cy="22" r="2.2" fill="${P.ink}"/>
   <path d="M18 30q10 4 14 12-12 2-14-12z" fill="${P.cel2}"/>
   <path d="M15 34l-9 4 9 4z" fill="${P.cel2}"/>`),
  ma: S(`<path d="M22 50V34q0-10 10-12l12-4v-6l8 6v10q0 6-8 8v14z" fill="${P.brn}"/>
   <path d="M44 12l4-5 2 6z" fill="${P.brn}"/>
   <circle cx="47" cy="16" r="1.8" fill="${P.ink}"/>
   <path d="M40 12q-8 2-11 10" stroke="${P.ink}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
   <path d="M26 50v6M36 50v6" stroke="${P.brn}" stroke-width="5" stroke-linecap="round"/>`),
  // objects
  shu: S(`<path d="M32 20q-8-6-20-4v32q12-2 20 4z" fill="${P.red}"/>
   <path d="M32 20q8-6 20-4v32q-12-2-20 4z" fill="${P.red2}"/>
   <path d="M32 20v32" stroke="${P.cream}" stroke-width="2"/>
   <path d="M18 24q6-1 10 1M18 30q6-1 10 1M36 25q6-2 10-1M36 31q6-2 10-1"
     stroke="${P.cream}" stroke-width="1.4" fill="none" opacity=".65"/>`),
  che: S(`<path d="M10 40v-6l6-12h30l8 12v6z" fill="${P.lap}"/>
   <path d="M19 25h12v9H15z" fill="${P.blu}"/><path d="M35 25h9l6 9H35z" fill="${P.blu}"/>
   <circle cx="20" cy="43" r="6" fill="${P.ink}"/><circle cx="20" cy="43" r="2.4" fill="${P.gy}"/>
   <circle cx="45" cy="43" r="6" fill="${P.ink}"/><circle cx="45" cy="43" r="2.4" fill="${P.gy}"/>`),
  shouji: S(`<rect x="20" y="8" width="24" height="48" rx="5" fill="${P.ink}"/>
   <rect x="23" y="14" width="18" height="34" rx="2" fill="${P.blu}"/>
   <circle cx="32" cy="52" r="2.2" fill="${P.gy}"/>
   <path d="M27 22h8M27 27h12M27 32h9" stroke="${P.wh}" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`),
  qian: S(`<circle cx="32" cy="32" r="20" fill="${P.gold}"/>
   <circle cx="32" cy="32" r="15" fill="none" stroke="${P.gold2}" stroke-width="1.6"/>
   <rect x="26" y="26" width="12" height="12" rx="1.5" fill="${P.cream}"/>
   <path d="M32 20v-4M32 48v-4" stroke="${P.gold2}" stroke-width="2" stroke-linecap="round"/>`),
  san: S(`<path d="M6 34q0-22 26-22t26 22z" fill="${P.red}"/>
   <path d="M6 34q9-6 13 0t13 0 13 0 13 0" fill="none" stroke="${P.red2}" stroke-width="1.6"/>
   <path d="M32 12v34a5 5 0 01-10 0" fill="none" stroke="${P.brn}" stroke-width="2.6" stroke-linecap="round"/>`),
  yaoshi: S(`<circle cx="20" cy="24" r="10" fill="none" stroke="${P.gold}" stroke-width="5"/>
   <path d="M27 30l22 22" stroke="${P.gold}" stroke-width="5" stroke-linecap="round"/>
   <path d="M41 44l5 5M46 39l5 5" stroke="${P.gold}" stroke-width="4" stroke-linecap="round"/>`),
  // nature
  taiyang: S(`<circle cx="32" cy="32" r="13" fill="${P.gold}"/>
   <g stroke="${P.gold}" stroke-width="3.4" stroke-linecap="round">
   <path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4"/></g>`),
  yueliang: S(`<path d="M40 8a24 24 0 100 48 20 20 0 010-48z" fill="${P.gold}"/>
   <circle cx="50" cy="16" r="2.4" fill="${P.gold}" opacity=".7"/>
   <circle cx="54" cy="26" r="1.8" fill="${P.gold}" opacity=".55"/>`),
  shan: S(`<path d="M4 52l18-30 10 15 8-12 20 27z" fill="${P.cel2}"/>
   <path d="M22 22l7 11H15z" fill="${P.wh}"/>
   <path d="M40 25l5 8H35z" fill="${P.wh}"/>`),
  shu2: S(`<path d="M29 52V34h6v18z" fill="${P.brn}"/>
   <circle cx="32" cy="24" r="13" fill="${P.grn}"/>
   <circle cx="21" cy="30" r="9" fill="${P.grn}"/><circle cx="43" cy="30" r="9" fill="${P.grn}"/>
   <circle cx="27" cy="18" r="7" fill="#6FB165"/>`),
  hua: S(`<path d="M31 52V32h3v20z" fill="${P.grn}"/>
   <path d="M33 42q8-2 10-8-9-2-10 8z" fill="${P.grn}"/>
   <g fill="${P.plum}"><ellipse cx="32" cy="16" rx="6" ry="9"/><ellipse cx="32" cy="32" rx="6" ry="9"/>
   <ellipse cx="24" cy="24" rx="9" ry="6"/><ellipse cx="40" cy="24" rx="9" ry="6"/></g>
   <circle cx="32" cy="24" r="5" fill="${P.gold}"/>`),
  yu2: S(`<path d="M14 30a12 12 0 0122-7 9 9 0 0114 7 8 8 0 01-2 16H20a10 10 0 01-6-16z" fill="${P.gy}"/>
   <g stroke="${P.blu}" stroke-width="3.4" stroke-linecap="round">
   <path d="M20 52l-3 7M32 52l-3 7M44 52l-3 7"/></g>`),
  // body
  shou: S(`<path d="M22 52V30q0-4 4-4t4 4v-8q0-4 4-4t4 4v-3q0-4 4-4t4 4v20q0 13-12 13z" fill="${P.skin}"/>
   <path d="M22 34q-6 2-6 8t8 8" fill="none" stroke="${P.skin}" stroke-width="5" stroke-linecap="round"/>`),
  yanjing: S(`<path d="M6 32q13-16 26 0-13 16-26 0z" fill="${P.wh}" stroke="${P.ink}" stroke-width="1.6" transform="translate(13)"/>
   <circle cx="32" cy="32" r="7" fill="${P.lap}"/><circle cx="32" cy="32" r="3.4" fill="${P.ink}"/>
   <circle cx="34" cy="30" r="1.6" fill="${P.wh}"/>`),
  zui: S(`<path d="M12 30q20-14 40 0-20 20-40 0z" fill="${P.red}"/>
   <path d="M12 30q20 6 40 0" fill="none" stroke="${P.red2}" stroke-width="1.6"/>
   <path d="M18 27q6-3 12 0" fill="${P.wh}" opacity=".55"/>`),
  erduo: S(`<path d="M22 14q16-8 22 6t-8 20q-6 4-4 12h-10q-4-10 2-16t2-12-4 2z" fill="${P.skin}"/>
   <path d="M32 24q6 0 6 6t-6 8" fill="none" stroke="${P.skin2}" stroke-width="2.4"/>`),
  tou: S(`<circle cx="32" cy="30" r="17" fill="${P.skin}"/>
   <path d="M15 26q4-16 17-16t17 16q-6-8-17-8t-17 8z" fill="${P.ink}"/>
   <circle cx="26" cy="30" r="2.4" fill="${P.ink}"/><circle cx="38" cy="30" r="2.4" fill="${P.ink}"/>
   <path d="M27 38q5 4 10 0" fill="none" stroke="${P.ink}" stroke-width="1.8" stroke-linecap="round"/>`),
  jiao: S(`<path d="M18 40q0-14 8-20t14 0q4 6 4 12l6 8q3 6-3 8H24q-6 0-6-8z" fill="${P.skin}"/>
   <circle cx="45" cy="42" r="2.4" fill="${P.skin2}"/><circle cx="49" cy="45" r="2" fill="${P.skin2}"/>`),
  // colors
  hong: S(`<circle cx="32" cy="32" r="19" fill="${P.red}"/><circle cx="26" cy="26" r="5" fill="#fff" opacity=".28"/>`),
  lan: S(`<circle cx="32" cy="32" r="19" fill="${P.lap}"/><circle cx="26" cy="26" r="5" fill="#fff" opacity=".28"/>`),
  lv: S(`<circle cx="32" cy="32" r="19" fill="${P.grn}"/><circle cx="26" cy="26" r="5" fill="#fff" opacity=".28"/>`),
  huang: S(`<circle cx="32" cy="32" r="19" fill="${P.gold}"/><circle cx="26" cy="26" r="5" fill="#fff" opacity=".3"/>`),
  hei: S(`<circle cx="32" cy="32" r="19" fill="${P.ink}"/><circle cx="26" cy="26" r="5" fill="#fff" opacity=".16"/>`),
  bai: S(`<circle cx="32" cy="32" r="19" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <circle cx="26" cy="26" r="5" fill="${P.cream}" opacity=".8"/>`),
  // directions
  shang: S(`<circle cx="32" cy="32" r="21" fill="${P.lap2}" opacity=".12"/>
   <path d="M32 14l14 16h-8v18h-12V30h-8z" fill="${P.lap}"/>`),
  xia: S(`<circle cx="32" cy="32" r="21" fill="${P.lap2}" opacity=".12"/>
   <path d="M32 50L18 34h8V16h12v18h8z" fill="${P.lap}"/>`),
  zuo: S(`<circle cx="32" cy="32" r="21" fill="${P.cel2}" opacity=".12"/>
   <path d="M14 32l16-14v8h18v12H30v8z" fill="${P.cel}"/>`),
  you: S(`<circle cx="32" cy="32" r="21" fill="${P.cel2}" opacity=".12"/>
   <path d="M50 32L34 46v-8H16V26h18v-8z" fill="${P.cel}"/>`),
  qianDir: S(`<circle cx="32" cy="32" r="21" fill="${P.gold2}" opacity=".12"/>
   <path d="M32 12l12 14h-6v10h-12V26h-6z" fill="${P.gold}"/>
   <ellipse cx="32" cy="46" rx="13" ry="5" fill="${P.gold}" opacity=".45"/>`),
  hou: S(`<circle cx="32" cy="32" r="21" fill="${P.gold2}" opacity=".12"/>
   <path d="M32 52L20 38h6V28h12v10h6z" fill="${P.gold}"/>
   <ellipse cx="32" cy="18" rx="13" ry="5" fill="${P.gold}" opacity=".45"/>`),
  li: S(`<rect x="12" y="16" width="40" height="34" rx="5" fill="none" stroke="${P.brn}" stroke-width="3.4"/>
   <circle cx="32" cy="33" r="8" fill="${P.red}"/>`),
  wai: S(`<rect x="12" y="16" width="40" height="34" rx="5" fill="none" stroke="${P.brn}" stroke-width="3.4"/>
   <circle cx="55" cy="14" r="8" fill="${P.red}"/>`),
  dong: S(`<circle cx="32" cy="32" r="20" fill="none" stroke="${P.gy}" stroke-width="2.4"/>
   <path d="M32 32L48 24 40 40z" fill="${P.red}"/><path d="M32 32L16 40l8-16z" fill="${P.wh}" stroke="${P.gy}" stroke-width="1"/>
   <circle cx="32" cy="32" r="3" fill="${P.ink}"/>
   <text x="52" y="36" font-size="11" fill="${P.ink}" font-family="serif">东</text>`),
  xi: S(`<circle cx="32" cy="32" r="20" fill="none" stroke="${P.gy}" stroke-width="2.4"/>
   <path d="M32 32L16 24l8 16z" fill="${P.red}"/><path d="M32 32l16 8-8-16z" fill="${P.wh}" stroke="${P.gy}" stroke-width="1"/>
   <circle cx="32" cy="32" r="3" fill="${P.ink}"/>
   <text x="2" y="36" font-size="11" fill="${P.ink}" font-family="serif">西</text>`),
  // time
  jintian: S(`<rect x="10" y="14" width="44" height="40" rx="5" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <rect x="10" y="14" width="44" height="11" rx="5" fill="${P.red}"/>
   <path d="M20 10v8M44 10v8" stroke="${P.red2}" stroke-width="3.4" stroke-linecap="round"/>
   <circle cx="32" cy="40" r="9" fill="${P.gold}"/>`),
  mingtian: S(`<rect x="10" y="14" width="44" height="40" rx="5" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <rect x="10" y="14" width="44" height="11" rx="5" fill="${P.cel}"/>
   <path d="M20 10v8M44 10v8" stroke="${P.cel2}" stroke-width="3.4" stroke-linecap="round"/>
   <path d="M24 40h16M34 34l6 6-6 6" stroke="${P.cel}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  zuotian: S(`<rect x="10" y="14" width="44" height="40" rx="5" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <rect x="10" y="14" width="44" height="11" rx="5" fill="${P.gy}"/>
   <path d="M20 10v8M44 10v8" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round"/>
   <path d="M40 40H24M30 34l-6 6 6 6" stroke="${P.gy}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  zaoshang: S(`<path d="M6 46h52" stroke="${P.gy}" stroke-width="2.4" stroke-linecap="round"/>
   <circle cx="32" cy="40" r="13" fill="${P.gold}"/>
   <g stroke="${P.gold}" stroke-width="3" stroke-linecap="round">
   <path d="M32 18v6M13 27l4 4M51 27l-4 4M6 40h5M53 40h5"/></g>`),
  wanshang: S(`<path d="M40 12a20 20 0 100 40 17 17 0 010-40z" fill="${P.lap}"/>
   <circle cx="18" cy="18" r="2.2" fill="${P.gold}"/><circle cx="14" cy="30" r="1.6" fill="${P.gold}"/>
   <circle cx="24" cy="10" r="1.6" fill="${P.gold}"/>`),
  dian: S(`<circle cx="32" cy="32" r="21" fill="${P.wh}" stroke="${P.ink}" stroke-width="2.6"/>
   <path d="M32 32V18M32 32l10 7" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>
   <circle cx="32" cy="32" r="2.6" fill="${P.red}"/>
   <g fill="${P.ink}"><circle cx="32" cy="15" r="1.4"/><circle cx="49" cy="32" r="1.4"/>
   <circle cx="32" cy="49" r="1.4"/><circle cx="15" cy="32" r="1.4"/></g>`),
  fen: S(`<circle cx="32" cy="32" r="21" fill="${P.wh}" stroke="${P.ink}" stroke-width="2.6"/>
   <path d="M32 32V16" stroke="${P.red}" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M32 32l12 4" stroke="${P.ink}" stroke-width="2.4" stroke-linecap="round"/>
   <circle cx="32" cy="32" r="2.4" fill="${P.red}"/>`),
  xingqi: S(`<rect x="8" y="16" width="48" height="36" rx="5" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <rect x="8" y="16" width="48" height="9" rx="5" fill="${P.lap}"/>
   <g fill="${P.gy}"><rect x="14" y="30" width="7" height="6" rx="1.4"/><rect x="24" y="30" width="7" height="6" rx="1.4"/>
   <rect x="34" y="30" width="7" height="6" rx="1.4"/><rect x="44" y="30" width="7" height="6" rx="1.4"/>
   <rect x="14" y="40" width="7" height="6" rx="1.4"/><rect x="24" y="40" width="7" height="6" rx="1.4"/></g>
   <rect x="34" y="40" width="7" height="6" rx="1.4" fill="${P.red}"/>`),
  xianzai: S(`<circle cx="32" cy="32" r="20" fill="none" stroke="${P.red}" stroke-width="3"/>
   <path d="M32 32V19M32 32h10" stroke="${P.red}" stroke-width="3" stroke-linecap="round"/>
   <circle cx="32" cy="32" r="3" fill="${P.red}"/>
   <path d="M50 14l6-6M56 20h7" stroke="${P.gold}" stroke-width="2.6" stroke-linecap="round"/>`),
  nian: S(`<rect x="10" y="16" width="44" height="38" rx="5" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <rect x="10" y="16" width="44" height="10" rx="5" fill="${P.gold}"/>
   <text x="32" y="46" font-size="17" text-anchor="middle" fill="${P.ink}" font-family="serif">年</text>`),
  maze: S(`<rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="${P.ink}" stroke-width="3"/>
   <path d="M8 24h20M36 8v24M20 40v16M28 40h28M44 24v8" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>
   <circle cx="16" cy="16" r="4" fill="${P.red}"/><circle cx="48" cy="48" r="4" fill="${P.cel}"/>`),
  pair: S(`<rect x="6" y="14" width="22" height="30" rx="4" fill="${P.lap}" transform="rotate(-7 17 29)"/>
   <rect x="36" y="20" width="22" height="30" rx="4" fill="${P.red}" transform="rotate(7 47 35)"/>
   <path d="M28 30h8" stroke="${P.gold}" stroke-width="3" stroke-linecap="round"/>`),
  order: S(`<rect x="8" y="10" width="14" height="14" rx="3" fill="${P.red}"/>
   <rect x="26" y="26" width="14" height="14" rx="3" fill="${P.gold}"/>
   <rect x="44" y="42" width="14" height="14" rx="3" fill="${P.cel}"/>
   <path d="M22 20l6 4M40 36l6 4" stroke="${P.gy}" stroke-width="2.4" stroke-linecap="round"/>`),
  didi: S(`${head(23, P.skin)}<path d="M32 33c-8 0-12 4-12 11v8h24v-8c0-7-4-11-12-11z" fill="${P.gold}"/>
   <path d="M25 17q7-5 14 0v3H25z" fill="${P.ink}"/>`),
  meimei: S(`${head(23, P.skin)}<path d="M32 33c-8 0-12 4-12 11v8h24v-8c0-7-4-11-12-11z" fill="${P.plum}"/>
   <path d="M23 23q0-11 9-11t9 11q-3-6-9-6t-9 6z" fill="${P.ink}"/>
   <circle cx="41" cy="19" r="2.6" fill="${P.red}"/>`),
  pengyou: S(`<circle cx="22" cy="22" r="8" fill="${P.skin}"/><circle cx="42" cy="22" r="8" fill="${P.skin}"/>
   <path d="M22 31c-7 0-11 4-11 10v11h22V41c0-6-4-10-11-10z" fill="${P.cel}"/>
   <path d="M42 31c-7 0-11 4-11 10v11h22V41c0-6-4-10-11-10z" fill="${P.lap}"/>`),
  diannao: S(`<rect x="10" y="14" width="44" height="28" rx="3" fill="${P.ink}"/>
   <rect x="13" y="17" width="38" height="22" rx="2" fill="${P.lap}"/>
   <path d="M4 46h56l-4 6H8z" fill="${P.gy}"/>`),
  dianshi: S(`<rect x="8" y="12" width="48" height="34" rx="4" fill="${P.ink}"/>
   <rect x="12" y="16" width="40" height="26" rx="2" fill="${P.cel}"/>
   <path d="M22 46l-4 8M42 46l4 8" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round"/>`),
  zhuozi: S(`<rect x="6" y="22" width="52" height="7" rx="2" fill="${P.brn}"/>
   <path d="M12 29v24M52 29v24" stroke="${P.brn}" stroke-width="5" stroke-linecap="round"/>`),
  yizi: S(`<path d="M20 8h6v30h-6z" fill="${P.brn}"/><rect x="18" y="36" width="30" height="6" rx="2" fill="${P.brn}"/>
   <path d="M22 42v14M44 42v14" stroke="${P.brn}" stroke-width="4.4" stroke-linecap="round"/>`),
  yifu: S(`<path d="M24 12l8 6 8-6 12 7-5 10-5-3v26H22V26l-5 3-5-10z" fill="${P.lap}"/>
   <path d="M32 18v34" stroke="${P.lap2}" stroke-width="1.6"/>`),
  beizi: S(`<path d="M18 16h26l-3 34H21z" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <path d="M20 28h22l-2 20H22z" fill="${P.cel}"/>
   <path d="M44 22h5a5 5 0 010 10h-5" fill="none" stroke="${P.gy}" stroke-width="2.6"/>`),
  cai: S(`<path d="M32 50q-14 0-14-14 0-8 6-12 0-8 8-8t8 8q6 4 6 12 0 14-14 14z" fill="${P.grn}"/>
   <path d="M32 20v28" stroke="#3F7A38" stroke-width="2" fill="none"/>
   <path d="M20 34q12-4 24 0" stroke="#3F7A38" stroke-width="1.8" fill="none"/>`),
  shuiguo: S(`<circle cx="24" cy="36" r="13" fill="${P.red}"/>
   <circle cx="42" cy="32" r="11" fill="${P.gold}"/>
   <path d="M24 23q0-6 4-8" stroke="${P.brn}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
   <path d="M28 15q6-2 8 3-5 3-8-3z" fill="${P.grn}"/>`),
  yiyuan: S(`<rect x="10" y="18" width="44" height="34" rx="4" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <rect x="26" y="8" width="12" height="12" rx="2" fill="${P.red}"/>
   <path d="M32 10v8M28 14h8" stroke="${P.wh}" stroke-width="2.6" stroke-linecap="round"/>
   <rect x="27" y="38" width="10" height="14" rx="1.5" fill="${P.lap}"/>
   <rect x="16" y="26" width="8" height="8" rx="1.5" fill="${P.blu}"/>
   <rect x="40" y="26" width="8" height="8" rx="1.5" fill="${P.blu}"/>`),
  shangdian: S(`<path d="M8 24h48v28H8z" fill="${P.cream}"/>
   <path d="M6 14h52l-4 10H10z" fill="${P.red}"/>
   <path d="M14 14v10M24 14v10M34 14v10M44 14v10" stroke="${P.wh}" stroke-width="1.8" opacity=".7"/>
   <rect x="24" y="34" width="16" height="18" rx="2" fill="${P.brn}"/>`),
  xuexiao: S(`<path d="M32 8L56 22v30H8V22z" fill="${P.cream}"/>
   <path d="M32 6L60 22H4z" fill="${P.lap}"/>
   <rect x="26" y="36" width="12" height="16" rx="1.5" fill="${P.brn}"/>
   <rect x="14" y="28" width="9" height="9" rx="1.5" fill="${P.blu}"/>
   <rect x="41" y="28" width="9" height="9" rx="1.5" fill="${P.blu}"/>
   <path d="M32 6V0" stroke="${P.gy}" stroke-width="2"/><path d="M32 1h9v6h-9z" fill="${P.red}"/>`),
  huoche: S(`<rect x="8" y="20" width="30" height="24" rx="4" fill="${P.lap}"/>
   <rect x="12" y="25" width="9" height="9" rx="1.5" fill="${P.blu}"/>
   <rect x="25" y="25" width="9" height="9" rx="1.5" fill="${P.blu}"/>
   <rect x="40" y="26" width="16" height="18" rx="3" fill="${P.red}"/>
   <circle cx="17" cy="48" r="5" fill="${P.ink}"/><circle cx="31" cy="48" r="5" fill="${P.ink}"/>
   <circle cx="48" cy="48" r="5" fill="${P.ink}"/>`),
  feiji: S(`<path d="M6 34l52-12-8 14 8 14-52-12z" fill="${P.lap}"/>
   <path d="M28 30l-8-14h6l12 12z" fill="${P.blu}"/>
   <path d="M28 38l-8 14h6l12-12z" fill="${P.blu}"/>`),
  laoshi2: S(`<rect x="6" y="10" width="40" height="28" rx="3" fill="${P.cel2}"/>
   <rect x="9" y="13" width="34" height="22" rx="2" fill="#2E5A50"/>
   ${head(24, P.skin).replace('cx="32"', 'cx="50"').replace('r="9"', 'r="7"')}
   <path d="M50 32c-6 0-9 4-9 10v10h18V42c0-6-3-10-9-10z" fill="${P.red}"/>`),
  xuesheng2: S(`${head(20, P.skin)}<path d="M32 30c-9 0-14 5-14 13v9h28v-9c0-8-5-13-14-13z" fill="${P.lap}"/>
   <path d="M32 6L52 14 32 22 12 14z" fill="${P.ink}"/><path d="M32 22v6" stroke="${P.ink}" stroke-width="2"/>
   <rect x="26" y="36" width="12" height="16" rx="2" fill="${P.gold}"/>`),
  zi: S(`<rect x="10" y="10" width="44" height="44" rx="4" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.6"/>
   <path d="M32 10v44M10 32h44" stroke="#E3DACA" stroke-width="1"/>
   <text x="32" y="42" font-size="26" text-anchor="middle" fill="${P.ink}" font-family="serif">字</text>`),
  zhongguo: S(`<rect x="8" y="16" width="48" height="32" rx="2" fill="${P.red}"/>
   <path d="M18 24l2 5 5 .4-4 3.4 1.4 5-4.4-3-4.4 3 1.4-5-4-3.4 5-.4z" fill="${P.gold}"/>
   <circle cx="30" cy="22" r="2" fill="${P.gold}"/><circle cx="34" cy="27" r="2" fill="${P.gold}"/>
   <circle cx="34" cy="34" r="2" fill="${P.gold}"/><circle cx="30" cy="39" r="2" fill="${P.gold}"/>`),
  gaoxing: S(`<circle cx="32" cy="32" r="21" fill="${P.gold}"/>
   <circle cx="24" cy="27" r="2.8" fill="${P.ink}"/><circle cx="40" cy="27" r="2.8" fill="${P.ink}"/>
   <path d="M22 37q10 10 20 0" fill="none" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`),
  leng: S(`<path d="M32 8v48M12 20l40 24M52 20L12 44" stroke="${P.blu}" stroke-width="3.4" stroke-linecap="round"/>
   <circle cx="32" cy="32" r="4" fill="${P.lap}"/>`),
  re: S(`<path d="M32 8q10 12 10 20a10 10 0 01-20 0c0-8 10-20 10-20z" fill="${P.red}"/>
   <path d="M32 22q4 6 4 9a4 4 0 01-8 0c0-3 4-9 4-9z" fill="${P.gold}"/>
   <path d="M18 48q6-4 14 0t14 0" stroke="${P.red}" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  kan: S(`<path d="M6 32q13-16 26 0-13 16-26 0z" fill="${P.wh}" stroke="${P.ink}" stroke-width="1.6" transform="translate(13)"/>
   <circle cx="32" cy="32" r="7" fill="${P.cel}"/><circle cx="32" cy="32" r="3.4" fill="${P.ink}"/>`),
  // ui icons — not vocabulary illustrations
  target: S(`<circle cx="32" cy="32" r="20" fill="none" stroke="${P.red}" stroke-width="4"/>
   <circle cx="32" cy="32" r="11" fill="none" stroke="${P.red}" stroke-width="4"/>
   <circle cx="32" cy="32" r="3.4" fill="${P.red}"/>`),
  kiteIcon: S(`<path d="M32 8L52 30 32 56 12 30z" fill="${P.cel}"/>
   <path d="M32 8v48M12 30h40" stroke="${P.cel2}" stroke-width="1.6"/>`),
  cards: S(`<rect x="8" y="18" width="20" height="30" rx="3" fill="${P.lap}" transform="rotate(-9 18 33)"/>
   <rect x="22" y="14" width="20" height="30" rx="3" fill="${P.gold}"/>
   <rect x="38" y="18" width="20" height="30" rx="3" fill="${P.red}" transform="rotate(9 48 33)"/>`),
  brain: S(`<path d="M26 12q-12 0-12 10 0 4 3 6-3 3-3 7t4 6q0 8 9 8h5V12z" fill="${P.plum}"/>
   <path d="M38 12q12 0 12 10 0 4-3 6 3 3 3 7t-4 6q0 8-9 8h-5V12z" fill="#B9709A"/>`),
  sky: S(`<circle cx="46" cy="18" r="8" fill="${P.gold}"/>
   <path d="M10 42q0-9 9-9 2-8 11-8t11 8q9 0 9 9z" fill="${P.wh}"/>
   <path d="M6 50h52" stroke="${P.cel}" stroke-width="3" stroke-linecap="round"/>`),
  chart: S(`<rect x="10" y="34" width="10" height="20" rx="2" fill="${P.cel}"/>
   <rect x="27" y="22" width="10" height="32" rx="2" fill="${P.gold}"/>
   <rect x="44" y="12" width="10" height="42" rx="2" fill="${P.red}"/>`),
  trophy: S(`<path d="M20 10h24v14q0 12-12 12t-12-12z" fill="${P.gold}"/>
   <path d="M20 14h-7q0 10 8 12M44 14h7q0 10-8 12" fill="none" stroke="${P.gold2}" stroke-width="3"/>
   <path d="M28 36h8v10h-8z" fill="${P.gold2}"/><rect x="20" y="46" width="24" height="6" rx="2" fill="${P.gold2}"/>`),
  sound: S(`<path d="M12 26h9l11-9v30l-11-9h-9z" fill="${P.lap}"/>
   <path d="M40 24q5 8 0 16M46 19q9 13 0 26" fill="none" stroke="${P.lap}" stroke-width="3" stroke-linecap="round"/>`),
  phone2: S(`<rect x="18" y="6" width="28" height="52" rx="6" fill="${P.ink}"/>
   <rect x="22" y="13" width="20" height="36" rx="2" fill="${P.cel}"/>`),
};

export const AVA = {
  fox: S(`<path d="M14 18l4 12M50 18l-4 12" stroke="${P.gold}" stroke-width="8" stroke-linecap="round"/>
   <path d="M32 16c-12 0-18 9-18 18s8 16 18 16 18-6 18-16-6-18-18-18z" fill="${P.gold}"/>
   <path d="M32 34c-6 0-9 4-9 8s4 8 9 8 9-4 9-8-3-8-9-8z" fill="${P.wh}"/>
   <circle cx="25" cy="31" r="2.4" fill="${P.ink}"/><circle cx="39" cy="31" r="2.4" fill="${P.ink}"/>
   <path d="M32 40l-2.5 2.5h5z" fill="${P.ink}"/>`),
  panda: S(`<circle cx="17" cy="18" r="7" fill="${P.ink}"/><circle cx="47" cy="18" r="7" fill="${P.ink}"/>
   <circle cx="32" cy="34" r="18" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.2"/>
   <ellipse cx="25" cy="32" rx="5" ry="6" fill="${P.ink}"/><ellipse cx="39" cy="32" rx="5" ry="6" fill="${P.ink}"/>
   <circle cx="25" cy="32" r="2" fill="${P.wh}"/><circle cx="39" cy="32" r="2" fill="${P.wh}"/>
   <ellipse cx="32" cy="42" rx="3.4" ry="2.6" fill="${P.ink}"/>`),
  tiger: S(`<circle cx="18" cy="19" r="6" fill="${P.gold2}"/><circle cx="46" cy="19" r="6" fill="${P.gold2}"/>
   <circle cx="32" cy="34" r="18" fill="${P.gold}"/>
   <path d="M24 20l2 7M32 18v8M40 20l-2 7" stroke="${P.ink}" stroke-width="2.4" stroke-linecap="round"/>
   <circle cx="25" cy="32" r="2.4" fill="${P.ink}"/><circle cx="39" cy="32" r="2.4" fill="${P.ink}"/>
   <path d="M32 39l-3 3h6z" fill="${P.ink}"/>`),
  owl: S(`<path d="M32 12c-12 0-18 10-18 21s8 17 18 17 18-6 18-17-6-21-18-21z" fill="${P.brn}"/>
   <circle cx="24" cy="30" r="8" fill="${P.wh}"/><circle cx="40" cy="30" r="8" fill="${P.wh}"/>
   <circle cx="24" cy="30" r="4" fill="${P.ink}"/><circle cx="40" cy="30" r="4" fill="${P.ink}"/>
   <path d="M32 36l-4 5h8z" fill="${P.gold}"/>
   <path d="M14 16l6 6M50 16l-6 6" stroke="${P.brn}" stroke-width="5" stroke-linecap="round"/>`),
  rabbit: S(`<ellipse cx="22" cy="14" rx="5" ry="12" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.2"/>
   <ellipse cx="42" cy="14" rx="5" ry="12" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.2"/>
   <ellipse cx="22" cy="14" rx="2.4" ry="7" fill="${P.plum}" opacity=".45"/>
   <ellipse cx="42" cy="14" rx="2.4" ry="7" fill="${P.plum}" opacity=".45"/>
   <circle cx="32" cy="38" r="16" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.2"/>
   <circle cx="26" cy="36" r="2.4" fill="${P.ink}"/><circle cx="38" cy="36" r="2.4" fill="${P.ink}"/>
   <path d="M32 42l-2.5 2.5h5z" fill="${P.plum}"/>`),
  bear: S(`<circle cx="17" cy="20" r="7" fill="${P.brn}"/><circle cx="47" cy="20" r="7" fill="${P.brn}"/>
   <circle cx="32" cy="35" r="18" fill="${P.brn}"/>
   <ellipse cx="32" cy="42" rx="10" ry="8" fill="${P.cream}"/>
   <circle cx="26" cy="31" r="2.4" fill="${P.ink}"/><circle cx="38" cy="31" r="2.4" fill="${P.ink}"/>
   <ellipse cx="32" cy="40" rx="3.4" ry="2.6" fill="${P.ink}"/>`),
  cat2: S(`<path d="M16 24l-2-11 11 6zM48 24l2-11-11 6z" fill="${P.gy}"/>
   <circle cx="32" cy="35" r="17" fill="${P.gy}"/>
   <circle cx="26" cy="32" r="2.4" fill="${P.ink}"/><circle cx="38" cy="32" r="2.4" fill="${P.ink}"/>
   <path d="M32 39l-2.5 2.5h5z" fill="${P.plum}"/>
   <path d="M15 36H8M15 40H8M49 36h7M49 40h7" stroke="${P.ink}" stroke-width="1.2" stroke-linecap="round"/>`),
  crane: S(`<path d="M30 52q-12-4-12-16t12-14q10-2 14 6" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.4"/>
   <circle cx="45" cy="20" r="7" fill="${P.wh}" stroke="${P.gy}" stroke-width="1.4"/>
   <path d="M45 13q0-5 3-6" stroke="${P.red}" stroke-width="3" stroke-linecap="round"/>
   <circle cx="47" cy="19" r="1.8" fill="${P.ink}"/>
   <path d="M52 22l8 3-8 3z" fill="${P.gold}"/>
   <path d="M22 30q10 6 12 14" stroke="${P.ink}" stroke-width="1.4" fill="none" opacity=".3"/>`),
};

export const AVATAR_KEYS = ["fox", "panda", "tiger", "owl", "rabbit", "bear", "cat2", "crane"];

// keys in ART that are UI chrome, not word illustrations — excluded from the vocab gallery
const UI_ICON_KEYS = new Set([
  "target",
  "kiteIcon",
  "cards",
  "brain",
  "sky",
  "chart",
  "trophy",
  "sound",
  "phone2",
  "maze",
  "pair",
  "order",
]);

export const VOCAB_ICON_KEYS = Object.keys(ART).filter((k) => !UI_ICON_KEYS.has(k));

/** category id -> {c, cl} css var names, matches the light backdrop behind each illustration */
export const CATEGORY_COLORS = {
  greet: { c: "var(--verm)", cl: "var(--verm-l)" },
  person: { c: "var(--plum)", cl: "var(--plum-l)" },
  fam: { c: "var(--plum)", cl: "var(--plum-l)" },
  num: { c: "var(--gold)", cl: "var(--gold-l)" },
  food: { c: "var(--gold)", cl: "var(--gold-l)" },
  animal: { c: "var(--cel)", cl: "var(--cel-l)" },
  obj: { c: "var(--lapis)", cl: "var(--lapis-l)" },
  place: { c: "var(--lapis)", cl: "var(--lapis-l)" },
  nature: { c: "var(--cel)", cl: "var(--cel-l)" },
  body: { c: "var(--plum)", cl: "var(--plum-l)" },
  color: { c: "var(--gold)", cl: "var(--shell)" },
  verb: { c: "var(--verm)", cl: "var(--verm-l)" },
  adj: { c: "var(--verm)", cl: "var(--verm-l)" },
  dir: { c: "var(--lapis)", cl: "var(--lapis-l)" },
  time: { c: "var(--verm)", cl: "var(--verm-l)" },
  q: { c: "var(--cel)", cl: "var(--cel-l)" },
};

export function vocabImageSrc(key) {
  return `/img/vocab/${key}.webp`;
}

export function hasSvgArt(key) {
  return Boolean(key && ART[key]);
}
