// ============================================================
//  三年级上册数学 · 题库和出题器（人教版）
//  每个单元分「中等题 mid」和「难题 hard」两组出题函数，每次调用随机出一道新题。
//  一关 10 题 = 7 道中等 + 3 道难题；小测验 19 题 = 14 道中等(5分) + 5 道难题(6分) = 100分
//
//  题型 type：
//   choice   选择题          options 选项，answer 正确答案
//   input    填数（数字键盘） answer 数字
//   vertical 竖式计算         a, b, op, answer
//   clock    拨钟（拖动指针） h, m
//   shade    涂色（点格子）   shape, n, k
//   order    排序（依次点）   items(从小到大的正确顺序), shown(打乱后显示)
//   match    连线配对         pairs[[左,右]...], right(打乱后的右边)
//   pop      戳气球           items[{t, ok}]
//  每道题都有 tip：答错时显示的详细讲解（\n 是换行）
//  分数写成 3/8，页面会自动显示成上下分数。
// ============================================================

const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = arr => arr[R(0, arr.length - 1)]
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}
const NAMES = ['小明', '小红', '小刚', '小丽', '乐乐', '豆豆', '笑笑', '天天', '薇薇']
const uniq = arr => arr.filter((x, i) => arr.indexOf(x) === i)

// 选项去重并补足 4 个
function opts4(ans, cands, more) {
  const set = [String(ans)]
  const bad = x => /^0\/|\/0$|\/1$|^-|^0$|NaN|undefined/.test(x)
  for (const c of cands) { const x = String(c); if (set.length < 4 && !set.includes(x) && !bad(x)) set.push(x) }
  let g = 0
  while (set.length < 4 && g++ < 80) { const x = String(more()); if (!set.includes(x) && !bad(x)) set.push(x) }
  return set
}

// ---------------- 题目构造 ----------------
const choice = (diff, q, ans, options, tip, fig, keep) => ({ diff, type: 'choice', q, answer: String(ans), options: options.map(String), tip, fig, keep: !!keep })
const input = (diff, q, ans, tip, fig, unit) => ({ diff, type: 'input', q, answer: String(ans), tip, fig, unit })
const cmpQ = (diff, q, a, b, tip) => choice(diff, q, a > b ? '>' : a < b ? '<' : '=', ['>', '<', '='], tip, null, true)
function vertical(diff, a, b, op, tip) {
  const ans = op === '+' ? a + b : op === '-' ? a - b : a * b
  const sym = op === '-' ? '−' : op === '*' ? '×' : '+'
  return { diff, type: 'vertical', q: `用竖式计算：${a} ${sym} ${b} = ？`, a, b, op, answer: String(ans), tip: tip || (op === '+' ? addSteps(a, b) : op === '-' ? subSteps(a, b) : mulSteps(a, b)) }
}
const clockQ = (diff, h, m, tip) => ({ diff, type: 'clock', q: `拨一拨：把钟面拨到 ${hm(h, m)}`, h, m, answer: hm(h, m), tip })
const shadeQ = (diff, q, shape, n, k, tip) => ({ diff, type: 'shade', q, shape, n, k, answer: `${k}/${n}`, answerText: `涂 ${k} 份（共 ${n} 份）`, tip })
const orderQ = (diff, q, items, tip, desc) => ({ diff, type: 'order', q, items, shown: shuffle(items), answer: items.join(desc ? ' > ' : ' < '), tip })
function matchQ(diff, q, pairs, tip) {
  return { diff, type: 'match', q, pairs, right: shuffle(pairs.map(p => p[1])), answer: pairs.map(p => `${p[0]} → ${p[1]}`).join('；'), tip }
}
const popQ = (diff, q, items, tip) => ({ diff, type: 'pop', q, items: shuffle(items), answer: items.filter(i => i.ok).map(i => i.t).join('、'), tip })

// ---------------- 竖式步骤讲解 ----------------
const PLACES = ['个位', '十位', '百位', '千位', '万位']
const digs = n => String(n).split('').reverse().map(Number)
function addSteps(a, b) {
  const A = digs(a), B = digs(b), L = Math.max(A.length, B.length), out = ['相同数位对齐，从个位加起：']
  let c = 0
  for (let i = 0; i < L; i++) {
    const x = A[i] || 0, y = B[i] || 0, s = x + y + c
    out.push(`${PLACES[i]}：${x} + ${y}${c ? ' + 1（进上来的）' : ''} = ${s}，${s >= 10 ? `写 ${s % 10}，向${PLACES[i + 1]}进 1` : `写 ${s}`}`)
    c = s >= 10 ? 1 : 0
  }
  if (c) out.push(`最后进上来的 1 写在${PLACES[L]}`)
  out.push(`所以 ${a} + ${b} = ${a + b}`)
  out.push('⚠️ 易错：进位的 1 一定要加上！')
  return out.join('\n')
}
function subSteps(a, b) {
  const A = digs(a), B = digs(b), out = ['相同数位对齐，从个位减起：']
  let br = 0
  for (let i = 0; i < A.length; i++) {
    const x = A[i], y = B[i] || 0
    let cur = x - br, t = `${PLACES[i]}：`, nb = 0
    if (br && x === 0) { t += `0 被借走了 1，不够，再向${PLACES[i + 1]}借 1 当 10，10 − 1 = 9；`; cur = 9; nb = 1 }
    else if (br) t += `${x} 被借走 1，还剩 ${cur}；`
    if (cur < y) { t += `${cur} 不够减 ${y}，向${PLACES[i + 1]}借 1 当 10，${cur + 10} − ${y} = ${cur + 10 - y}`; nb = 1 }
    else t += `${cur} − ${y} = ${cur - y}`
    if (i === A.length - 1 && cur - y === 0 && i > 0 && !(cur < y)) t += '（最高位是 0，不用写）'
    out.push(t)
    br = nb
  }
  out.push(`所以 ${a} − ${b} = ${a - b}`)
  out.push('⚠️ 易错：借了位，前一位要记得减 1；遇到 0 不够借，要继续向前借。')
  return out.join('\n')
}
function mulSteps(a, k) {
  const A = digs(a), out = [`用 ${k} 去乘 ${a} 的每一位，从个位乘起：`]
  let c = 0
  for (let i = 0; i < A.length; i++) {
    const p = A[i] * k + c
    out.push(`${PLACES[i]}：${A[i]} × ${k}${c ? ` + ${c}（进上来的）` : ''} = ${p}，${p >= 10 ? `写 ${p % 10}，向${PLACES[i + 1]}进 ${Math.floor(p / 10)}` : `写 ${p}`}`)
    c = Math.floor(p / 10)
  }
  if (c) out.push(`最后进上来的 ${c} 写在最前面`)
  out.push(`所以 ${a} × ${k} = ${a * k}`)
  out.push('⚠️ 易错：先乘，再加上进上来的数；因数中间有 0 时，0 乘任何数都得 0，但别忘了加进位。')
  return out.join('\n')
}

// ---------------- 画图 ----------------
function clockSvg(h, m, id) {
  let s = `<svg viewBox="0 0 200 200" class="fig clock" ${id ? `id="${id}"` : ''}><circle cx="100" cy="100" r="92" fill="#fff" stroke="#4a5bd4" stroke-width="6"/>`
  for (let i = 0; i < 60; i++) {
    const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = big ? 76 : 82
    s += `<line x1="${(100 + r1 * Math.sin(a)).toFixed(1)}" y1="${(100 - r1 * Math.cos(a)).toFixed(1)}" x2="${(100 + 86 * Math.sin(a)).toFixed(1)}" y2="${(100 - 86 * Math.cos(a)).toFixed(1)}" stroke="#555" stroke-width="${big ? 3 : 1}"/>`
  }
  for (let n = 1; n <= 12; n++) {
    const a = n * 30 * Math.PI / 180
    s += `<text x="${(100 + 62 * Math.sin(a)).toFixed(1)}" y="${(100 - 62 * Math.cos(a) + 7).toFixed(1)}" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">${n}</text>`
  }
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6
  s += `<line class="hand-h" x1="100" y1="100" x2="100" y2="56" stroke="#e8505b" stroke-width="9" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>`
  s += `<line class="hand-m" x1="100" y1="100" x2="100" y2="26" stroke="#333" stroke-width="5" stroke-linecap="round" transform="rotate(${ma} 100 100)"/>`
  return s + '<circle cx="100" cy="100" r="7" fill="#333"/></svg>'
}
// 可涂色的图形：返回每一份的 svg 元素（带 data-i）
function shapeParts(shape, n) {
  const parts = []
  if (shape === 'pie') {
    for (let i = 0; i < n; i++) {
      const a1 = i / n * 2 * Math.PI, a2 = (i + 1) / n * 2 * Math.PI
      const p = (a, r = 88) => `${(100 + r * Math.sin(a)).toFixed(1)} ${(100 - r * Math.cos(a)).toFixed(1)}`
      parts.push(`<path data-i="${i}" d="M100 100 L${p(a1)} A88 88 0 0 1 ${p(a2)} Z"/>`)
    }
    return `<svg viewBox="0 0 200 200" class="fig shade">${parts.join('')}</svg>`
  }
  if (shape === 'grid') { // 2 行
    const cols = n / 2, w = 260 / cols
    for (let i = 0; i < n; i++) parts.push(`<rect data-i="${i}" x="${20 + (i % cols) * w}" y="${10 + Math.floor(i / cols) * 70}" width="${w}" height="70"/>`)
    return `<svg viewBox="0 0 300 160" class="fig wide shade">${parts.join('')}</svg>`
  }
  const w = 280 / n
  for (let i = 0; i < n; i++) parts.push(`<rect data-i="${i}" x="${10 + i * w}" y="15" width="${w}" height="80"/>`)
  return `<svg viewBox="0 0 300 110" class="fig wide shade">${parts.join('')}</svg>`
}
function shadedFig(shape, n, k) { // 已经涂好的图（看图题用）
  return shapeParts(shape, n).replace(/data-i="(\d+)"/g, (m0, i) => `${m0} class="${+i < k ? 'on' : ''}"`).replace('fig shade', 'fig shade static').replace('fig wide shade', 'fig wide shade static')
}
function rectSvg(a, b, unit) {
  const sc = Math.min(180 / a, 110 / b), W = a * sc, H = b * sc, x = (300 - W) / 2 - 25, y = (170 - H) / 2 + 5
  return `<svg viewBox="0 0 300 180" class="fig wide"><rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#e6f0ff" stroke="#4a5bd4" stroke-width="4"/>` +
    `<text x="${x + W / 2}" y="${y - 8}" text-anchor="middle" font-size="18" fill="#333">${a}${unit}</text><text x="${x + W + 8}" y="${y + H / 2 + 6}" font-size="18" fill="#333">${b}${unit}</text></svg>`
}
const squareSvg = (a, unit) => `<svg viewBox="0 0 300 160" class="fig wide"><rect x="95" y="28" width="110" height="110" fill="#fff4e0" stroke="#ff9f1c" stroke-width="4"/><text x="150" y="20" text-anchor="middle" font-size="18" fill="#333">${a}${unit}</text></svg>`
function vennSvg(x, y) {
  return `<svg viewBox="0 0 300 160" class="fig wide"><circle cx="115" cy="85" r="68" fill="rgba(74,91,212,.15)" stroke="#4a5bd4" stroke-width="3"/><circle cx="185" cy="85" r="68" fill="rgba(255,159,28,.18)" stroke="#ff9f1c" stroke-width="3"/><text x="70" y="22" font-size="16" fill="#4a5bd4">${x}</text><text x="190" y="22" font-size="16" fill="#e07b00">${y}</text></svg>`
}
const dotsFig = (rows) => `<div class="dots">${rows.map(([lbl, n, c]) => `<div>${lbl}：${Array(n).fill(`<span style="color:${c}">●</span>`).join('')}</div>`).join('')}</div>`

// ============================================================
//  第1单元 时、分、秒
// ============================================================
const hm = (h, m) => (m === 0 ? `${h}时整` : `${h}时${m}分`)
const nx = h => (h % 12) + 1
function u1Read() {
  const h = R(1, 12), m = Math.random() < 0.5 ? R(1, 11) * 5 : R(1, 59)
  if (m % 5 === 0 && Math.random() < 0.3) return u1Read()
  const big = Math.floor(m / 5), small = m % 5
  const ans = hm(h, m)
  return choice('mid', '钟面上是几时几分？', ans,
    opts4(ans, [hm(nx(h), m), hm(big || 12, (h * 5) % 60 || 5), hm(h, 60 - m)], () => hm(h, (m + R(1, 11) * 5) % 60 || 10)),
    `第1步 看时针（红色短针）：它在 ${h} 和 ${nx(h)} 之间，刚走过 ${h}，所以是 ${h} 时。\n` +
    `第2步 看分针（黑色长针）：从 12 起走了 ${big} 个大格${small ? `又 ${small} 个小格` : ''}，${big} × 5${small ? ` + ${small}` : ''} = ${m} 分。\n` +
    `所以是 ${ans}。\n⚠️ 易错：时针快走到 ${nx(h)} 时，还是 ${h} 时多，不能读成 ${nx(h)} 时；长针是分针，短针是时针，不要看反。`,
    clockSvg(h, m))
}
function u1Set() {
  const h = R(1, 12), m = R(1, 11) * 5
  return clockQ('mid', h, m,
    `分针（长针）要指着数字 ${m / 5}，因为 ${m / 5} × 5 = ${m} 分。\n` +
    `时针（短针）要在 ${h} 和 ${nx(h)} 之间${m >= 30 ? `，而且已经过了一半，更靠近 ${nx(h)}` : `，靠近 ${h}`}。\n` +
    `小窍门：先拨分针，再把时针拨到对应的两个数中间。`)
}
function u1Conv() {
  const t = R(0, 3)
  if (t === 0) { const a = R(1, 4), b = R(5, 55); return input('mid', `${a}分${b}秒 =（　）秒`, a * 60 + b, `1分 = 60秒，\n${a}分 = ${a} × 60 = ${a * 60}秒，\n再加上 ${b} 秒：${a * 60} + ${b} = ${a * 60 + b}（秒）。`) }
  if (t === 1) { const a = R(1, 4), b = R(5, 55), s = a * 60 + b; return input('mid', `${s}秒 = ${a}分（　）秒`, b, `1分 = 60秒，${a}分 = ${a * 60}秒，\n${s} − ${a * 60} = ${b}，\n所以 ${s}秒 = ${a}分${b}秒。`) }
  if (t === 2) { const a = R(1, 2), b = R(1, 5) * 10; return input('mid', `${a}时${b}分 =（　）分`, a * 60 + b, `1时 = 60分，${a}时 = ${a * 60}分，\n${a * 60} + ${b} = ${a * 60 + b}（分）。`) }
  const a = R(1, 2), b = R(1, 5) * 10, s = a * 60 + b
  return input('mid', `${s}分 = ${a}时（　）分`, b, `${a}时 = ${a * 60}分，\n${s} − ${a * 60} = ${b}，\n所以 ${s}分 = ${a}时${b}分。`)
}
const secStr = s => (s % 60 === 0 ? `${s / 60}分` : s < 60 || Math.random() < 0.5 ? `${s}秒` : `${Math.floor(s / 60)}分${s % 60}秒`)
function u1Cmp() {
  const a = R(1, 3), b = R(1, 5) * 10, total = a * 60 + b, other = total + pick([-20, -10, 0, 10, 20])
  return cmpQ('mid', `${a}分${b}秒 ○ ${other}秒`, total, other, `先统一单位：${a}分${b}秒 = ${a} × 60 + ${b} = ${total}秒，\n再比较 ${total} 和 ${other}。`)
}
function u1Order() {
  let s = []
  while (s.length < 4) { const x = R(5, 20) * 10; if (!s.includes(x)) s.push(x) }
  s.sort((x, y) => x - y)
  const shown = s.map(secStr)
  return orderQ('mid', '按从短到长的顺序，依次点一点', shown, `先都换成秒再比较：\n${s.map((x, i) => `${shown[i]} = ${x}秒`).join('\n')}\n所以从短到长：${shown.join(' < ')}`)
}
function u1Pop() {
  const pool = [['一节课大约40（ ）', '分'], ['刷一次牙大约3（ ）', '分'], ['做眼保健操大约5（ ）', '分'], ['上学路上走了15（ ）', '分'], ['唱一首歌大约4（ ）', '分'],
    ['眨一下眼大约1（ ）', '秒'], ['跑50米大约9（ ）', '秒'], ['跳绳30下大约15（ ）', '秒'], ['写一个字大约5（ ）', '秒'], ['深呼吸一次大约3（ ）', '秒'],
    ['每天睡觉大约9（ ）', '时'], ['看一场电影大约2（ ）', '时'], ['一天在学校大约7（ ）', '时'], ['坐火车去外婆家用了5（ ）', '时']]
  const u = pick(['分', '秒', '时'])
  const yes = shuffle(pool.filter(p => p[1] === u)).slice(0, R(2, 3)), no = shuffle(pool.filter(p => p[1] !== u)).slice(0, 6 - yes.length)
  return popQ('mid', `戳破所有括号里应该填「${u}」的气球`, yes.map(p => ({ t: p[0], ok: true })).concat(no.map(p => ({ t: p[0], ok: false }))),
    '想一想时间有多长：\n秒最短（眨眼、跑几步），分比较长（刷牙、一节课），时最长（睡觉、看电影）。\n' + yes.concat(no).map(p => `${p[0].replace('（ ）', `（${p[1]}）`)}`).join('\n'))
}
function u1Elapsed() {
  const h = R(7, 10), m = R(7, 11) * 5, rest = 60 - m, em = R(1, 8) * 5, dur = rest + em
  return input('hard', `从 ${hm(h, m)} 到 ${hm(h + 1, em)}，经过了多少分钟？`, dur,
    `跨过了整时，可以分两段算：\n第1段：从 ${hm(h, m)} 到 ${h + 1}时整，是 60 − ${m} = ${rest} 分；\n第2段：从 ${h + 1}时整 到 ${hm(h + 1, em)}，是 ${em} 分；\n合起来：${rest} + ${em} = ${dur}（分）。\n⚠️ 易错：不能直接用 ${em} − ${m}，因为已经过了一个整时。`, null, '分')
}
function u1End() {
  const h = R(8, 10), m = R(6, 10) * 5, dur = R(Math.ceil((65 - m) / 5), 11) * 5
  const em = m + dur - 60, ans = hm(h + 1, em)
  return choice('hard', `一场比赛 ${hm(h, m)} 开始，进行了 ${dur} 分钟。比赛几时几分结束？`, ans,
    opts4(ans, [hm(h, em), hm(h + 2, em), hm(h + 1, (em + 10) % 60 || 5)], () => hm(h + 1, R(1, 11) * 5)),
    `${m} + ${dur} = ${m + dur} 分，满了 60 分就是 1 时：\n${m + dur} − 60 = ${em}，时要加 1，${h} + 1 = ${h + 1}。\n所以结束时间是 ${ans}。\n⚠️ 易错：分满 60 要向“时”进 1，不能写成 ${hm(h, em)}。`)
}
function u1Start() {
  const eh = R(9, 11), em = R(1, 4) * 5, dh = 1, dm = R(Math.ceil((em + 5) / 5), 10) * 5
  const sm = em - dm + 60, sh = eh - dh - 1, ans = hm(sh, sm)
  return choice('hard', `一部电影放映了 ${dh}时${dm}分，在 ${hm(eh, em)} 结束。电影是几时几分开始的？`, ans,
    opts4(ans, [hm(eh + 1, (em + dm) % 60 || 5), hm(eh - 1, em), hm(sh + 1, sm)], () => hm(sh, R(1, 11) * 5)),
    `用“往前推”的方法：\n先往前推 ${dh} 时：${hm(eh, em)} → ${hm(eh - 1, em)}；\n再往前推 ${dm} 分：${em} 分不够减 ${dm}，借 1 时当 60 分，${em} + 60 − ${dm} = ${sm} 分，时变成 ${sh}。\n所以开始时间是 ${ans}。`)
}
function u1Schedule() {
  const k = R(2, 3), startH = 8, total = k * 40 + (k - 1) * 10, eh = startH + Math.floor(total / 60), em = total % 60
  const ans = hm(eh, em)
  const lines = []
  let t = 0
  for (let i = 1; i <= k; i++) { lines.push(`第${i}节：${hm(startH + Math.floor(t / 60), t % 60)} 上课，${hm(startH + Math.floor((t + 40) / 60), (t + 40) % 60)} 下课`); t += 50 }
  return choice('hard', `学校 8时整 上第1节课，每节课 40 分钟，课间休息 10 分钟。第${k}节课几时几分下课？`, ans,
    opts4(ans, [hm(startH + Math.floor(k * 40 / 60), k * 40 % 60), hm(startH + Math.floor(k * 50 / 60), k * 50 % 60), hm(eh, (em + 10) % 60 || 5)], () => hm(eh, R(1, 11) * 5)),
    `一节一节往后推：\n${lines.join('\n')}\n所以第${k}节课 ${ans} 下课。\n⚠️ 易错：别忘了加上课间的 10 分钟，也不要多加最后一个课间。`)
}
function u1Race() {
  const [a, b, c] = shuffle(NAMES).slice(0, 3)
  const ts = shuffle([R(50, 58), 60 + R(2, 9), R(61, 69)]).map((x, i) => x + i * 0)
  const T = [ts[0], ts[1], ts[2]]
  const show = T.map(x => (x >= 60 && Math.random() < 0.6 ? `1分${x - 60}秒` : `${x}秒`))
  const mx = Math.max(...T), mn = Math.min(...T)
  return input('hard', `跑步比赛：${a} 用了 ${show[0]}，${b} 用了 ${show[1]}，${c} 用了 ${show[2]}。最慢的比最快的多用了几秒？`, mx - mn,
    `先统一成秒：\n${[a, b, c].map((n, i) => `${n}：${show[i]} = ${T[i]}秒`).join('\n')}\n用时最少的最快（${mn}秒），用时最多的最慢（${mx}秒），\n${mx} − ${mn} = ${mx - mn}（秒）。`, null, '秒')
}

// ============================================================
//  第2单元 万以内的加法和减法（一）
// ============================================================
function u2Oral() {
  if (Math.random() < 0.5) {
    let a, b
    do { a = R(23, 68); b = R(17, 99 - a) } while (a % 10 + b % 10 < 10 || a + b > 99)
    return input('mid', `口算：${a} + ${b} =`, a + b, `可以先加整十，再加一位数：\n${a} + ${b - b % 10} = ${a + b - b % 10}，\n${a + b - b % 10} + ${b % 10} = ${a + b}。\n⚠️ 易错：个位 ${a % 10} + ${b % 10} 满十，要向十位进 1。`)
  }
  let a, b
  do { a = R(41, 95); b = R(16, a - 9) } while (a % 10 >= b % 10)
  return input('mid', `口算：${a} − ${b} =`, a - b, `可以先减整十，再减一位数：\n${a} − ${b - b % 10} = ${a - b + b % 10}，\n${a - b + b % 10} − ${b % 10} = ${a - b}。\n⚠️ 易错：个位 ${a % 10} 不够减 ${b % 10}，要向十位借 1。`)
}
function u2Tens() {
  if (Math.random() < 0.5) {
    let a, b
    do { a = R(15, 68) * 10; b = R(15, 60) * 10 } while ((a / 10) % 10 + (b / 10) % 10 < 10 || a + b >= 1000)
    return input('mid', `口算：${a} + ${b} =`, a + b, `把它们看成几个十：\n${a / 10} 个十 + ${b / 10} 个十 = ${(a + b) / 10} 个十，\n就是 ${a + b}。`)
  }
  let a, b
  do { a = R(30, 95) * 10; b = R(12, a / 10 - 5) * 10 } while ((a / 10) % 10 >= (b / 10) % 10)
  return input('mid', `口算：${a} − ${b} =`, a - b, `把它们看成几个十：\n${a / 10} 个十 − ${b / 10} 个十 = ${(a - b) / 10} 个十，\n就是 ${a - b}。`)
}
function u2Match() {
  const pairs = [], used = new Set()
  while (pairs.length < 4) {
    const plus = Math.random() < 0.5
    let a = R(25, 70), b = R(15, 45)
    if (!plus && b > a) [a, b] = [b, a]
    const r = plus ? a + b : a - b
    if (used.has(r) || r > 99) continue
    used.add(r); pairs.push([`${a} ${plus ? '+' : '−'} ${b}`, String(r)])
  }
  return matchQ('mid', '连一连：把算式和得数配成对', pairs, pairs.map(p => `${p[0]} = ${p[1]}`).join('\n') + '\n方法：先算个位，满十进一、不够减借一。')
}
function u2Est() {
  const a = R(2, 6) * 100 + pick([-3, -2, -1, 1, 2, 3, -4, 4]), b = R(1, 3) * 100 + pick([-2, -1, 1, 2, 3])
  const ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100, ans = ra + rb
  return choice('mid', `估一估：${a} + ${b} 的得数大约是多少？`, ans, opts4(ans, [ans + 100, ans - 100, ans + 200], () => ans + 300),
    `估算时，把数看成和它接近的整百数：\n${a} ≈ ${ra}，${b} ≈ ${rb}，\n${ra} + ${rb} = ${ans}，所以大约是 ${ans}。`)
}
function u2Bus() {
  const a = R(30, 55), b = R(12, 25), c = R(15, 35)
  return input('hard', `公交车上原来有 ${a} 人，到站后下去 ${b} 人，又上来 ${c} 人。现在车上有多少人？`, a - b + c,
    `一步一步算：\n下去 ${b} 人，用减法：${a} − ${b} = ${a - b}（人）；\n又上来 ${c} 人，用加法：${a - b} + ${c} = ${a - b + c}（人）。\n也可以列综合算式：${a} − ${b} + ${c} = ${a - b + c}（人）。`, null, '人')
}
function u2More() {
  const a = R(32, 46), d = R(5, 12), t = Math.random() < 0.5
  const b = t ? a + d : a - d
  return input('hard', `三年级一班有 ${a} 人，二班比一班${t ? '多' : '少'} ${d} 人。两个班一共有多少人？`, a + b,
    `这是两步题：\n第1步 先求二班：${a} ${t ? '+' : '−'} ${d} = ${b}（人）；\n第2步 再求一共：${a} + ${b} = ${a + b}（人）。\n⚠️ 易错：题目问“一共”，不能只算出二班就停下。`, null, '人')
}
function u2Box() {
  const t = R(2, 5), x = R(2, 8), b = R(12, 35), L = t * 10 + x + 1 + b
  return input('hard', `${t}□ + ${b} < ${L}，□ 里最大能填几？`, x,
    `先算 ${L} − ${b} = ${L - b}，\n所以 ${t}□ 要比 ${L - b} 小，${t}□ 最大是 ${L - b - 1}，\n□ 里最大填 ${x}。\n检查：${t}${x} + ${b} = ${t * 10 + x + b} < ${L} ✔；${t}${x + 1} + ${b} = ${t * 10 + x + 1 + b}，不小于 ${L} ✘。`)
}
function u2Enough() {
  const b = R(2, 3) * 100, a = R(45, 95), c = b - a + pick([-8, -5, -3, 3, 5, 8])
  const s = a + c, ok = s <= b
  return choice('hard', `妈妈带了 ${b} 元，买了一双 ${a} 元的鞋，还想买一个 ${c} 元的书包。钱够吗？`, ok ? '够' : '不够', ['够', '不够'],
    `把两样东西的价钱加起来：${a} + ${c} = ${s}（元），\n${s} ${ok ? '≤' : '>'} ${b}，所以${ok ? '够' : '不够'}。\n⚠️ 注意：价钱和带的钱很接近时，要精确计算，不能只粗略估。`, null, true)
}

// ============================================================
//  第3单元 测量
// ============================================================
function u3Conv() {
  const list = [
    () => { const a = R(2, 9), b = R(1, 9); return [`${a}厘米${b}毫米 =（　）毫米`, a * 10 + b, `1厘米 = 10毫米，${a}厘米 = ${a * 10}毫米，\n${a * 10} + ${b} = ${a * 10 + b}（毫米）。`] },
    () => { const a = R(2, 9), b = R(1, 9); return [`${a * 10 + b}毫米 = ${a}厘米（　）毫米`, b, `${a}厘米 = ${a * 10}毫米，\n${a * 10 + b} − ${a * 10} = ${b}（毫米）。`] },
    () => { const a = R(2, 9), b = R(1, 9); return [`${a}分米${b}厘米 =（　）厘米`, a * 10 + b, `1分米 = 10厘米，${a}分米 = ${a * 10}厘米，\n${a * 10} + ${b} = ${a * 10 + b}（厘米）。`] },
    () => { const a = R(2, 9); return [`${a}米 =（　）厘米`, a * 100, `1米 = 100厘米，${a}米 = ${a} × 100 = ${a * 100}（厘米）。\n⚠️ 易错：米和厘米之间是 100，不是 10。`] },
    () => { const a = R(1, 4), b = R(1, 9) * 100; return [`${a}千米${b}米 =（　）米`, a * 1000 + b, `1千米 = 1000米，${a}千米 = ${a * 1000}米，\n${a * 1000} + ${b} = ${a * 1000 + b}（米）。`] },
    () => { const a = R(2, 8), b = R(1, 9) * 100; return [`${a * 1000 + b}千克 = ${a}吨（　）千克`, b, `1吨 = 1000千克，${a}吨 = ${a * 1000}千克，\n${a * 1000 + b} − ${a * 1000} = ${b}（千克）。`] },
    () => { const a = R(2, 9); return [`${a}吨 =（　）千克`, a * 1000, `1吨 = 1000千克，${a}吨 = ${a} × 1000 = ${a * 1000}（千克）。`] },
    () => { const a = R(2, 8); return [`1米 − ${a}分米 =（　）分米`, 10 - a, `先统一单位：1米 = 10分米，\n10 − ${a} = ${10 - a}（分米）。`] },
    () => { const a = R(2, 8) * 100; return [`1千米 − ${a}米 =（　）米`, 1000 - a, `先统一单位：1千米 = 1000米，\n1000 − ${a} = ${1000 - a}（米）。`] },
    () => { const a = R(2, 8) * 100; return [`1千克 − ${a}克 =（　）克`, 1000 - a, `先统一单位：1千克 = 1000克，\n1000 − ${a} = ${1000 - a}（克）。`] },
  ]
  const [q, a, tip] = pick(list)()
  return input('mid', q, a, tip)
}
function u3Cmp() {
  const t = R(0, 3)
  if (t === 0) { const a = R(2, 6), b = a * 1000 + pick([-100, 0, 50, -10]); return cmpQ('mid', `${a}千米 ○ ${b}米`, a * 1000, b, `先统一单位：${a}千米 = ${a * 1000}米，\n再比较 ${a * 1000}米 和 ${b}米。`) }
  if (t === 1) { const a = R(2, 9), c = R(1, 9), b = a * 10 + c + pick([-2, 0, 3]); return cmpQ('mid', `${a}厘米${c}毫米 ○ ${b}毫米`, a * 10 + c, b, `${a}厘米${c}毫米 = ${a * 10 + c}毫米，\n再和 ${b}毫米 比。`) }
  if (t === 2) { const a = R(2, 6), b = a * 1000 + pick([-500, 0, 200]); return cmpQ('mid', `${a}吨 ○ ${b}千克`, a * 1000, b, `${a}吨 = ${a * 1000}千克，\n再和 ${b}千克 比。`) }
  return cmpQ('mid', '1千克铁 ○ 1000克棉花', 1000, 1000, '1千克 = 1000克，都是 1000 克，一样重！\n⚠️ 易错：不要被“铁很重、棉花很轻”骗了，要看数量。')
}
function u3Order() {
  const base = R(2, 5)
  const vals = uniq([base * 1000, base * 1000 - R(1, 3) * 100, base * 1000 + R(1, 4) * 50, (base - 1) * 1000 + R(5, 8) * 100]).slice(0, 4)
  const show = v => (v % 1000 === 0 ? `${v / 1000}千米` : v > 1000 && Math.random() < 0.5 ? `${Math.floor(v / 1000)}千米${v % 1000}米` : `${v}米`)
  const sorted = vals.slice().sort((a, b) => a - b), shown = sorted.map(show)
  if (uniq(shown).length < 4) return u3Order()
  return orderQ('mid', '按从短到长的顺序，依次点一点', shown, `先都换成“米”：\n${sorted.map((v, i) => `${shown[i]} = ${v}米`).join('\n')}\n所以：${shown.join(' < ')}`)
}
function u3Unit() {
  const len = [['一枚1元硬币厚约2（ ）', '毫米'], ['一支铅笔长约18（ ）', '厘米'], ['课桌高约7（ ）', '分米'], ['黑板长约4（ ）', '米'], ['从学校到公园约3（ ）', '千米'],
    ['一本数学书厚约6（ ）', '毫米'], ['三年级同学身高约130（ ）', '厘米'], ['汽车每小时行驶60（ ）', '千米'], ['教室门高约2（ ）', '米'], ['数学书长约2（ ）', '分米']]
  const wt = [['一头大象重约5（ ）', '吨'], ['一个鸡蛋重约50（ ）', '克'], ['三年级同学体重约30（ ）', '千克'], ['一辆卡车能装4（ ）货物', '吨'], ['一个苹果重约200（ ）', '克'], ['一袋大米重10（ ）', '千克']]
  const L = ['毫米', '厘米', '分米', '米', '千米'], W = ['克', '千克', '吨']
  if (Math.random() < 0.6) {
    const [q, a] = pick(len)
    const others = shuffle(L.filter(x => x !== a)).slice(0, 3)
    return choice('mid', `在括号里填上合适的单位：${q}`, a, L.filter(x => x === a || others.includes(x)),
      '用身边的东西来比一比：\n1毫米：一张银行卡那么厚\n1厘米：大约一个指甲那么宽\n1分米：大约一个手掌那么宽\n1米：大约张开两臂那么长\n1千米：要走十几分钟\n' + `所以“${q.replace('（ ）', `（${a}）`)}”最合适。`)
  }
  const [q, a] = pick(wt)
  return choice('mid', `在括号里填上合适的单位：${q}`, a, W,
    '1克：一枚2分硬币那么轻\n1千克：两袋盐那么重\n1吨：大约一辆小汽车那么重\n' + `所以“${q.replace('（ ）', `（${a}）`)}”最合适。`, null, true)
}
function u3Truck() {
  const cap = R(3, 6), done = R(cap * 2 - 4, cap * 2 - 1) * 500
  return input('hard', `一辆卡车最多能装 ${cap} 吨货物，已经装了 ${done} 千克，还能再装多少千克？`, cap * 1000 - done,
    `单位不一样，要先统一单位：\n${cap}吨 = ${cap * 1000}千克，\n${cap * 1000} − ${done} = ${cap * 1000 - done}（千克）。\n⚠️ 易错：不能直接用 ${cap} 和 ${done} 相减。`, null, '千克')
}
function u3Bridge() {
  const lim = R(4, 6), car = R(1, 2), n = R(4, 8), per = R(3, 6) * 100, tot = car * 1000 + n * per, ok = tot <= lim * 1000
  return choice('hard', `一座桥限重 ${lim} 吨。一辆货车自重 ${car} 吨，车上装了 ${n} 箱货，每箱重 ${per} 千克。这辆车能安全过桥吗？`, ok ? '能' : '不能', ['能', '不能'],
    `第1步 算货物重：${per} × ${n} = ${n * per}（千克）；\n第2步 车自重：${car}吨 = ${car * 1000}千克；\n第3步 一共：${car * 1000} + ${n * per} = ${tot}（千克）；\n限重 ${lim}吨 = ${lim * 1000}千克，${tot} ${ok ? '≤' : '>'} ${lim * 1000}，所以${ok ? '能' : '不能'}过桥。`, null, true)
}
function u3Rope() {
  const m = R(2, 4), a = R(1, m - 1), b = R(1, 9)
  return input('hard', `一根绳子长 ${m} 米，用去 ${a}米${b}分米，还剩多少分米？`, m * 10 - a * 10 - b,
    `先统一成分米：\n${m}米 = ${m * 10}分米，${a}米${b}分米 = ${a * 10 + b}分米，\n${m * 10} − ${a * 10 + b} = ${m * 10 - a * 10 - b}（分米）。`, null, '分米')
}
function u3Animal() {
  const e = R(3, 6), c = R(4, 9) * 100, k = R(2, 3)
  return input('hard', `一头大象重 ${e} 吨，一头牛重 ${c} 千克。大象比 ${k} 头牛一共还重多少千克？`, e * 1000 - c * k,
    `第1步 ${k} 头牛重：${c} × ${k} = ${c * k}（千克）；\n第2步 统一单位：${e}吨 = ${e * 1000}千克；\n第3步 ${e * 1000} − ${c * k} = ${e * 1000 - c * k}（千克）。`, null, '千克')
}

// ============================================================
//  第4单元 万以内的加法和减法（二）
// ============================================================
function u4Vert() {
  if (Math.random() < 0.5) { let a, b; do { a = R(156, 589); b = R(127, 399) } while (a + b >= 1000 || (a % 10 + b % 10 < 10 && (a / 10 | 0) % 10 + (b / 10 | 0) % 10 < 10)); return vertical('mid', a, b, '+') }
  let a, b; do { a = R(400, 950); b = R(128, a - 100) } while (a % 10 >= b % 10 && (a / 10 | 0) % 10 >= (b / 10 | 0) % 10)
  return vertical('mid', a, b, '-')
}
function u4Calc() {
  let a, b
  do { a = R(236, 678); b = R(185, 312) } while (a + b >= 1000)
  return input('mid', `${a} + ${b} =`, a + b, addSteps(a, b))
}
function u4Check() {
  const a = R(210, 590), b = R(120, 380), s = a + b
  const ans = `${a} + ${b}`
  return choice('mid', `计算 ${s} − ${b} = ${a} 后，用哪个算式验算最合适？`, ans, [ans, `${s} + ${b}`, `${a} − ${b}`, `${s} + ${a}`],
    `减法的验算：差 + 减数 = 被减数。\n这里差是 ${a}，减数是 ${b}，被减数是 ${s}，\n所以用 ${a} + ${b}，看是不是等于 ${s}。`)
}
function u4Zero() {
  const a = pick([R(3, 9) * 100, R(3, 9) * 100 + R(1, 9), 1000, R(3, 9) * 100 + R(1, 9) * 10]), b = R(118, Math.min(a - 60, 689))
  if ((a % 10) >= (b % 10) && a !== 1000) return u4Zero()
  return vertical('hard', a, b, '-')
}
function u4Books() {
  const a = R(7, 9) * 100, b = R(186, 288), c = R(205, 336)
  return input('hard', `书店有 ${a} 本故事书，上午卖出 ${b} 本，下午卖出 ${c} 本，还剩多少本？`, a - b - c,
    `方法一：一次一次减\n${a} − ${b} = ${a - b}，${a - b} − ${c} = ${a - b - c}（本）。\n方法二：先算一共卖出多少\n${b} + ${c} = ${b + c}，${a} − ${b + c} = ${a - b - c}（本）。`, null, '本')
}
function u4Total() {
  const a = R(286, 398), d = R(28, 69)
  return input('hard', `学校有男生 ${a} 人，女生比男生少 ${d} 人。全校一共有多少人？`, a + a - d,
    `第1步 先求女生：${a} − ${d} = ${a - d}（人）；\n第2步 再求一共：${a} + ${a - d} = ${a + a - d}（人）。\n⚠️ 易错：问的是“一共”，求出女生后还要再加男生。`, null, '人')
}
function u4MaxMin() {
  const list = [['最大的三位数比最小的三位数多多少？', 899, '最大的三位数是 999，最小的三位数是 100，\n999 − 100 = 899。'],
    ['最小的四位数比最大的三位数多多少？', 1, '最小的四位数是 1000，最大的三位数是 999，\n1000 − 999 = 1。'],
    ['最大的两位数与最小的三位数的和是多少？', 199, '最大的两位数是 99，最小的三位数是 100，\n99 + 100 = 199。'],
    ['最大的三位数与最大的两位数的差是多少？', 900, '最大的三位数是 999，最大的两位数是 99，\n999 − 99 = 900。']]
  const [q, a, t] = pick(list)
  return input('hard', q, a, t)
}
function u4Shop() {
  const a = R(180, 320), b = R(120, 260), c = R(60, 150), m = Math.ceil((a + b + c) / 100) * 100 + pick([-100, 0, 0])
  const ok = a + b + c <= m
  return choice('hard', `王阿姨带了 ${m} 元，买了一台 ${a} 元的电风扇、一个 ${b} 元的电饭锅和一个 ${c} 元的台灯。钱够吗？`, ok ? '够' : '不够', ['够', '不够'],
    `把三样加起来：${a} + ${b} + ${c} = ${a + b + c}（元），\n${a + b + c} ${ok ? '≤' : '>'} ${m}，所以${ok ? '够' : '不够'}。`, null, true)
}

// ============================================================
//  第5单元 倍的认识
// ============================================================
function u5Basic() {
  const b = R(3, 9), k = R(3, 9)
  if (Math.random() < 0.5) return input('mid', `${b * k} 是 ${b} 的几倍？`, k, `求 ${b * k} 是 ${b} 的几倍，就是求 ${b * k} 里面有几个 ${b}，\n用除法：${b * k} ÷ ${b} = ${k}。\n所以是 ${k} 倍。`, null, '倍')
  return input('mid', `${b} 的 ${k} 倍是多少？`, b * k, `求 ${b} 的 ${k} 倍，就是求 ${k} 个 ${b} 是多少，\n用乘法：${b} × ${k} = ${b * k}。`)
}
function u5Fig() {
  const b = R(2, 4), k = R(3, 5)
  return input('mid', '○ 的个数是 △ 的几倍？', k, `把 △ 的 ${b} 个看作 1 份，\n○ 有 ${b * k} 个，里面有 ${k} 个 ${b}（${b * k} ÷ ${b} = ${k}），\n所以 ○ 是 △ 的 ${k} 倍。`, dotsFig([['△', b, '#4a5bd4'], ['○', b * k, '#ff9f1c']]), '倍')
}
function u5Match() {
  const pairs = [], used = new Set()
  while (pairs.length < 4) {
    const b = R(3, 9), k = R(2, 9)
    if (used.has(b * k)) continue
    used.add(b * k); pairs.push([`${b} 的 ${k} 倍`, String(b * k)])
  }
  return matchQ('mid', '连一连：把每句话和它的得数配成对', pairs, '求一个数的几倍是多少，用乘法：\n' + pairs.map(p => `${p[0]}：${p[0].split(' 的 ')[0]} × ${p[0].split(' 的 ')[1].replace(' 倍', '')} = ${p[1]}`).join('\n'))
}
function u5Sum() {
  const [x, y] = shuffle(['白兔', '黑兔', '小鸡', '小鸭', '小羊']).slice(0, 2), b = R(4, 9), k = R(2, 5)
  return input('hard', `${x} 有 ${b} 只，${y} 的只数是 ${x} 的 ${k} 倍。两种动物一共有多少只？`, b * k + b,
    `第1步 先求 ${y}：${b} × ${k} = ${b * k}（只）；\n第2步 再求一共：${b * k} + ${b} = ${b * k + b}（只）。\n⚠️ 易错：问的是“一共”，别忘了加上 ${x}。`, null, '只')
}
function u5More() {
  const n = pick(NAMES), b = R(4, 9), k = R(2, 5), c = R(2, 6)
  return input('hard', `小红有 ${b} 本故事书，${n === '小红' ? '小明' : n} 的书比小红的 ${k} 倍还多 ${c} 本。${n === '小红' ? '小明' : n} 有多少本？`, b * k + c,
    `第1步 先求小红的 ${k} 倍：${b} × ${k} = ${b * k}（本）；\n第2步 再多 ${c} 本：${b * k} + ${c} = ${b * k + c}（本）。`, null, '本')
}
function u5Rev() {
  const x = R(3, 9), k = R(2, 6), j = R(2, 5)
  return input('hard', `一个数的 ${k} 倍是 ${x * k}，这个数的 ${j} 倍是多少？`, x * j,
    `第1步 先求这个数：${x * k} ÷ ${k} = ${x}；\n第2步 再求它的 ${j} 倍：${x} × ${j} = ${x * j}。`)
}
function u5Diff() {
  const b = R(4, 9), k = R(3, 6)
  return input('hard', `梨有 ${b} 个，苹果的个数是梨的 ${k} 倍。苹果比梨多多少个？`, b * k - b,
    `第1步 先求苹果：${b} × ${k} = ${b * k}（个）；\n第2步 求多多少：${b * k} − ${b} = ${b * k - b}（个）。\n⚠️ 注意区分：“是几倍”用乘除法，“多多少”用减法。`, null, '个')
}

// ============================================================
//  第6单元 多位数乘一位数
// ============================================================
function u6Vert() {
  const a = Math.random() < 0.4 ? R(23, 98) : R(112, 489), k = R(3, 9)
  if (a % 10 * k < 10 && a < 100) return u6Vert()
  return vertical('mid', a, k, '*')
}
function u6Oral() {
  const list = [() => [25, 4], () => [125, 8], () => [R(12, 24), R(3, 4)], () => [R(1, 9) * 10 + 5, 2], () => [R(2, 9) * 100, R(3, 9)], () => [R(11, 33), 3]]
  const [a, k] = pick(list)()
  return input('mid', `口算：${a} × ${k} =`, a * k,
    a % 100 === 0 ? `先算 ${a / 100} × ${k} = ${a / 100 * k}，再在末尾添两个 0，得 ${a * k}。` :
      `把 ${a} 拆成 ${a - a % 10} 和 ${a % 10}：\n${a - a % 10} × ${k} = ${(a - a % 10) * k}，\n${a % 10} × ${k} = ${a % 10 * k}，\n合起来：${(a - a % 10) * k} + ${a % 10 * k} = ${a * k}。`)
}
function u6Pop() {
  const N = pick([1200, 1800, 2400, 3600, 1600, 2000, 800, 600])
  const facs = []
  for (const k of [2, 3, 4, 5, 6, 8, 9]) { const a = N / k; if (Number.isInteger(a) && a % 10 === 0 && a < 1000) facs.push(`${a} × ${k}`) }
  if (facs.length < 2) return u6Pop()
  const yes = shuffle(facs).slice(0, Math.min(3, facs.length)), no = []
  let guard = 0
  while (no.length < 6 - yes.length && guard++ < 500) {
    const k = R(2, 9), a = (N / k | 0) + pick([-100, 100, -10, 10, 50])
    if (a <= 0 || a * k === N || a % 10) continue
    const t = `${a} × ${k}`
    if (!no.includes(t)) no.push(t)
  }
  return popQ('mid', `戳破所有得数是 ${N} 的气球`, yes.map(t => ({ t, ok: true })).concat(no.map(t => ({ t, ok: false }))),
    yes.concat(no).map(t => { const [a, k] = t.split(' × ').map(Number); return `${t} = ${a * k}${a * k === N ? ' ✔' : ''}` }).join('\n') + '\n方法：整十、整百数乘一位数，先把 0 前面的数相乘，再在末尾添上 0。')
}
function u6Est() {
  const a = R(2, 8) * 100 + pick([-2, -1, 1, 2, 3, -3]), k = R(3, 6), ra = Math.round(a / 100) * 100, ans = ra * k
  return choice('mid', `估一估：${a} × ${k} 的积大约是多少？`, ans, opts4(ans, [ans + 100 * k, ans - 100 * k, ra + k * 100], () => ans + R(1, 9) * 100),
    `${a} 接近 ${ra}，\n${ra} × ${k} = ${ans}，\n所以 ${a} × ${k} 大约是 ${ans}。`)
}
function u6Zero() {
  const a = Math.random() < 0.5 ? R(1, 9) * 100 + R(1, 9) : R(12, 89) * 10, k = R(3, 9)
  return vertical('hard', a, k, '*')
}
function u6Word() {
  const t = R(0, 2)
  if (t === 0) { const a = R(18, 36), k = R(4, 8), c = R(5, 12); return input('hard', `每箱牛奶有 ${a} 瓶，学校买了 ${k} 箱，商店又送了 ${c} 瓶。一共有多少瓶？`, a * k + c, `第1步 ${k} 箱有：${a} × ${k} = ${a * k}（瓶）；\n第2步 加上送的：${a * k} + ${c} = ${a * k + c}（瓶）。`, null, '瓶') }
  if (t === 1) { const a = R(65, 95), k = R(3, 4), m = Math.ceil(a * k / 100) * 100; return input('hard', `一个书包 ${a} 元，买 ${k} 个，付了 ${m} 元，应找回多少元？`, m - a * k, `第1步 ${k} 个书包：${a} × ${k} = ${a * k}（元）；\n第2步 找回：${m} − ${a * k} = ${m - a * k}（元）。`, null, '元') }
  const a = R(7, 9), r = R(24, 32), sat = R(150, a * r - 20)
  return input('hard', `电影院每排有 ${a} 个座位，一共 ${r} 排。已经坐了 ${sat} 人，还能坐多少人？`, a * r - sat, `第1步 一共有座位：${r} × ${a} = ${a * r}（个）；\n第2步 还能坐：${a * r} − ${sat} = ${a * r - sat}（人）。`, null, '人')
}
function u6Box() {
  for (let g = 0; g < 50; g++) {
    const t = R(1, 4), k = R(3, 9)
    if ((t * 10) * k >= 100 || (t * 10 + 9) * k < 100) continue
    let x = 0; while ((t * 10 + x) * k < 100) x++
    return input('hard', `${t}□ × ${k} 的积是三位数，□ 里最小能填几？`, x,
      `积是三位数，就是积至少是 100。\n试一试：${t}${x - 1 >= 0 ? x - 1 : 0} × ${k} = ${(t * 10 + Math.max(0, x - 1)) * k}${(t * 10 + Math.max(0, x - 1)) * k < 100 ? '，是两位数 ✘' : ''}；\n${t}${x} × ${k} = ${(t * 10 + x) * k}，是三位数 ✔。\n所以 □ 里最小填 ${x}。`)
  }
  return u6Word()
}

// ============================================================
//  第7单元 长方形和正方形
// ============================================================
function u7Peri() {
  if (Math.random() < 0.55) { const a = R(6, 18), b = R(3, a - 2); return input('mid', '求这个长方形的周长。', (a + b) * 2, `长方形的周长 =（长 + 宽）× 2\n=（${a} + ${b}）× 2\n= ${a + b} × 2\n= ${(a + b) * 2}（厘米）\n⚠️ 易错：不能只算 长 + 宽，一定要再乘 2。`, rectSvg(a, b, '厘米'), '厘米') }
  const a = R(5, 15)
  return input('mid', '求这个正方形的周长。', a * 4, `正方形的周长 = 边长 × 4\n= ${a} × 4\n= ${a * 4}（厘米）`, squareSvg(a, '厘米'), '厘米')
}
function u7Wire() {
  if (Math.random() < 0.5) { const a = R(4, 12); return input('mid', `用一根 ${a * 4} 厘米长的铁丝正好围成一个正方形，正方形的边长是多少厘米？`, a, `铁丝的长度就是正方形的周长，\n正方形 4 条边一样长：${a * 4} ÷ 4 = ${a}（厘米）。`, null, '厘米') }
  const a = R(7, 15), b = R(3, a - 2)
  return input('mid', `用一根 ${(a + b) * 2} 厘米长的铁丝围成一个长方形，长是 ${a} 厘米，宽是多少厘米？`, b,
    `铁丝长就是周长，周长 =（长 + 宽）× 2，\n所以 长 + 宽 = ${(a + b) * 2} ÷ 2 = ${a + b}（厘米），\n宽 = ${a + b} − ${a} = ${b}（厘米）。`, null, '厘米')
}
function u7Judge() {
  const list = [['正方形是特殊的长方形。', '对', '正方形有长方形的所有特点（4个直角、对边相等），而且4条边都相等，所以是特殊的长方形。'],
    ['四边形都有 4 个直角。', '错', '四边形只要求有4条直的边、4个角，比如平行四边形就没有直角。'],
    ['周长相等的两个长方形，形状一定相同。', '错', '比如长5宽1、长4宽2，周长都是12，但形状不同。'],
    ['有 4 个直角的四边形一定是正方形。', '错', '长方形也有 4 个直角，但它的 4 条边不一定都相等。'],
    ['正方形的边长扩大到原来的 2 倍，周长也扩大到原来的 2 倍。', '对', '周长 = 边长 × 4，边长变成2倍，周长也变成2倍。'],
    ['长方形的周长一定比正方形的周长长。', '错', '要看具体大小：长3宽1的长方形周长8，边长5的正方形周长20。']]
  const [q, a, t] = pick(list)
  return choice('mid', '判断：' + q, a, ['对', '错'], `这句话是${a}的。\n${t}`, null, true)
}
function u7Join() {
  const a = R(3, 8), n = R(2, 3)
  return input('hard', `把 ${n} 个边长 ${a} 厘米的正方形，排成一排拼成一个长方形。这个长方形的周长是多少厘米？`, (a * n + a) * 2,
    `拼成的长方形：长是 ${n} 个边长，${a} × ${n} = ${a * n}（厘米）；宽是 ${a} 厘米。\n周长 =（${a * n} + ${a}）× 2 = ${(a * n + a) * 2}（厘米）。\n⚠️ 易错：不能用 ${n} 个正方形的周长直接相加，拼在一起的边已经藏到里面了。`, null, '厘米')
}
function u7Cut() {
  const a = R(9, 16), b = R(4, a - 3)
  return input('hard', `从一张长 ${a} 厘米、宽 ${b} 厘米的长方形纸上，剪下一个最大的正方形。剩下的长方形周长是多少厘米？`, (b + a - b) * 2,
    `最大的正方形边长 = 长方形的宽 = ${b} 厘米。\n剩下的长方形：长 ${b} 厘米，宽 ${a} − ${b} = ${a - b} 厘米。\n周长 =（${b} + ${a - b}）× 2 = ${(b + a - b) * 2}（厘米）。`, rectSvg(a, b, '厘米'), '厘米')
}
function u7Wall() {
  const a = R(8, 16), b = R(3, 7)
  return input('hard', `用篱笆围一块长方形菜地，长 ${a} 米、宽 ${b} 米，一条长边靠着墙。篱笆至少要多长？`, a + b * 2,
    `靠墙的那条长边不用围，只围 1 条长 + 2 条宽：\n${a} + ${b} + ${b} = ${a + b * 2}（米）。\n⚠️ 易错：不要算成整个周长（${(a + b) * 2}米）。`, null, '米')
}
function u7Double() {
  const b = R(3, 9)
  return input('hard', `一个长方形的长是宽的 2 倍，宽是 ${b} 厘米。它的周长是多少厘米？`, (b * 2 + b) * 2,
    `第1步 先求长：${b} × 2 = ${b * 2}（厘米）；\n第2步 求周长：（${b * 2} + ${b}）× 2 = ${(b * 3) * 2}（厘米）。`, null, '厘米')
}

// ============================================================
//  第8单元 分数的初步认识
// ============================================================
const F = (a, b) => `${a}/${b}`
function u8Shade() {
  const shape = pick(['pie', 'bar', 'grid']), n = shape === 'grid' ? pick([6, 8, 10]) : R(4, 8), k = R(1, n - 1)
  return shadeQ('mid', `涂一涂：点格子，涂出这个图形的 ${F(k, n)}`, shape, n, k,
    `${F(k, n)} 的意思是：把整个图形平均分成 ${n} 份，取其中的 ${k} 份。\n所以要涂 ${k} 份（分母 ${n} 是一共几份，分子 ${k} 是涂几份）。`)
}
function u8Read() {
  const shape = pick(['pie', 'bar']), n = R(4, 9), k = R(1, n - 1), ans = F(k, n)
  return choice('mid', '涂色部分占整个图形的几分之几？', ans, opts4(ans, [F(n, k), F(n - k, n), F(k, n - k)], () => F(R(1, n), n + R(1, 3))),
    `数一数：一共平均分成了 ${n} 份，涂色的有 ${k} 份。\n所以是 ${ans}（读作 ${n} 分之 ${k}）。\n⚠️ 易错：分母写“一共几份”，分子写“涂了几份”，不要写反；\n也不要用“没涂的份数”当分母。`, shadedFig(shape, n, k))
}
function u8Cmp() {
  if (Math.random() < 0.5) { let a = R(2, 9), b = R(2, 9); if (a === b) b = a + 1; return cmpQ('mid', `1/${a} ○ 1/${b}`, 1 / a, 1 / b, `分子都是 1 时：分母越大，平均分的份数越多，每一份就越小。\n${a} ${a < b ? '<' : '>'} ${b}，所以 1/${a} ${a < b ? '>' : '<'} 1/${b}。\n⚠️ 易错：不是分母大，分数就大！`) }
  const n = R(5, 12), a = R(1, n - 1), b = R(1, n - 1)
  return cmpQ('mid', `${a}/${n} ○ ${b}/${n}`, a, b, `分母相同，说明每一份一样大，\n分子大的，取的份数多，分数就大。`)
}
function u8Order() {
  if (Math.random() < 0.5) {
    const ds = shuffle([2, 3, 4, 5, 6, 8, 9, 10]).slice(0, 4).sort((a, b) => b - a)
    return orderQ('mid', '按从小到大的顺序，依次点一点', ds.map(d => F(1, d)), `分子都是 1，分母越大，分数越小：\n${ds.map(d => F(1, d)).join(' < ')}`)
  }
  const n = R(7, 12), ks = shuffle(Array.from({ length: n - 1 }, (_, i) => i + 1)).slice(0, 4).sort((a, b) => a - b)
  return orderQ('mid', '按从小到大的顺序，依次点一点', ks.map(k => F(k, n)), `分母相同，比分子：分子越大，分数越大。\n${ks.map(k => F(k, n)).join(' < ')}`)
}
function u8Calc() {
  const n = R(5, 12), more = () => F(R(1, n - 1), n)
  if (Math.random() < 0.5) { const a = R(1, n - 2), b = R(1, n - 1 - a); return choice('mid', `${a}/${n} + ${b}/${n} =`, F(a + b, n), opts4(F(a + b, n), [F(a + b, n * 2), F(a + b, n + n), F(a * b, n)], more), `同分母分数相加：分母不变，分子相加。\n${a}/${n} + ${b}/${n} = ${a + b}/${n}\n⚠️ 易错：分母不能相加！${n} 份里的 ${a} 份加 ${b} 份，还是 ${n} 份里的 ${a + b} 份。`) }
  const a = R(1, n - 1)
  return choice('mid', `1 − ${a}/${n} =`, F(n - a, n), opts4(F(n - a, n), [F(a, n), F(n - a, n * 2), F(1, n)], more), `把 1 看成 ${n}/${n}，\n${n}/${n} − ${a}/${n} = ${n - a}/${n}。`)
}
function u8Calc3() {
  const n = R(7, 12), a = R(1, 3), b = R(1, n - a - 2), r = n - a - b
  return choice('hard', `1 − ${a}/${n} − ${b}/${n} =`, F(r, n), opts4(F(r, n), [F(a + b, n), F(r, n * 2), F(r + 1, n)], () => F(R(1, n - 1), n)),
    `把 1 看成 ${n}/${n}：\n${n}/${n} − ${a}/${n} = ${n - a}/${n}，\n${n - a}/${n} − ${b}/${n} = ${r}/${n}。`)
}
function u8Qty() {
  const n = pick([3, 4, 5, 6]), per = R(2, 6), k = R(1, n - 1), tot = n * per
  const thing = pick(['个苹果', '颗糖', '支铅笔', '块巧克力'])
  return input('hard', `一共有 ${tot} ${thing}，它的 ${F(k, n)} 是多少${thing[0] === '个' ? '个' : thing[0]}？`, per * k,
    `${F(k, n)} 就是把 ${tot} 平均分成 ${n} 份，取其中的 ${k} 份。\n第1步 每份：${tot} ÷ ${n} = ${per}；\n第2步 ${k} 份：${per} × ${k} = ${per * k}。`)
}
function u8Left() {
  const n = R(7, 12), a = R(1, 3), b = R(1, n - a - 2), r = n - a - b
  return choice('hard', `一本书，薇薇第一天看了全书的 ${a}/${n}，第二天看了全书的 ${b}/${n}。还剩全书的几分之几没看？`, F(r, n),
    opts4(F(r, n), [F(a + b, n), F(n - a, n), F(n - b, n)], () => F(R(1, n - 1), n)),
    `把整本书看作 1，也就是 ${n}/${n}。\n两天一共看了：${a}/${n} + ${b}/${n} = ${a + b}/${n}；\n还剩：${n}/${n} − ${a + b}/${n} = ${r}/${n}。`)
}
function u8Who() {
  const [x, y] = shuffle(NAMES).slice(0, 2), a = R(3, 6), b = a + R(1, 4)
  return choice('hard', `${x} 吃了一块饼的 1/${a}，${y} 吃了同样一块饼的 1/${b}。谁吃得多？`, x, [x, y, '一样多'],
    `分子都是 1，分母越小，每份越大。\n${a} < ${b}，所以 1/${a} > 1/${b}，${x} 吃得多。\n⚠️ 易错：不能看到 ${b} 比 ${a} 大，就以为 ${y} 吃得多。`, null, true)
}

// ============================================================
//  第9单元 数学广角——集合
// ============================================================
const ACTS = ['跳绳', '踢毽', '画画', '唱歌', '下棋', '跑步', '书法', '舞蹈']
function u9Total() {
  const a = R(8, 16), b = R(7, 15), both = R(2, Math.min(a, b) - 2), [x, y] = shuffle(ACTS).slice(0, 2)
  return input('mid', `三(1)班参加${x}的有 ${a} 人，参加${y}的有 ${b} 人，两项都参加的有 ${both} 人。参加这两项的一共有多少人？`, a + b - both,
    `画两个圈（看图），中间重叠的部分就是两项都参加的 ${both} 人。\n${a} + ${b} = ${a + b}，这时两项都参加的 ${both} 人被数了两次，\n要减去一次：${a + b} − ${both} = ${a + b - both}（人）。`, vennSvg(x, y), '人')
}
function u9Both() {
  const a = R(8, 16), b = R(7, 15), both = R(2, Math.min(a, b) - 2), tot = a + b - both, [x, y] = shuffle(ACTS).slice(0, 2)
  return input('hard', `参加${x}的有 ${a} 人，参加${y}的有 ${b} 人，参加这两项的一共有 ${tot} 人。两项都参加的有多少人？`, both,
    `${a} + ${b} = ${a + b}（人），比实际的 ${tot} 人多，\n多出来的就是被数了两次的人：${a + b} − ${tot} = ${both}（人）。`, vennSvg(x, y), '人')
}
function u9Only() {
  const a = R(9, 16), b = R(7, 15), both = R(2, Math.min(a, b) - 2), [x, y] = shuffle(ACTS).slice(0, 2)
  return input('hard', `参加${x}的有 ${a} 人，参加${y}的有 ${b} 人，其中两项都参加的有 ${both} 人。只参加${x}的有多少人？`, a - both,
    `参加${x}的 ${a} 人里，包括了两项都参加的 ${both} 人，\n只参加${x}：${a} − ${both} = ${a - both}（人）。`, vennSvg(x, y), '人')
}
function u9Queue() {
  const l = R(4, 12), r = R(4, 12), n = pick(NAMES)
  if (Math.random() < 0.5) return input('hard', `同学们排成一队，${n} 从左数是第 ${l} 个，从右数是第 ${r} 个。这一队一共有多少人？`, l + r - 1,
    `从左数的 ${l} 人和从右数的 ${r} 人里，都包括了 ${n}，${n} 被数了两次。\n${l} + ${r} − 1 = ${l + r - 1}（人）。\n⚠️ 易错：不能直接 ${l} + ${r}。`, null, '人')
  return input('hard', `同学们排成一队，${n} 前面有 ${l} 人，后面有 ${r} 人。这一队一共有多少人？`, l + r + 1,
    `前面 ${l} 人和后面 ${r} 人都不包括 ${n} 自己，\n${l} + ${r} + 1 = ${l + r + 1}（人）。\n⚠️ 易错：别忘了加上 ${n} 自己。`, null, '人')
}

// ============================================================
//  单元表
// ============================================================
const UNITS = [
  { name: '时、分、秒', icon: '⏰', color: '#6c7cf5', mid: [u1Read, u1Set, u1Set, u1Conv, u1Cmp, u1Order, u1Pop], hard: [u1Elapsed, u1End, u1Start, u1Schedule, u1Race] },
  { name: '万以内加减法（一）', icon: '➕', color: '#ff8a5c', mid: [u2Oral, u2Tens, u2Match, u2Est], hard: [u2Bus, u2More, u2Box, u2Enough] },
  { name: '测量', icon: '📏', color: '#3fbf9f', mid: [u3Conv, u3Conv, u3Cmp, u3Order, u3Unit], hard: [u3Truck, u3Bridge, u3Rope, u3Animal] },
  { name: '万以内加减法（二）', icon: '🧮', color: '#f2b134', mid: [u4Vert, u4Vert, u4Calc, u4Check], hard: [u4Zero, u4Books, u4Total, u4MaxMin, u4Shop] },
  { name: '倍的认识', icon: '✖️', color: '#e86aa6', mid: [u5Basic, u5Fig, u5Match], hard: [u5Sum, u5More, u5Rev, u5Diff] },
  { name: '多位数乘一位数', icon: '🚀', color: '#5aa9e6', mid: [u6Vert, u6Vert, u6Oral, u6Pop, u6Est], hard: [u6Zero, u6Word, u6Word, u6Box] },
  { name: '长方形和正方形', icon: '🟦', color: '#8b6cf0', mid: [u7Peri, u7Peri, u7Wire, u7Judge], hard: [u7Join, u7Cut, u7Wall, u7Double] },
  { name: '分数的初步认识', icon: '🍰', color: '#ff6f6f', mid: [u8Shade, u8Read, u8Cmp, u8Order, u8Calc], hard: [u8Calc3, u8Qty, u8Left, u8Who] },
  { name: '数学广角——集合', icon: '⭕', color: '#2ec4b6', mid: [u9Total], hard: [u9Both, u9Only, u9Queue] },
]

const qKey = q => q.type + '|' + q.q + '|' + (q.fig || '') + (q.items ? JSON.stringify(q.items) : '')
// 从若干单元里出题：nMid 道中等 + nHard 道难题（难题排在后面，像试卷一样由易到难）
function makeSet(units, nMid, nHard) {
  const out = [], seen = new Set()
  const take = (kind, n) => {
    let order = []
    while (order.length < n) order = order.concat(shuffle(units))
    let i = 0, guard = 0
    while (i < n && guard++ < 400) {
      const u = order[i], q = pick(UNITS[u][kind])()
      const k = qKey(q)
      if (seen.has(k)) continue
      seen.add(k); q.unit = u
      if (q.type === 'choice' && !q.keep) q.options = shuffle(q.options)
      out.push(q); i++
    }
  }
  take('mid', nMid); take('hard', nHard)
  return out
}
const makeLevel = (unit, lv) => (lv === 3 ? makeSet([unit], 8, 4) : makeSet([unit], 7, 3))

window.MATH = { UNITS, makeSet, makeLevel, shuffle, clockSvg, shapeParts, qKey }
