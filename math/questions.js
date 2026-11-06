// ============================================================
//  三年级上册数学 · 出题器（人教版）
//  每个单元有若干“出题函数”，每次调用随机出一道新题，做不完。
//  题目格式：
//   { type: 'choice' | 'input', q: 题目, answer: 正确答案(字符串),
//     options: [选项...](选择题才有), fig: 图(svg字符串，可没有),
//     tip: 答错时显示的讲解, keep: true 表示选项不打乱 }
//  分数写成 3/8 这样，页面会自动显示成上下分数。
// ============================================================

const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = arr => arr[R(0, arr.length - 1)]
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const NAMES = ['小明', '小红', '小刚', '小丽', '乐乐', '豆豆', '笑笑', '天天']

// 数字选择题的 4 个选项（1 个对 + 3 个容易错的）
function numOpts(ans, extra) {
  const set = [ans]
  let c = (extra || []).concat([ans + 10, ans - 10, ans + 1, ans - 1, ans + 100, ans - 100, ans + 2])
  c = shuffle(c)
  for (const x of c) if (set.length < 4 && x > 0 && !set.includes(x)) set.push(x)
  while (set.length < 4) { const x = ans + R(3, 30); if (!set.includes(x)) set.push(x) }
  return set.map(String)
}
// 选项去重并补足 4 个：ans 正确答案，cands 干扰项，more() 再生成一个干扰项
function opts4(ans, cands, more) {
  const set = [String(ans)]
  const bad = x => /^0\/|\/0$|\/1$|^-|^0$/.test(x)
  for (const c of cands) { const x = String(c); if (set.length < 4 && !set.includes(x) && !bad(x)) set.push(x) }
  let g = 0
  while (set.length < 4 && g++ < 60) { const x = String(more()); if (!set.includes(x) && !bad(x)) set.push(x) }
  return set
}
const input = (q, ans, tip, fig) => ({ type: 'input', q, answer: String(ans), tip: tip || '', fig })
const choice = (q, ans, options, tip, fig, keep) =>
  ({ type: 'choice', q, answer: String(ans), options: options.map(String), tip: tip || '', fig, keep: !!keep })
const cmp = (a, b) => (a > b ? '>' : a < b ? '<' : '=')
const cmpQ = (q, a, b, tip) => choice(q, cmp(a, b), ['>', '<', '='], tip, null, true)

// ---------------- 画图 ----------------
function clockSvg(h, m) {
  let s = '<svg viewBox="0 0 200 200" class="fig clock"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#4a5bd4" stroke-width="6"/>'
  for (let i = 0; i < 60; i++) {
    const a = i * 6 * Math.PI / 180, big = i % 5 === 0
    const r1 = big ? 76 : 82, r2 = 86
    s += `<line x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}" stroke="#555" stroke-width="${big ? 3 : 1}"/>`
  }
  for (let n = 1; n <= 12; n++) {
    const a = n * 30 * Math.PI / 180
    s += `<text x="${100 + 62 * Math.sin(a)}" y="${100 - 62 * Math.cos(a) + 7}" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">${n}</text>`
  }
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6
  s += `<line x1="100" y1="100" x2="100" y2="58" stroke="#e8505b" stroke-width="8" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>`
  s += `<line x1="100" y1="100" x2="100" y2="30" stroke="#333" stroke-width="5" stroke-linecap="round" transform="rotate(${ma} 100 100)"/>`
  s += '<circle cx="100" cy="100" r="6" fill="#333"/></svg>'
  return s
}
function pieSvg(n, k) {
  let s = '<svg viewBox="0 0 200 200" class="fig">'
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * 2 * Math.PI, a2 = ((i + 1) / n) * 2 * Math.PI
    const x1 = 100 + 85 * Math.sin(a1), y1 = 100 - 85 * Math.cos(a1)
    const x2 = 100 + 85 * Math.sin(a2), y2 = 100 - 85 * Math.cos(a2)
    s += `<path d="M100 100 L${x1} ${y1} A85 85 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z" fill="${i < k ? '#ffb340' : '#fff'}" stroke="#4a5bd4" stroke-width="3"/>`
  }
  return s + '</svg>'
}
function barSvg(n, k) {
  const w = 280 / n
  let s = '<svg viewBox="0 0 300 80" class="fig wide">'
  for (let i = 0; i < n; i++) s += `<rect x="${10 + i * w}" y="10" width="${w}" height="60" fill="${i < k ? '#5ccf8f' : '#fff'}" stroke="#4a5bd4" stroke-width="3"/>`
  return s + '</svg>'
}
function rectSvg(a, b, unit) {
  // a 长，b 宽；按比例画
  const sc = Math.min(180 / a, 110 / b), W = a * sc, H = b * sc
  const x = (300 - W) / 2 - 25, y = (170 - H) / 2 + 5
  return `<svg viewBox="0 0 300 180" class="fig wide"><rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#e6f0ff" stroke="#4a5bd4" stroke-width="4"/>` +
    `<text x="150" y="${y - 8}" text-anchor="middle" font-size="18" fill="#333">${a}${unit}</text>` +
    `<text x="${x + W + 8}" y="${y + H / 2 + 6}" font-size="18" fill="#333">${b}${unit}</text></svg>`
}
function squareSvg(a, unit) {
  return `<svg viewBox="0 0 300 180" class="fig wide"><rect x="95" y="25" width="110" height="110" fill="#fff4e0" stroke="#ff9f1c" stroke-width="4"/>` +
    `<text x="150" y="18" text-anchor="middle" font-size="18" fill="#333">${a}${unit}</text></svg>`
}

// ============== 第1单元 时、分、秒 ==============
const hm = (h, m) => (m === 0 ? `${h}时整` : `${h}时${m}分`)
function u1Clock(d) {
  const h = R(1, 12), m = d === 1 ? R(0, 11) * 5 : R(0, 59)
  if (m === 0) {
    const ans = `${h}时整`
    return choice('钟面上是几时？', ans, opts4(ans, [`${(h % 12) + 1}时整`, h === 12 ? '6时整' : `12时${h * 5}分`, `${h}时30分`], () => `${R(1, 12)}时整`),
      '长长的分针指着12，短短的时针指着几，就是几时整。', clockSvg(h, 0))
  }
  const swapH = Math.round(m / 5) || 12
  const o = [hm(h, m), hm(h === 12 ? 1 : h + 1, m), hm(h === 1 ? 12 : h - 1, m), hm(swapH, (h * 5) % 60)]
  return choice('钟面上是几时几分？', o[0], opts4(o[0], o.slice(1), () => hm(h, (m + R(1, 11) * 5) % 60)),
    `红色短针是时针，刚走过${h}，所以是${h}时；黑色长针是分针，每一大格是5分，指着${m}分。`, clockSvg(h, m))
}
function u1Convert(d) {
  const t = pick(d === 1 ? [0, 1, 2] : [0, 1, 2, 3, 4])
  if (t === 0) { const a = R(2, 9); return input(`${a}分 =（  ）秒`, a * 60, `1分=60秒，${a}分就是${a}个60秒，${a}×60=${a * 60}。`) }
  if (t === 1) { const a = R(2, 9); return input(`${a}时 =（  ）分`, a * 60, `1时=60分，${a}×60=${a * 60}。`) }
  if (t === 2) { const a = R(2, 6); return input(`${a * 60}秒 =（  ）分`, a, `60秒=1分，${a * 60}里面有${a}个60。`) }
  if (t === 3) { const a = R(1, 3), b = R(1, 5) * 10; return input(`${a}分${b}秒 =（  ）秒`, a * 60 + b, `${a}分=${a * 60}秒，再加${b}秒，共${a * 60 + b}秒。`) }
  const a = R(1, 2), b = R(1, 5) * 10
  return input(`${a * 60 + b}分 =（  ）时${b}分`, a, `${a * 60 + b}分里有${a}个60分，就是${a}时，还剩${b}分。`)
}
function u1Unit() {
  const items = [['眨一下眼睛大约用1（ ）', '秒'], ['上一节课大约40（ ）', '分'], ['每天睡觉大约9（ ）', '时'],
    ['跑50米大约用10（ ）', '秒'], ['刷一次牙大约3（ ）', '分'], ['看一场电影大约2（ ）', '时'],
    ['做一次眼保健操大约5（ ）', '分'], ['跳绳10下大约用8（ ）', '秒'], ['一天在学校大约7（ ）', '时']]
  const [q, a] = pick(items)
  return choice(q + '，括号里填什么单位？', a, ['时', '分', '秒'], '想一想：秒最短，分比秒长，时最长。', null, true)
}
function u1Elapsed() {
  const h = R(7, 10), m = R(2, 10) * 5, dur = R(3, 10) * 5
  let eh = h, em = m + dur
  if (em >= 60) { eh++; em -= 60 }
  return input(`从${hm(h, m)}到${hm(eh, em)}，经过了多少分钟？`, dur,
    `从${hm(h, m)}到${eh === h || em === 0 ? hm(eh, em) : eh + '时整'}${eh === h || em === 0 ? '' : '是' + (60 - m) + '分，再到' + hm(eh, em) + '是' + em + '分'}，一共${dur}分。`)
}
function u1Race() {
  const [a, b] = shuffle(NAMES).slice(0, 2)
  const ta = R(52, 59), tb = 60 + R(1, 9)
  return choice(`跑步比赛，${a}用了${ta}秒，${b}用了1分${tb - 60}秒。谁跑得快？`, a, [a, b, '一样快'],
    `1分${tb - 60}秒=${tb}秒，比${ta}秒多，用时少的跑得快，所以${a}快。`, null, true)
}
function u1Later() {
  const h = R(8, 15), m = R(0, 5) * 10, dur = R(2, 5) * 10
  let em = m + dur, eh = h
  if (em >= 60) { em -= 60; eh++ }
  const ans = hm(eh, em)
  return choice(`动画片${hm(h, m)}开始，播了${dur}分钟，几时几分结束？`, ans, opts4(ans, [hm(eh + 1, em), hm(h, dur), hm(eh, (em + 10) % 60)], () => hm(eh, R(0, 5) * 10)),
    `从${hm(h, m)}往后数${dur}分钟，是${ans}。`)
}

// ============== 第2单元 万以内的加法和减法（一） ==============
function u2Two(d) {
  if (Math.random() < 0.5) {
    let a, b
    do { a = R(12, 79); b = R(11, 89 - a + 10) } while (a + b > 99 || (d > 1 && a % 10 + b % 10 < 10))
    return input(`${a} + ${b} =`, a + b, `先算${a}+${b - b % 10}=${a + b - b % 10}，再加${b % 10}，得${a + b}。`)
  }
  let a, b
  do { a = R(30, 99); b = R(11, a - 5) } while (d > 1 && a % 10 >= b % 10)
  return input(`${a} − ${b} =`, a - b, `先算${a}−${b - b % 10}=${a - b + b % 10}，再减${b % 10}，得${a - b}。`)
}
function u2Hundreds() {
  const a = R(12, 68) * 10
  if (Math.random() < 0.5) { const b = R(11, 90 - a / 10) * 10; return input(`${a} + ${b} =`, a + b, `${a / 10}个十加${b / 10}个十是${(a + b) / 10}个十，就是${a + b}。`) }
  const b = R(11, a / 10 - 1) * 10
  return input(`${a} − ${b} =`, a - b, `${a / 10}个十减${b / 10}个十是${(a - b) / 10}个十，就是${a - b}。`)
}
function u2Estimate() {
  const a = R(2, 6) * 100 + pick([-3, -2, -1, 1, 2, 3]), b = R(1, 3) * 100 + pick([-2, -1, 1, 2])
  const ans = Math.round(a / 100) * 100 + Math.round(b / 100) * 100
  return choice(`估一估：${a} + ${b} 大约是多少？`, ans, opts4(ans, [ans + 100, ans - 100, ans + 200], () => ans + 300),
    `${a}接近${Math.round(a / 100) * 100}，${b}接近${Math.round(b / 100) * 100}，加起来大约是${ans}。`)
}
function u2Word() {
  const n = pick(NAMES)
  const t = R(0, 2)
  if (t === 0) { const a = R(25, 60), b = R(18, 39); return input(`${n}有${a}张贴纸，又买了${b}张，现在一共有多少张？`, a + b, `求一共有多少，用加法：${a}+${b}=${a + b}。`) }
  if (t === 1) { const a = R(52, 95), b = R(17, 45); return input(`一本书有${a}页，${n}已经看了${b}页，还剩多少页没看？`, a - b, `求还剩多少，用减法：${a}−${b}=${a - b}。`) }
  const a = R(35, 80), b = R(12, 30)
  return input(`三年级一班收集了${a}个瓶子，二班比一班少${b}个，二班收集了多少个？`, a - b, `比一班少，就用一班的减去${b}：${a}−${b}=${a - b}。`)
}

// ============== 第3单元 测量 ==============
const LEN_UNITS = ['毫米', '厘米', '分米', '米', '千米']
const W_UNITS = ['克', '千克', '吨']
function u3Convert(d) {
  const list = [
    () => { const a = R(2, 9); return [`${a}厘米 =（  ）毫米`, a * 10, '1厘米=10毫米'] },
    () => { const a = R(2, 9); return [`${a * 10}毫米 =（  ）厘米`, a, '10毫米=1厘米'] },
    () => { const a = R(2, 9); return [`${a}分米 =（  ）厘米`, a * 10, '1分米=10厘米'] },
    () => { const a = R(2, 9); return [`${a}米 =（  ）分米`, a * 10, '1米=10分米'] },
    () => { const a = R(2, 9); return [`${a}米 =（  ）厘米`, a * 100, '1米=100厘米'] },
    () => { const a = R(2, 9); return [`${a}千米 =（  ）米`, a * 1000, '1千米=1000米'] },
    () => { const a = R(2, 9); return [`${a * 1000}米 =（  ）千米`, a, '1000米=1千米'] },
    () => { const a = R(2, 9); return [`${a}千克 =（  ）克`, a * 1000, '1千克=1000克'] },
    () => { const a = R(2, 9); return [`${a}吨 =（  ）千克`, a * 1000, '1吨=1000千克'] },
    () => { const a = R(2, 9); return [`${a * 1000}千克 =（  ）吨`, a, '1000千克=1吨'] },
  ]
  if (d > 1) list.push(
    () => { const a = R(1, 9), b = R(1, 9); return [`${a}厘米${b}毫米 =（  ）毫米`, a * 10 + b, `${a}厘米=${a * 10}毫米，再加${b}毫米`] },
    () => { const a = R(1, 4), b = R(1, 9) * 100; return [`${a}千米${b}米 =（  ）米`, a * 1000 + b, `${a}千米=${a * 1000}米，再加${b}米`] },
    () => { const a = R(2, 8); return [`1米 − ${a}分米 =（  ）分米`, 10 - a, `1米=10分米，10−${a}=${10 - a}`] },
  )
  const [q, a, tip] = pick(list)()
  return input(q, a, tip + '。')
}
function u3Unit() {
  const len = [['一枚1元硬币厚约2（ ）', '毫米'], ['一支铅笔长约18（ ）', '厘米'], ['课桌高约7（ ）', '分米'], ['黑板长约4（ ）', '米'],
    ['从学校到公园约3（ ）', '千米'], ['一本数学书厚约6（ ）', '毫米'], ['小明的身高约130（ ）', '厘米'], ['汽车每小时行驶60（ ）', '千米'],
    ['床长约2（ ）', '米'], ['大拇指的指甲宽约1（ ）', '厘米']]
  const wt = [['一头大象重约5（ ）', '吨'], ['一个鸡蛋重约50（ ）', '克'], ['三年级同学体重约30（ ）', '千克'], ['一袋大米重约10（ ）', '千克'],
    ['一辆卡车能装4（ ）货物', '吨'], ['一个苹果重约200（ ）', '克'], ['一头鲸重约150（ ）', '吨'], ['一枚2分硬币重约1（ ）', '克']]
  if (Math.random() < 0.55) {
    const [q, a] = pick(len)
    const o = shuffle(LEN_UNITS.filter(x => x !== a)).slice(0, 3).concat(a)
    return choice(q + '，填什么单位？', a, LEN_UNITS.filter(x => o.includes(x)), '想一想身边的东西：1毫米很薄，1厘米约指甲宽，1分米约手掌宽，1米约一大步多，1千米要走十几分钟。', null, true)
  }
  const [q, a] = pick(wt)
  return choice(q + '，填什么单位？', a, W_UNITS, '1克很轻（像一枚2分硬币），1千克像两袋盐，1吨像一辆小汽车那么重。', null, true)
}
function u3Compare() {
  const t = R(0, 3)
  if (t === 0) { const a = R(2, 6), b = a * 1000 + pick([-100, 0, 100, -10]); return cmpQ(`${a}千米 ○ ${b}米`, a * 1000, b, `${a}千米=${a * 1000}米，再和${b}米比。`) }
  if (t === 1) { const a = R(2, 9), b = a * 10 + pick([-2, 0, 3]); return cmpQ(`${a}厘米 ○ ${b}毫米`, a * 10, b, `${a}厘米=${a * 10}毫米，再和${b}毫米比。`) }
  if (t === 2) { const a = R(2, 6), b = a * 1000 + pick([-500, 0, 200]); return cmpQ(`${a}吨 ○ ${b}千克`, a * 1000, b, `${a}吨=${a * 1000}千克。`) }
  return cmpQ('1千克铁 ○ 1千克棉花', 1, 1, '都是1千克，一样重！')
}
function u3Word() {
  const t = R(0, 2)
  if (t === 0) { const a = R(3, 8) * 100, b = R(2, 6) * 100; return input(`一辆货车已经装了${a}千克货物，再装${b}千克就满了。这辆货车能装多少千克？`, a + b, `${a}+${b}=${a + b}（千克）。`) }
  if (t === 1) { const a = R(3, 9) * 100; return input(`小明家离学校${a}米，他上学、放学走一个来回，一共走多少米？`, a * 2, `一个来回就是走两次：${a}+${a}=${a * 2}（米）。`) }
  const a = R(2, 5), b = R(2, 8) * 100
  return input(`一座桥限重${a}吨，一辆车自身重${b}千克，最多还能装多少千克的货物？`, a * 1000 - b, `${a}吨=${a * 1000}千克，${a * 1000}−${b}=${a * 1000 - b}（千克）。`)
}

// ============== 第4单元 万以内的加法和减法（二） ==============
function u4Calc(d) {
  if (Math.random() < 0.5) {
    const a = R(105, 699), b = R(102, 990 - a)
    return input(`${a} + ${b} =`, a + b, `列竖式，相同数位对齐，从个位加起，满十向前一位进1。`)
  }
  let a = R(300, 999), b = R(105, a - 50)
  if (d >= 3 && Math.random() < 0.5) { a = R(3, 9) * 100 + pick([0, 0, 4]); b = R(101, a - 20) }
  return input(`${a} − ${b} =`, a - b, `列竖式，从个位减起，不够减就从前一位退1当10。中间有0时，要从百位退1。`)
}
function u4Check() {
  const a = R(210, 690), b = R(120, 300)
  const s = a + b
  return choice(`验算 ${s} − ${b} = ${a}，可以用哪个算式？`, `${a} + ${b}`, [`${a} + ${b}`, `${s} + ${b}`, `${a} − ${b}`, `${s} − ${a} − ${b}`],
    '减法可以用加法验算：差 + 减数 = 被减数。')
}
function u4Word() {
  const t = R(0, 3)
  if (t === 0) { const a = R(250, 480), b = R(180, 420); return input(`学校有男生${a}人，女生${b}人，一共有多少人？`, a + b, `${a}+${b}=${a + b}（人）。`) }
  if (t === 1) { const a = R(500, 900), b = R(180, 450); return input(`图书馆有${a}本故事书，借出${b}本，还剩多少本？`, a - b, `${a}−${b}=${a - b}（本）。`) }
  if (t === 2) { const a = R(320, 480), b = R(150, 250); return choice(`妈妈带了${a + b - R(1, 60)}元，想买一台${a}元的电风扇和一个${b}元的电饭锅，钱够吗？`, '不够', ['够', '不够'], `${a}+${b}=${a + b}，比带的钱多，所以不够。`, null, true) }
  const a = R(220, 380), b = R(120, 260)
  return choice(`妈妈带了500元，想买一个${a}元的书包和一双${b}元的鞋，钱够吗？`, a + b <= 500 ? '够' : '不够', ['够', '不够'],
    `${a}+${b}=${a + b}，${a + b <= 500 ? '不超过500，够了' : '超过了500，不够'}。`, null, true)
}

// ============== 第5单元 倍的认识 ==============
function u5Times(d) {
  const t = R(0, d === 1 ? 1 : 3), b = R(2, 9), k = R(2, 9)
  if (t === 0) return input(`${b * k}是${b}的几倍？`, k, `求${b * k}是${b}的几倍，就是求${b * k}里有几个${b}：${b * k}÷${b}=${k}。`)
  if (t === 1) return input(`${b}的${k}倍是多少？`, b * k, `求${b}的${k}倍，就是求${k}个${b}是多少：${b}×${k}=${b * k}。`)
  if (t === 2) return input(`一个数的${k}倍是${b * k}，这个数是多少？`, b, `${b * k}÷${k}=${b}。`)
  const [x, y] = shuffle(['白兔', '黑兔', '小鸡', '小鸭', '小鹅', '小羊']).slice(0, 2)
  if (Math.random() < 0.5) return input(`${x}有${b * k}只，${y}有${b}只，${x}是${y}的几倍？`, k, `${b * k}÷${b}=${k}，是${k}倍。`)
  return input(`${y}有${b}只，${x}的只数是${y}的${k}倍，${x}有多少只？`, b * k, `${b}×${k}=${b * k}（只）。`)
}
function u5Fig() {
  const b = R(2, 4), k = R(2, 5)
  const dot = (n, c) => Array(n).fill(`<span style="color:${c}">●</span>`).join('')
  const fig = `<div class="dots"><div>△：${dot(b, '#4a5bd4')}</div><div>○：${dot(b * k, '#ff9f1c')}</div></div>`
  return input('○的个数是△的几倍？', k, `把${b}个圈成一份，○有这样的${k}份，就是${k}倍。`, fig)
}

// ============== 第6单元 多位数乘一位数 ==============
function u6Oral(d) {
  const t = R(0, 2), k = R(2, 9)
  if (t === 0) { const a = R(1, 9) * 10; return input(`${a} × ${k} =`, a * k, `${a / 10}×${k}=${a / 10 * k}，再在末尾添一个0。`) }
  if (t === 1) { const a = R(1, 9) * 100; return input(`${a} × ${k} =`, a * k, `${a / 100}×${k}=${a / 100 * k}，再在末尾添两个0。`) }
  const a = R(11, d === 1 ? 33 : 49), kk = R(2, d === 1 ? 3 : 6)
  return input(`${a} × ${kk} =`, a * kk, `把${a}分成${a - a % 10}和${a % 10}：${a - a % 10}×${kk}=${(a - a % 10) * kk}，${a % 10}×${kk}=${a % 10 * kk}，合起来是${a * kk}。`)
}
function u6Written(d) {
  let a
  if (d === 2) a = Math.random() < 0.5 ? R(23, 98) : R(112, 489)
  else a = pick([R(1, 9) * 100 + R(1, 9), R(10, 99) * 10, R(112, 789)])
  const k = R(3, 9)
  let tip = '列竖式，用一位数去乘每一位，从个位乘起，哪一位满几十就向前一位进几。'
  if (String(a).includes('0')) tip += '因数中间或末尾有0时，0乘任何数都得0，别忘了加上进上来的数。'
  return input(`${a} × ${k} =`, a * k, tip)
}
function u6Estimate() {
  const a = R(2, 8) * 100 + pick([-2, -1, 1, 2, 3]), k = R(3, 6)
  const ans = Math.round(a / 100) * 100 * k
  return choice(`估一估：${a} × ${k} 大约是多少？`, ans, opts4(ans, [ans + 100 * k, ans - 100 * k, ans / k * 10], () => ans + R(1, 9) * 100),
    `${a}接近${Math.round(a / 100) * 100}，${Math.round(a / 100) * 100}×${k}=${ans}。`)
}
function u6Word() {
  const t = R(0, 2)
  if (t === 0) { const a = R(12, 45), k = R(3, 8); return input(`每盒彩笔有${a}支，${k}盒一共有多少支？`, a * k, `${a}×${k}=${a * k}（支）。`) }
  if (t === 1) { const a = R(120, 260), k = R(3, 5); return input(`一个书架${a}元，学校买了${k}个，一共要多少元？`, a * k, `${a}×${k}=${a * k}（元）。`) }
  const a = R(4, 9), b = R(3, 8), c = R(12, 25)
  return input(`一辆旅游车每排坐${a}人，有${c}排。另外还有${b}个座位。这辆车一共能坐多少人？`, a * c + b, `先算${c}排：${a}×${c}=${a * c}，再加${b}：${a * c}+${b}=${a * c + b}（人）。`)
}

// ============== 第7单元 长方形和正方形 ==============
function u7Peri(d) {
  if (Math.random() < 0.5) {
    const a = R(4, 15), b = R(2, a - 1)
    return input(`这个长方形的周长是多少厘米？`, (a + b) * 2, `长方形周长 =（长+宽）×2 =（${a}+${b}）×2 = ${(a + b) * 2}（厘米）。`, rectSvg(a, b, '厘米'))
  }
  const a = R(3, 12)
  return input(`这个正方形的周长是多少厘米？`, a * 4, `正方形周长 = 边长×4 = ${a}×4 = ${a * 4}（厘米）。`, squareSvg(a, '厘米'))
}
function u7Reverse() {
  if (Math.random() < 0.5) { const a = R(3, 15); return input(`一个正方形的周长是${a * 4}厘米，它的边长是多少厘米？`, a, `正方形四条边一样长：${a * 4}÷4=${a}（厘米）。`) }
  const a = R(6, 15), b = R(2, a - 1)
  return input(`一个长方形的周长是${(a + b) * 2}厘米，长是${a}厘米，宽是多少厘米？`, b, `长+宽=${(a + b) * 2}÷2=${a + b}，宽=${a + b}−${a}=${b}（厘米）。`)
}
function u7Judge() {
  const list = [['正方形是特殊的长方形。', '对'], ['长方形的4个角都是直角。', '对'], ['四边形都有4个直角。', '错'], ['正方形的4条边都相等。', '对'],
    ['周长相等的两个长方形，形状一定相同。', '错'], ['长方形的对边相等。', '对'], ['平行四边形是四边形。', '对'], ['有4个直角的四边形一定是正方形。', '错']]
  const [q, a] = pick(list)
  return choice('判断：' + q, a, ['对', '错'], a === '对' ? '这句话是对的。' : '这句话是错的，想一想有没有反例。', null, true)
}
function u7Word() {
  const t = R(0, 2)
  if (t === 0) { const a = R(3, 8); return input(`用两个边长${a}厘米的正方形拼成一个长方形，这个长方形的周长是多少厘米？`, a * 6, `拼成的长方形长${a * 2}厘米、宽${a}厘米：（${a * 2}+${a}）×2=${a * 6}（厘米）。`) }
  if (t === 1) { const a = R(10, 30), b = R(5, a - 2); return input(`一块长方形菜地，长${a}米，宽${b}米，四周围上篱笆，篱笆长多少米？`, (a + b) * 2, `求篱笆长就是求周长：（${a}+${b}）×2=${(a + b) * 2}（米）。`) }
  const a = R(2, 6) * 10
  return input(`一张正方形桌子，边长${a}分米，四周镶一圈花边，花边长多少分米？`, a * 4, `${a}×4=${a * 4}（分米）。`)
}

// ============== 第8单元 分数的初步认识 ==============
const F = (a, b) => `${a}/${b}`
function u8Fig(d) {
  const n = R(3, 8), k = d === 1 ? 1 : R(1, n - 1)
  const fig = Math.random() < 0.5 ? pieSvg(n, k) : barSvg(n, k)
  return choice('涂色部分占整个图形的几分之几？', F(k, n), opts4(F(k, n), [F(n, k), F(n - k, n), F(k, n + 1)], () => F(R(1, n), n + R(1, 3))),
    `平均分成${n}份，涂了${k}份，就是${k}/${n}。分母写分成几份，分子写涂了几份。`, fig)
}
function u8Compare(d) {
  const t = R(0, d === 1 ? 0 : 1)
  if (t === 0) { const n = R(2, 6), a = R(2, 9), b = R(2, 9); return cmpQ(`1/${a} ○ 1/${b}`, 1 / a, 1 / b, '分子都是1，分母越大，平均分的份数越多，每一份越小。') }
  const n = R(5, 12), a = R(1, n - 1), b = R(1, n - 1)
  return cmpQ(`${a}/${n} ○ ${b}/${n}`, a, b, '分母相同，分子大的分数就大。')
}
function u8Calc() {
  const n = R(4, 10)
  const more = () => F(R(1, n - 1), n)
  if (Math.random() < 0.4) { const a = R(1, n - 1); return choice(`1 − ${a}/${n} =`, F(n - a, n), opts4(F(n - a, n), [F(a, n), F(n - a, n * 2), F(1, n)], more), `把1看成${n}/${n}，${n}/${n}−${a}/${n}=${n - a}/${n}。`) }
  const a = R(1, n - 2), b = R(1, n - 1 - a)
  if (Math.random() < 0.5) return choice(`${a}/${n} + ${b}/${n} =`, F(a + b, n), opts4(F(a + b, n), [F(a + b, n * 2), F(a * b, n), F(a + b + 1, n)], more), '分母不变，分子相加。')
  const c = a + b
  return choice(`${c}/${n} − ${a}/${n} =`, F(b, n), opts4(F(b, n), [F(c + a, n), F(b + 1, n), F(b, n * 2)], more), '分母不变，分子相减。')
}
function u8Word(d) {
  const t = R(0, d >= 3 ? 2 : 1)
  if (t === 0) { const n = pick([4, 6, 8, 10]), k = R(1, n - 1), who = pick(NAMES); return choice(`一个蛋糕平均切成${n}块，${who}吃了${k}块，吃了这个蛋糕的几分之几？`, F(k, n), opts4(F(k, n), [F(n - k, n), F(n, k), F(1, n)], () => F(R(1, n), n + 1)), `平均分成${n}块，吃了${k}块，就是${k}/${n}。`) }
  if (t === 1) { const n = R(5, 9), a = R(1, 3), b = R(1, n - a - 1); return choice(`一根绳子，第一次用去${a}/${n}，第二次用去${b}/${n}，两次一共用去几分之几？`, F(a + b, n), opts4(F(a + b, n), [F(a + b, n * 2), F(n - a - b, n), F(a * b, n)], () => F(R(1, n - 1), n)), `${a}/${n}+${b}/${n}=${a + b}/${n}。`) }
  const n = pick([3, 4, 5, 6]), per = R(2, 5), k = R(1, n - 1)
  return input(`一盒巧克力有${n * per}块，${k}/${n}是多少块？`, per * k, `把${n * per}块平均分成${n}份，每份${per}块，${k}份就是${per * k}块。`)
}

// ============== 第9单元 数学广角——集合 ==============
function u9Set(d) {
  const a = R(6, 15), b = R(5, 14), both = R(2, Math.min(a, b) - 1)
  const [x, y] = shuffle(['跳绳', '踢毽', '画画', '唱歌', '下棋', '跑步']).slice(0, 2)
  const fig = `<svg viewBox="0 0 300 160" class="fig wide"><circle cx="115" cy="85" r="68" fill="rgba(74,91,212,.15)" stroke="#4a5bd4" stroke-width="3"/><circle cx="185" cy="85" r="68" fill="rgba(255,159,28,.18)" stroke="#ff9f1c" stroke-width="3"/><text x="85" y="22" font-size="16" fill="#4a5bd4">${x}</text><text x="185" y="22" font-size="16" fill="#e07b00">${y}</text></svg>`
  if (d === 1 || Math.random() < 0.6)
    return input(`参加${x}的有${a}人，参加${y}的有${b}人，两项都参加的有${both}人。一共有多少人？`, a + b - both, `${a}+${b}=${a + b}，两项都参加的${both}人被算了两次，要减去一次：${a + b}−${both}=${a + b - both}（人）。`, fig)
  return input(`参加${x}的有${a}人，参加${y}的有${b}人，一共有${a + b - both}人参加。两项都参加的有多少人？`, both, `${a}+${b}=${a + b}，比实际人数多算了${a + b}−${a + b - both}=${both}，这就是两项都参加的人数。`, fig)
}

// ============== 单元表 ==============
// g: [出题函数, 从第几关开始出现]   第1~3关难度递增，第4关是Boss（全部题型）
const UNITS = [
  { name: '时、分、秒', icon: '⏰', color: '#6c7cf5', g: [[u1Clock, 1], [u1Convert, 1], [u1Unit, 1], [u1Elapsed, 2], [u1Race, 2], [u1Later, 3]] },
  { name: '万以内加减法（一）', icon: '➕', color: '#ff8a5c', g: [[u2Two, 1], [u2Hundreds, 2], [u2Estimate, 3], [u2Word, 2]] },
  { name: '测量', icon: '📏', color: '#3fbf9f', g: [[u3Convert, 1], [u3Unit, 1], [u3Compare, 2], [u3Word, 3]] },
  { name: '万以内加减法（二）', icon: '🧮', color: '#f2b134', g: [[u4Calc, 1], [u4Check, 2], [u4Word, 2]] },
  { name: '倍的认识', icon: '✖️', color: '#e86aa6', g: [[u5Times, 1], [u5Fig, 1]] },
  { name: '多位数乘一位数', icon: '🚀', color: '#5aa9e6', g: [[u6Oral, 1], [u6Written, 2], [u6Estimate, 3], [u6Word, 2]] },
  { name: '长方形和正方形', icon: '🟦', color: '#8b6cf0', g: [[u7Peri, 1], [u7Judge, 1], [u7Reverse, 2], [u7Word, 3]] },
  { name: '分数的初步认识', icon: '🍰', color: '#ff6f6f', g: [[u8Fig, 1], [u8Compare, 1], [u8Calc, 2], [u8Word, 2]] },
  { name: '数学广角——集合', icon: '⭕', color: '#2ec4b6', g: [[u9Set, 1]] },
]

// 出一关的题：unit 单元序号，lv 关卡 0~3（3是Boss），n 题数
function makeLevel(unit, lv, n) {
  const d = lv + 1
  const gens = UNITS[unit].g.filter(([, from]) => from <= Math.min(d, 3))
  const qs = [], seen = new Set()
  let guard = 0
  while (qs.length < n && guard++ < 300) {
    // 新出现的题型多出一些
    const fresh = gens.filter(([, from]) => from === d)
    const [f] = fresh.length && Math.random() < 0.45 ? pick(fresh) : pick(gens)
    const q = f(d)
    if (seen.has(q.q + (q.fig || ''))) continue
    seen.add(q.q + (q.fig || ''))
    q.unit = unit
    if (q.type === 'choice' && !q.keep) q.options = shuffle(q.options)
    qs.push(q)
  }
  return qs
}

window.MATH = { UNITS, makeLevel, shuffle }
