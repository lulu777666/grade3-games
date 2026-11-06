// ============================================================
//  原创卡通公主「小樱」：用 SVG 画，可以换 头饰 / 公主裙 / 鞋子
//  等级外观：1级 樱花瓣飘飘  2级 小宝剑  3级 仙子翅膀  4级 金色光环
// ============================================================
const HATS = [
  { id: 'bow', n: '粉色蝴蝶结', p: 25 },
  { id: 'hairpin', n: '樱花发卡', p: 30 },
  { id: 'flower', n: '彩色花环', p: 35 },
  { id: 'crown', n: '公主王冠', p: 50 },
]
const DRESSES = [
  { id: 'd_pink', n: '粉色樱花裙', p: 25, c: '#ff9cc2', d: '#ff6fa5', pat: 'asanoha' },
  { id: 'd_blue', n: '蓝色海浪裙', p: 30, c: '#8ccfff', d: '#4fa8ef', pat: 'seigaiha' },
  { id: 'd_purple', n: '紫色星星裙', p: 35, c: '#c3a2ff', d: '#9467f0', pat: 'kikko' },
  { id: 'd_gold', n: '金色舞会裙', p: 50, c: '#ffd866', d: '#f0a800', pat: 'uroko' },
]
const SHOES = [
  { id: 's_pink', n: '粉色小皮鞋', p: 25 },
  { id: 's_boot', n: '蓝色小靴子', p: 30 },
  { id: 's_red', n: '红色舞鞋', p: 35 },
  { id: 's_glass', n: '水晶鞋', p: 50 },
]
// 每类 25+30+35+50 = 140，三类一共 420

function princessSvg(o = {}, size = 100, crop) {
  const lv = o.lv || 0, hat = o.hat || '', shoes = o.shoes || ''
  const dr = DRESSES.find(d => d.id === o.dress) || { c: '#f6f6fb', d: '#c9cde0', id: '' }
  const skin = '#ffe2cf', hair = '#4a2f4f', vb = crop === 'head' ? '18 0 84 80' : crop === 'feet' ? '38 118 44 26' : '0 0 120 150'
  let s = `<svg class="princess" viewBox="${vb}" width="${size}" height="${crop === 'feet' ? size * 0.6 : crop ? size * 0.95 : size * 1.25}" xmlns="http://www.w3.org/2000/svg">`
  // ---- 等级外观（在身后） ----
  if (lv >= 4) s += `<defs><radialGradient id="pAura"><stop offset="0" stop-color="#fff6c2"/><stop offset=".6" stop-color="#ffe066" stop-opacity=".55"/><stop offset="1" stop-color="#ffd000" stop-opacity="0"/></radialGradient></defs><circle cx="60" cy="72" r="62" fill="url(#pAura)" class="p-aura"/>`
  if (lv >= 3) s += `<g class="p-wing" fill="#d9f1ff" stroke="#9fd5ff" stroke-width="1.5" opacity=".9"><path d="M52 80 Q18 50 14 78 Q16 100 50 92Z"/><path d="M68 80 Q102 50 106 78 Q104 100 70 92Z"/><path d="M50 92 Q24 104 30 118 Q42 116 52 98Z"/><path d="M70 92 Q96 104 90 118 Q78 116 68 98Z"/></g>`
  // ---- 后面的长头发 ----
  s += `<path d="M34 46 Q26 96 40 104 L80 104 Q94 96 86 46Z" fill="${hair}"/>`
  // ---- 腿和鞋 ----
  s += `<rect x="50" y="118" width="7" height="18" rx="3" fill="${skin}"/><rect x="63" y="118" width="7" height="18" rx="3" fill="${skin}"/>`
  s += shoeSvg(shoes)
  // ---- 裙子 ----
  s += `<path d="M47 88 L26 126 Q60 136 94 126 L73 88Z" fill="${dr.c}" stroke="${dr.d}" stroke-width="1.5"/>`
  if (dr.id === 'd_gold') s += `<path d="M44 100 L32 124 Q60 132 88 124 L76 100 Q60 106 44 100Z" fill="#fff0b3" stroke="${dr.d}" stroke-width="1"/>`
  s += `<path d="M26 126 Q30 121 34 126 Q38 121 42 126 Q46 121 50 126 Q54 121 58 126 Q62 121 66 126 Q70 121 74 126 Q78 121 82 126 Q86 121 90 126 Q92 123 94 126" fill="none" stroke="${dr.id ? dr.d : '#c9cde0'}" stroke-width="2"/>`
  s += dressDeco(dr.id)
  s += `<path d="M48 70 Q60 66 72 70 L74 92 Q60 96 46 92Z" fill="${dr.c}" stroke="${dr.d}" stroke-width="1.5"/>`
  s += `<path d="M46 90 Q60 95 74 90" stroke="${dr.id ? dr.d : '#ff9cc2'}" stroke-width="3" fill="none"/>`
  if (dr.id) s += `<circle cx="60" cy="78" r="3" fill="#fff" stroke="${dr.d}"/>`
  // ---- 手臂 ----
  s += `<path d="M49 74 Q38 88 41 100" stroke="${skin}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M71 74 Q82 88 79 100" stroke="${skin}" stroke-width="6" fill="none" stroke-linecap="round"/>`
  s += `<circle cx="48" cy="73" r="6.5" fill="${dr.c}" stroke="${dr.d}" stroke-width="1.2"/><circle cx="72" cy="73" r="6.5" fill="${dr.c}" stroke="${dr.d}" stroke-width="1.2"/>`
  if (lv >= 2) s += `<g class="p-sword"><path d="M80 99 L95 70" stroke="#e8eef8" stroke-width="3.5" stroke-linecap="round"/><path d="M80 99 L95 70" stroke="#9fb0c8" stroke-width="1"/><path d="M75 96 L85 101" stroke="#ff6fa5" stroke-width="3" stroke-linecap="round"/><circle cx="78" cy="102" r="2.2" fill="#ffd34d"/></g>`
  // ---- 头 ----
  s += `<rect x="56" y="62" width="8" height="10" fill="${skin}"/><circle cx="60" cy="46" r="22" fill="${skin}"/>`
  s += `<ellipse cx="52" cy="49" rx="3" ry="4.2" fill="#2b1d33"/><ellipse cx="68" cy="49" rx="3" ry="4.2" fill="#2b1d33"/><circle cx="53.2" cy="47.3" r="1.3" fill="#fff"/><circle cx="69.2" cy="47.3" r="1.3" fill="#fff"/>`
  s += `<ellipse cx="46.5" cy="55.5" rx="3.6" ry="2.1" fill="#ff9fb2" opacity=".75"/><ellipse cx="73.5" cy="55.5" rx="3.6" ry="2.1" fill="#ff9fb2" opacity=".75"/>`
  s += `<path d="M56 57 Q60 61.5 64 57" stroke="#c0436b" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
  // ---- 前面的刘海 ----
  s += `<path d="M37 47 Q35 22 60 22 Q85 22 83 47 Q78 34 70 32 Q66 39 60 35 Q54 39 50 32 Q42 34 37 47Z" fill="${hair}"/>`
  s += `<path d="M38 44 Q33 62 37 76 L42 74 Q39 60 41 47Z" fill="${hair}"/><path d="M82 44 Q87 62 83 76 L78 74 Q81 60 79 47Z" fill="${hair}"/>`
  s += hatSvg(hat)
  // ---- 1级：樱花瓣 ----
  if (lv >= 1) s += `<g class="p-petals" fill="#ffb3cc">${[[14, 30], [104, 40], [20, 112], [100, 120], [96, 14]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="2" transform="rotate(${i * 40} ${x} ${y})"/>`).join('')}</g>`
  if (lv >= 4) s += `<g fill="#ffe066">${[[16, 60], [104, 66], [60, 4]].map(([x, y]) => `<path d="M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5}Z"/>`).join('')}</g>`
  return s + '</svg>'
}
function dressDeco(id) {
  const pts = [[44, 108], [60, 112], [76, 108], [38, 120], [52, 122], [68, 122], [82, 120], [60, 100]]
  if (id === 'd_pink') return pts.map(([x, y]) => `<g fill="#fff" opacity=".9">${[0, 72, 144, 216, 288].map(a => `<circle cx="${x + 2.2 * Math.cos(a * Math.PI / 180)}" cy="${y + 2.2 * Math.sin(a * Math.PI / 180)}" r="1.6"/>`).join('')}<circle cx="${x}" cy="${y}" r="1" fill="#ffd34d"/></g>`).join('')
  if (id === 'd_blue') return `<path d="M36 112 Q42 107 48 112 Q54 117 60 112 Q66 107 72 112 Q78 117 84 112" stroke="#fff" stroke-width="2" fill="none"/><path d="M40 102 Q46 97 52 102 Q58 107 64 102 Q70 97 76 102 Q80 105 80 102" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/>`
  if (id === 'd_purple') return pts.map(([x, y]) => `<path d="M${x} ${y - 3} L${x + 1} ${y - 1} L${x + 3} ${y} L${x + 1} ${y + 1} L${x} ${y + 3} L${x - 1} ${y + 1} L${x - 3} ${y} L${x - 1} ${y - 1}Z" fill="#fff59a"/>`).join('')
  if (id === 'd_gold') return `<circle cx="60" cy="78" r="4" fill="#ff5c8a" stroke="#fff" stroke-width="1"/>` + [[40, 118], [60, 120], [80, 118]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join('')
  return ''
}
function shoeSvg(id) {
  if (id === 's_pink') return `<ellipse cx="53" cy="137" rx="6.5" ry="3.6" fill="#ff7fae"/><ellipse cx="67" cy="137" rx="6.5" ry="3.6" fill="#ff7fae"/><circle cx="55" cy="135" r="1.6" fill="#fff"/><circle cx="69" cy="135" r="1.6" fill="#fff"/>`
  if (id === 's_boot') return `<path d="M49 124 h9 v12 q0 4 -4 4 h-7 q-3 0 -2 -3 l4 -1Z" fill="#4fa8ef"/><path d="M62 124 h9 v12 l4 1 q1 3 -2 3 h-7 q-4 0 -4 -4Z" fill="#4fa8ef"/><path d="M49 126 h9 M62 126 h9" stroke="#fff" stroke-width="2"/>`
  if (id === 's_red') return `<path d="M50 128 L57 132 M57 128 L50 132 M63 128 L70 132 M70 128 L63 132" stroke="#e8505b" stroke-width="1.3"/><ellipse cx="53" cy="137" rx="6" ry="3.4" fill="#e8505b"/><ellipse cx="67" cy="137" rx="6" ry="3.4" fill="#e8505b"/>`
  if (id === 's_glass') return `<ellipse cx="53" cy="137" rx="6.5" ry="3.6" fill="#d6f3ff" stroke="#7fd0ff" stroke-width="1.2" opacity=".95"/><ellipse cx="67" cy="137" rx="6.5" ry="3.6" fill="#d6f3ff" stroke="#7fd0ff" stroke-width="1.2" opacity=".95"/><path d="M51 136 l2 -1.5 M65 136 l2 -1.5" stroke="#fff" stroke-width="1.4"/><path d="M76 132 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1z" fill="#9fe3ff"/>`
  return `<ellipse cx="53" cy="137" rx="6" ry="3.3" fill="#8a6650"/><ellipse cx="67" cy="137" rx="6" ry="3.3" fill="#8a6650"/>`
}
function hatSvg(id) {
  if (id === 'bow') return `<g transform="translate(77 27)"><path d="M0 0 L-11 -7 L-11 7Z" fill="#ff6fa5"/><path d="M0 0 L11 -7 L11 7Z" fill="#ff6fa5"/><circle r="3.2" fill="#ff3d86"/></g>`
  if (id === 'hairpin') return `<g transform="translate(78 30)">${[0, 72, 144, 216, 288].map(a => `<circle cx="${4.2 * Math.cos((a - 90) * Math.PI / 180)}" cy="${4.2 * Math.sin((a - 90) * Math.PI / 180)}" r="3.6" fill="#ffb3cc" stroke="#ff7fae" stroke-width=".8"/>`).join('')}<circle r="2" fill="#ffd34d"/></g>`
  if (id === 'flower') return `<path d="M38 34 Q60 18 82 34" stroke="#5cb85c" stroke-width="2.5" fill="none"/>` + [[39, 33, '#ff7fae'], [46, 27, '#ffd34d'], [53, 24, '#8ccfff'], [60, 23, '#ff6f6f'], [67, 24, '#c3a2ff'], [74, 27, '#ffd34d'], [81, 33, '#ff7fae']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`).join('')
  if (id === 'crown') return `<path d="M45 27 L47 11 L54 19 L60 6 L66 19 L73 11 L75 27Z" fill="#ffd34d" stroke="#e0a800" stroke-width="1.2" stroke-linejoin="round"/><circle cx="60" cy="20" r="2.6" fill="#ff5c8a"/><circle cx="51" cy="23" r="1.6" fill="#7fd0ff"/><circle cx="69" cy="23" r="1.6" fill="#7fd0ff"/>`
  return ''
}
