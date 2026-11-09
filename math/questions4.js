// ============================================================
//  第七版：扩充题库
//  每个单元都加了很多新题型；一关里同一种题只出一次，重复练同类题只在错题本的专项训练里
// ============================================================
const TF = (diff, s, ok, why) => choice(diff, `判断对错：${s}。`, ok ? '对' : '错', ['对', '错'], why, null, true)
const pickTF = (diff, list) => { const [s, ok, why] = pick(list); return TF(diff, s, ok, typeof why === 'function' ? why() : why) }


// ============================================================
//  一、观察物体
// ============================================================
const OBS_TF = [
  ['从一个方向看一个正方体，最多能同时看到 3 个面', true, '站在斜上方看，最多能同时看到 3 个面（比如前面、右面、上面），后面和下面总是看不到。'],
  ['从一个方向看一个正方体，最多能同时看到 4 个面', false, '最多只能同时看到 3 个面。'],
  ['从不同方向观察同一个物体，看到的形状一定不同', false, '不一定。比如一个正方体，从正面、左面、上面看都是一样的正方形。'],
  ['从正面看形状相同的两个立体图形，一定是同一个立体图形', false, '不一定。后排被挡住的小正方体从正面看不见，所以不同的立体图形从正面看可能一样。'],
  ['从上面看，同一个位置摞得再高，也只能看到 1 个正方形', true, '对。从上往下看只看到最上面那一个面。'],
  ['从正面看，后排比前排高出来的部分也能看到', true, '对。比前排高的部分没有被挡住，所以能看到。'],
  ['用 4 个同样的小正方体搭成的立体图形，从正面看一定是 4 个正方形', false, '不一定。摞起来或放在后排被挡住时，从正面看到的正方形会少于 4 个。'],
  ['从左面看，就是人站在物体的左边去看', true, '对。观察方向是人站的位置，从左面看就是站在左边看。'],
  ['一个立体图形从正面看是 3 个正方形，它一定是用 3 个小正方体搭成的', false, '不一定。可能还有小正方体藏在后排被挡住，所以可能多于 3 个。'],
]
function obsJudge() { return pickTF('mid', OBS_TF) }
function viewDesc(h, d) {
  if (d === 'front') return '从左往右 ' + h[0].map((_, x) => Math.max(...h.map(r => r[x]))).join('、') + ' 层'
  if (d === 'left') return '从左往右 ' + h.map(r => Math.max(...r)).reverse().join('、') + ' 层'
  return h.slice().reverse().map((r, i) => (h.length > 1 ? (i === 0 ? '后排 ' : '前排 ') : '') + r.map(v => (v ? '■' : '□')).join('')).join('，')
}
function obsViewCount() {
  const h = cubeModel(4, 9), dir = pick(['front', 'left', 'top']), n = VIEW[dir](h).flat().filter(x => x).length
  return input('mid', `从${VNAME[dir]}看这个立体图形，看到的图形是由几个小正方形组成的？`, n,
    `从${VNAME[dir]}看：${viewDesc(h, dir)}。\n${dir === 'top' ? '有小正方体的位置各算 1 个' : '每一列最高几层就有几个'}，一共 ${n} 个小正方形。`, cubeSvg(h), '个')
}
function obsDiffView() {
  for (let g = 0; g < 120; g++) {
    const h = cubeModel(4, 9), f = gk(VIEW.front(h)), l = gk(VIEW.left(h)), t = gk(VIEW.top(h))
    const eq = [f === l, f === t, l === t]
    if (eq.filter(x => x).length > 1) continue
    const opts = ['正面和左面', '正面和上面', '左面和上面', '三个方向看到的都不一样']
    const k = eq.indexOf(true), ans = opts[k < 0 ? 3 : k]
    if (k < 0 && Math.random() < 0.6) continue
    return choice('mid', '观察这个立体图形，从哪两个方向看到的形状完全相同？', ans, opts,
      `分别想一想：\n正面：${viewDesc(h, 'front')}\n左面：${viewDesc(h, 'left')}\n上面：${viewDesc(h, 'top')}\n所以答案是：${ans}。`, cubeSvg(h), true)
  }
  return obsViewCount()
}
function obsMove() {
  for (let g = 0; g < 120; g++) {
    const h = cubeModel(5, 9), cells = []
    h.forEach((r, y) => r.forEach((v, x) => { if (v > 0) cells.push([y, x]) }))
    const [y, x] = pick(cells), dir = pick(['front', 'left', 'top']), h2 = h.map(r => r.slice()); h2[y][x]--
    const changed = gk(VIEW[dir](h)) !== gk(VIEW[dir](h2))
    if (!changed && Math.random() < 0.3) continue
    const pos = `${h.length > 1 ? (y === 0 ? '前排' : '后排') : ''}从左数第 ${x + 1} 摞`
    return choice('mid', `把${pos}最上面的 1 个小正方体拿走，从${VNAME[dir]}看到的形状会变吗？`, changed ? '会变' : '不会变', ['会变', '不会变'],
      `拿走前，从${VNAME[dir]}看：${viewDesc(h, dir)}\n拿走后，从${VNAME[dir]}看：${viewDesc(h2, dir)}\n所以${changed ? '会变' : '不会变'}。${changed ? '' : '\n⚠️ 拿走的那个被挡住了，或者旁边还有一样高的，所以看起来没变化。'}`, cubeSvg(h), true)
  }
}
function obsSameView() {
  for (let g = 0; g < 60; g++) {
    const dir = pick(['front', 'top', 'left']), base = cubeModel(4, 7), v = gk(VIEW[dir](base))
    const same = [base], seen = [gk(base)]; let odd = null
    for (let t = 0; t < 400 && (same.length < 3 || !odd); t++) {
      const m = cubeModel(4, 7), k = gk(m)
      if (seen.includes(k)) continue
      if (gk(VIEW[dir](m)) === v) { if (same.length < 3) { same.push(m); seen.push(k) } } else if (!odd) { odd = m; seen.push(k) }
    }
    if (same.length < 3 || !odd) continue
    return asHtml(choice('mid', `下面哪个立体图形，从${VNAME[dir]}看到的形状和另外三个不一样？`, cubeSvg(odd, 'copt'), shuffle(same.concat([odd])).map(m => cubeSvg(m, 'copt')),
      `另外三个从${VNAME[dir]}看都是：${viewDesc(base, dir)}；\n这一个从${VNAME[dir]}看是：${viewDesc(odd, dir)}，所以它不一样。`))
  }
  return obsDiffView()
}
function obsTopNum() {
  const h = cubeModel(5, 10), n = h.flat().reduce((a, b) => a + b, 0)
  return input('hard', '下图是从上面看到的形状，格子里的数表示这个位置摞了几个小正方体。一共用了几个小正方体？', n,
    `把每个格子里的数加起来：${h.flat().filter(v => v).join(' + ')} = ${n}（个）。`, numSvg(h), '个')
}
function obsMax() {
  for (let g = 0; g < 200; g++) {
    const hs = [R(1, 3), R(1, 3)].concat(Math.random() < 0.5 ? [R(1, 3)] : []), ls = [R(1, 3), R(1, 3)]
    if (Math.max(...hs) !== Math.max(...ls)) continue
    let mx = 0; const rows = []
    ls.forEach(l => { const r = hs.map(c => Math.min(c, l)); rows.push(r); mx += r.reduce((a, b) => a + b, 0) })
    const fig = `<div class="obsrow"><div class="small">从正面看${viewSvg(colsGrid(hs))}</div><div class="small">从左面看${viewSvg(colsGrid(ls))}</div></div>`
    return input('hard', `一个立体图形放在 ${ls.length} 排 × ${hs.length} 列的格子上，从正面看和从左面看的形状如下。它最多是用几个小正方体搭成的？`, mx,
      `每个位置能摞的层数，不能超过“正面看这一列的高度”，也不能超过“左面看这一排的高度”，取两个数里小的那个：\n${rows.map((r, i) => `第 ${i + 1} 排：${r.join(' + ')} = ${r.reduce((a, b) => a + b, 0)}`).join('\n')}\n最多一共 ${mx} 个。`, fig, '个')
  }
}
function obsFill8() {
  for (let g = 0; g < 300; g++) {
    const h = [[R(0, 2), R(0, 2)], [R(0, 2), R(0, 2)]], n = h.flat().reduce((a, b) => a + b, 0)
    if (n < 3 || n > 6) continue
    if (h[0].some((_, x) => h.every(r => r[x] === 0)) || h.some(r => r.every(v => v === 0)) || hiddenCube(h)) continue
    return input('hard', '至少再添几个同样大的小正方体，就能把它拼成一个大正方体？', 8 - n,
      `最小的大正方体：每层 2 × 2 = 4 个，摞 2 层，一共 4 × 2 = 8 个。\n现在有 ${n} 个，还要添：8 − ${n} = ${8 - n}（个）。`, cubeSvg(h), '个')
  }
  return obsTopNum()
}

// ============================================================
//  二、混合运算：更多应用题 + 新题型
// ============================================================
WORD.push(
  n => { const a = R(10, 15), k = R(3, 6), c = R(5, 20), v = a * k - c; return { q: `每盒铅笔有 ${a} 支，${n}买了 ${k} 盒，送给同学 ${c} 支。还剩多少支？`, v, u: '支', e: `${a} × ${k} − ${c}`, alts: [`${a} + ${k} − ${c}`, `(${a} − ${c}) × ${k}`, `${a} × ${k} + ${c}`], s: `第1步 一共买了：${a} × ${k} = ${a * k}（支）\n第2步 还剩：${a * k} − ${c} = ${v}（支）` } },
  n => { const a = R(25, 45), b = R(5, 15), c = R(4, 18), v = a - b + c; return { q: `公交车上有 ${a} 人，到站后下去 ${b} 人，又上来 ${c} 人。现在车上有多少人？`, v, u: '人', e: `${a} − ${b} + ${c}`, alts: [`${a} − (${b} + ${c})`, `${a} + ${b} − ${c}`, `${a} − ${b} − ${c}`], s: `只有加减法，从左往右算：\n第1步 下去后：${a} − ${b} = ${a - b}（人）\n第2步 上来后：${a - b} + ${c} = ${v}（人）` } },
  n => { const k = R(3, 8), per = R(4, 9), c = R(3, 15), N = k * per + c; return { q: `有 ${N} 个桃子，小猴先吃了 ${c} 个，剩下的平均分给 ${k} 只小猴，每只分到几个？`, v: per, u: '个', e: `(${N} − ${c}) ÷ ${k}`, alts: [`${N} − ${c} ÷ ${k}`, `${N} ÷ ${k} − ${c}`, `(${N} + ${c}) ÷ ${k}`], s: `第1步 剩下：${N} − ${c} = ${N - c}（个）\n第2步 每只分：${N - c} ÷ ${k} = ${per}（个）` } },
  n => { const r = R(4, 9), k = R(6, 9), c = R(3, 9), v = r * k + c; return { q: `教室里摆了 ${r} 排桌子，每排 ${k} 张，又搬来 ${c} 张。现在一共有多少张桌子？`, v, u: '张', e: `${r} × ${k} + ${c}`, alts: [`${r} × (${k} + ${c})`, `${r} + ${k} + ${c}`, `${r} × ${k} − ${c}`], s: `第1步 原来有：${r} × ${k} = ${r * k}（张）\n第2步 现在有：${r * k} + ${c} = ${v}（张）` } },
  n => { const p = R(15, 40), d = R(3, 9), k = R(2, 5), v = (p + d) * k; return { q: `一个足球 ${p} 元，一个篮球比足球贵 ${d} 元。学校买了 ${k} 个篮球，要花多少元？`, v, u: '元', e: `(${p} + ${d}) × ${k}`, alts: [`${p} + ${d} × ${k}`, `${p} × ${k} + ${d}`, `(${p} − ${d}) × ${k}`], s: `第1步 一个篮球：${p} + ${d} = ${p + d}（元）\n第2步 ${k} 个篮球：${p + d} × ${k} = ${v}（元）` } },
  n => { const g = R(3, 6), a = R(4, 8), k = pick([2, 3, 4, 6].filter(x => (a * g) % x === 0 && x !== g)) || 2, v = a * g / k; return (a * g) % k ? null : { q: `体育课上，${g} 个小组每组 ${a} 人，现在重新平均分成 ${k} 队，每队有多少人？`, v, u: '人', e: `${a} × ${g} ÷ ${k}`, alts: [`${a} + ${g} ÷ ${k}`, `${a} ÷ ${g} × ${k}`, `${a} × ${g} − ${k}`], s: `只有乘除法，从左往右算：\n第1步 一共有：${a} × ${g} = ${a * g}（人）\n第2步 每队：${a * g} ÷ ${k} = ${v}（人）` } },
  n => { const a = R(6, 12), d = R(3, 7), c = R(5, 20), v = a * d + c; return { q: `${n}每天折 ${a} 只纸鹤，折了 ${d} 天，今天又折了 ${c} 只。一共折了多少只？`, v, u: '只', e: `${a} × ${d} + ${c}`, alts: [`${a} × (${d} + ${c})`, `${a} + ${d} × ${c}`, `${a} × ${d} − ${c}`], s: `第1步 前 ${d} 天折了：${a} × ${d} = ${a * d}（只）\n第2步 一共：${a * d} + ${c} = ${v}（只）` } },
  n => { const a = R(20, 45), k = R(2, 4), c = R(3, 12), v = a * k - c; return { q: `小红跳绳跳了 ${a} 下，${n}跳的是小红的 ${k} 倍还少 ${c} 下。${n}跳了多少下？`, v, u: '下', e: `${a} × ${k} − ${c}`, alts: [`${a} × (${k} − ${c})`, `${a} + ${k} − ${c}`, `${a} × ${k} + ${c}`], s: `第1步 小红的 ${k} 倍：${a} × ${k} = ${a * k}（下）\n第2步 还少 ${c} 下：${a * k} − ${c} = ${v}（下）` } },
  n => { const k = R(3, 8), per = R(3, 9), c = R(2, 12), N = k * per + c; return { q: `一根绳子长 ${N} 米，先剪去 ${c} 米，剩下的平均剪成 ${k} 段，每段长多少米？`, v: per, u: '米', e: `(${N} − ${c}) ÷ ${k}`, alts: [`${N} − ${c} ÷ ${k}`, `${N} ÷ ${k} − ${c}`, `${N} ÷ (${k} − ${c})`], s: `第1步 剩下：${N} − ${c} = ${N - c}（米）\n第2步 每段：${N - c} ÷ ${k} = ${per}（米）` } },
  n => { const a = R(6, 9), r = R(5, 9), c = R(2, 8), v = a * r - c; return { q: `植树节，同学们种了 ${r} 行树，每行 ${a} 棵，后来有 ${c} 棵没有成活。成活了多少棵？`, v, u: '棵', e: `${a} × ${r} − ${c}`, alts: [`${a} × (${r} − ${c})`, `${a} + ${r} − ${c}`, `${a} × ${r} + ${c}`], s: `第1步 一共种了：${a} × ${r} = ${a * r}（棵）\n第2步 成活：${a * r} − ${c} = ${v}（棵）` } },
  n => { const k = R(3, 6), grp = R(4, 8), m = R(2, 5), N = k * grp, v = grp * m; return { q: `${N} 个同学去春游，每 ${k} 人一组。每组发 ${m} 瓶水，一共要发多少瓶？`, v, u: '瓶', e: `${N} ÷ ${k} × ${m}`, alts: [`${N} ÷ (${k} × ${m})`, `${N} × ${k} ÷ ${m}`, `${N} ÷ ${k} + ${m}`], s: `只有乘除法，从左往右算：\n第1步 分成：${N} ÷ ${k} = ${grp}（组）\n第2步 要发：${grp} × ${m} = ${v}（瓶）` } },
  n => { const p = R(4, 9), k = R(3, 8), M = Math.ceil((p * k + 1) / 10) * 10 + pick([0, 10]), v = M - p * k; return { q: `一千克苹果 ${p} 元，妈妈买了 ${k} 千克，付了 ${M} 元，应找回多少元？`, v, u: '元', e: `${M} − ${p} × ${k}`, alts: [`(${M} − ${p}) × ${k}`, `${M} − ${p} + ${k}`, `${p} × ${k} − ${M}`], s: `第1步 买苹果花了：${p} × ${k} = ${p * k}（元）\n第2步 找回：${M} − ${p * k} = ${v}（元）` } },
)
// 原来的 mixWord / mixPick 遇到 null 的模板要重来
const _wordPick = () => { for (;;) { const w = pick(WORD)(pick(NAMES)); if (w) return w } }
mixWord = function mixWord() { const w = _wordPick(); return input('hard', w.q, w.v, `${w.s}\n综合算式：${w.e} = ${w.v}`, null, w.u) }
mixPick = function mixPick() {
  const w = _wordPick()
  return choice('hard', `${w.q}\n下面哪个综合算式是对的？`, w.e, [w.e, ...w.alts], `${w.s}\n把两步合起来：${w.e} = ${w.v}\n${/\(/.test(w.e) ? '⚠️ 要先算的加减法，必须加上括号。' : '⚠️ 乘除法本来就先算，或者从左往右算，不用加括号。'}`)
}
const evalExpr = s => Function('"use strict";return (' + s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-') + ')')()
function mixCmp() {
  for (;;) {
    const a = R(12, 60), b = R(2, 9), c = R(2, 9)
    const T = pick([[`${a} + ${b} × ${c}`, `(${a} + ${b}) × ${c}`], [`${a * c} − ${b * c} ÷ ${c}`, `(${a * c} − ${b * c}) ÷ ${c}`], [`${a} − ${b} + ${c}`, `${a} − (${b} + ${c})`], [`${b} × ${c} + ${a}`, `${b} × (${c} + ${a})`]])
    const x = evalExpr(T[0]), y = evalExpr(T[1])
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) continue
    return cmpQ('mid', `比一比：${T[0]} ○ ${T[1]}`, x, y, `分别算出来：\n${T[0]} = ${x}\n${T[1]} = ${y}\n所以 ${T[0]} ${x > y ? '>' : x < y ? '<' : '='} ${T[1]}。\n⚠️ 括号改变了运算顺序，结果常常不一样。`)
  }
}
function mixMissing() {
  const t = R(0, 3)
  if (t === 0) { const b = R(2, 9), x = b * R(3, 9), c = R(5, 30), d = x / b + c; return input('mid', `( ) ÷ ${b} + ${c} = ${d}，括号里填几？`, x, `倒着想：( ) ÷ ${b} 的结果是 ${d} − ${c} = ${d - c}，\n所以 ( ) = ${d - c} × ${b} = ${x}。\n验算：${x} ÷ ${b} + ${c} = ${d - c} + ${c} = ${d} ✔`) }
  if (t === 1) { const x = R(2, 9), b = R(3, 9), c = R(2, x * b - 1), d = x * b - c; return input('mid', `${b} × ( ) − ${c} = ${d}，括号里填几？`, x, `倒着想：${b} × ( ) 的结果是 ${d} + ${c} = ${d + c}，\n所以 ( ) = ${d + c} ÷ ${b} = ${x}。\n验算：${b} × ${x} − ${c} = ${b * x} − ${c} = ${d} ✔`) }
  if (t === 2) { const k = R(2, 9), s = R(3, 9), c = R(1, s - 1), x = s - c, d = s * k; return input('mid', `(( ) + ${c}) × ${k} = ${d}，括号里填几？`, x, `倒着想：括号里的和是 ${d} ÷ ${k} = ${s}，\n所以 ( ) = ${s} − ${c} = ${x}。\n验算：(${x} + ${c}) × ${k} = ${s} × ${k} = ${d} ✔`) }
  const a = R(30, 90), b = R(2, 9), x = R(2, 9); const d = a - b * x
  return d > 0 ? input('mid', `${a} − ${b} × ( ) = ${d}，括号里填几？`, x, `倒着想：${b} × ( ) = ${a} − ${d} = ${a - d}，\n所以 ( ) = ${a - d} ÷ ${b} = ${x}。\n验算：${a} − ${b} × ${x} = ${a} − ${b * x} = ${d} ✔`) : mixMissing()
}
function mixOps() {
  for (let g = 0; g < 200; g++) {
    const a = R(2, 9), b = R(2, 9), c = R(2, 20), op = pick(['+', '−', '×', '÷'])
    if (op === '÷' && a % b) continue
    const val = o => evalExpr(`${a} ${o} ${b} + ${c}`)
    const ans = val(op)
    if (['+', '−', '×', '÷'].filter(o => Number.isInteger(val(o)) && val(o) === ans).length !== 1 || ans < 0) continue
    return choice('mid', `在 ○ 里填上合适的运算符号：${a} ○ ${b} + ${c} = ${ans}`, op, ['+', '−', '×', '÷'],
      `一个一个试：\n${['+', '−', '×', '÷'].filter(o => o !== '÷' || a % b === 0).map(o => `${a} ${o} ${b} + ${c} = ${val(o)}`).join('\n')}\n只有填“${op}”等于 ${ans}。`, null, true)
  }
}
function mixFirstPop() {
  const items = []
  for (let g = 0; g < 100 && items.length < 6; g++) {
    const a = R(10, 30), b = R(2, 9), c = R(2, 9), t = R(0, 5)
    const e = [`${a} + ${b} × ${c}`, `${a} × ${b} − ${c}`, `(${a} + ${b}) × ${c}`, `${a} − ${b} + ${c}`, `${a} + ${b} − ${c}`, `(${a} − ${b}) + ${c}`][t]
    const ok = t <= 1
    if (items.some(i => i.t === e)) continue
    items.push({ t: e, ok })
  }
  if (!items.some(i => i.ok)) items[0] = { t: `${R(10, 40)} + ${R(2, 9)} × ${R(2, 9)}`, ok: true }
  return popQ('mid', '戳破所有“要先算乘法”的算式气球', items, '没有括号时，有乘法也有加减法，要先算乘法。\n有括号时先算括号里的；只有加减法时从左往右算。')
}
function mixCalc3() {
  for (;;) {
    const a = R(2, 9), b = R(2, 9), c = R(2, 9), d = R(2, 9), e = R(10, 60)
    // [算式, 第1步, 第2步]
    const T = pick([
      [`${e} + ${a} × ${b} − ${c}`, `${a} × ${b} = ${a * b}`, `${e} + ${a * b} − ${c}`],
      [`(${e} + ${a}) × ${b} − ${c}`, `${e} + ${a} = ${e + a}`, `${e + a} × ${b} − ${c}`],
      [`${a} × ${b} + ${c} × ${d}`, `${a} × ${b} = ${a * b}，${c} × ${d} = ${c * d}`, `${a * b} + ${c * d}`],
      [`${e} − ${a} × ${b} + ${c}`, `${a} × ${b} = ${a * b}`, `${e} − ${a * b} + ${c}`],
      [`${a * b} ÷ ${a} + ${c} × ${d}`, `${a * b} ÷ ${a} = ${b}，${c} × ${d} = ${c * d}`, `${b} + ${c * d}`],
      [`${e} − (${c} + ${d}) × ${a}`, `${c} + ${d} = ${c + d}`, `${e} − ${c + d} × ${a}`],
    ])
    const v = evalExpr(T[0])
    if (!Number.isInteger(v) || v < 0 || v > 999) continue
    return input('hard', `脱式计算：${T[0]} = ？`, v, `先算括号里的，再算乘除法，最后算加减法：\n第1步：${T[1]}\n第2步：${T[2]} = ${v}\n⚠️ 同一个算式里有两处乘除法时，它们都要先算。`)
  }
}

// ============================================================
//  三、毫米、分米和千米
// ============================================================
const LEN_TF = [
  ['1 分米 = 10 厘米', true, '1 分米 = 10 厘米，1 厘米 = 10 毫米。'],
  ['1 厘米 = 100 毫米', false, '1 厘米 = 10 毫米，不是 100 毫米。'],
  ['1 千米 = 1000 米', true, '千米也叫公里，1 千米 = 1000 米。'],
  ['1 米 = 100 分米', false, '1 米 = 10 分米 = 100 厘米。'],
  ['一枚 1 元硬币大约厚 2 毫米', true, '硬币很薄，用毫米作单位，大约 2 毫米。'],
  ['小明的身高大约是 13 分米', true, '13 分米 = 130 厘米，三年级同学身高大约就是这么高。'],
  ['一列火车每小时大约行 200 米', false, '火车很快，每小时大约行 200 千米，200 米太短了。'],
  ['数学书大约厚 1 厘米', true, '数学书比较薄，大约 1 厘米左右。'],
  ['1 分米 = 100 毫米', true, '1 分米 = 10 厘米，1 厘米 = 10 毫米，所以 1 分米 = 100 毫米。'],
  ['从学校到家走路大约要 1 千米，就是 100 米', false, '1 千米 = 1000 米，不是 100 米。'],
]
function lenJudge() { return pickTF('mid', LEN_TF) }
function lenMix() {
  const t = R(0, 4)
  if (t === 0) { const a = R(1, 15), b = R(1, 9); return input('mid', `${a} 厘米 ${b} 毫米 = ( ) 毫米`, a * 10 + b, `1 厘米 = 10 毫米，${a} 厘米 = ${a * 10} 毫米，\n再加上 ${b} 毫米：${a * 10} + ${b} = ${a * 10 + b}（毫米）。`, null, '毫米') }
  if (t === 1) { const a = R(1, 9), b = R(1, 9); return input('mid', `${a} 分米 ${b} 厘米 = ( ) 厘米`, a * 10 + b, `1 分米 = 10 厘米，${a} 分米 = ${a * 10} 厘米，\n再加上 ${b} 厘米：${a * 10 + b} 厘米。`, null, '厘米') }
  if (t === 2) { const a = R(1, 9), b = pick([R(1, 9) * 100, R(1, 9) * 100 + R(1, 9) * 10, R(10, 99)]); return input('mid', `${a} 千米 ${b} 米 = ( ) 米`, a * 1000 + b, `${a} 千米 = ${a * 1000} 米，\n再加上 ${b} 米：${a * 1000} + ${b} = ${a * 1000 + b}（米）。${b < 100 ? `\n⚠️ 易错：不能写成 ${a}${b}，${b} 米只有两位数，中间要补 0。` : ''}` , null, '米') }
  if (t === 3) { const a = R(1, 9), b = R(1, 9) * 100 + pick([0, R(1, 9) * 10]), m = a * 1000 + b; return input('mid', `${m} 米 = ${a} 千米 ( ) 米`, b, `${m} 米里有 ${a} 个 1000 米，就是 ${a} 千米，\n还剩 ${m} − ${a * 1000} = ${b}（米）。`, null, '米') }
  const a = R(2, 9), b = R(1, 9), m = a * 10 + b
  return input('mid', `${m} 毫米 = ${a} 厘米 ( ) 毫米`, b, `${m} 毫米里有 ${a} 个 10 毫米，就是 ${a} 厘米，还剩 ${b} 毫米。`, null, '毫米')
}
function lenDiff() {
  const a = R(8, 17), b = R(1, 9), x = a * 10 + b, c = R(25, x - 10), thing = pick([['铅笔', '橡皮'], ['尺子', '卷笔刀'], ['蜡笔', '回形针']])
  return input('mid', `一支${thing[0]}长 ${a} 厘米 ${b} 毫米，一个${thing[1]}长 ${c} 毫米。${thing[0]}比${thing[1]}长多少毫米？`, x - c,
    `先统一单位：${a} 厘米 ${b} 毫米 = ${x} 毫米。\n再相减：${x} − ${c} = ${x - c}（毫米）。\n⚠️ 单位不同的长度不能直接相减。`, null, '毫米')
}
function lenRelay() {
  const [k, d] = pick([[4, 250], [5, 200], [8, 250], [4, 500], [10, 100], [10, 200], [5, 400], [8, 125]]), km = k * d / 1000
  return input('hard', `接力赛跑，${k} 个同学每人跑 ${d} 米。他们一共跑了多少千米？`, km,
    `一共跑了：${d} × ${k} = ${k * d}（米）；\n${k * d} 米 = ${km} 千米（1000 米 = 1 千米）。`, null, '千米')
}
function lenTrip() {
  const a = R(12, 35), k = R(3, 6), c = R(5, 40), s = a * k + c
  return input('hard', `一支考察队每天走 ${a} 千米，走了 ${k} 天，离终点还有 ${c} 千米。全程一共多少千米？`, s,
    `第1步 已经走了：${a} × ${k} = ${a * k}（千米）\n第2步 全程：${a * k} + ${c} = ${s}（千米）`, null, '千米')
}

// ============================================================
//  综合实践：曹冲称象（克、千克、吨）
// ============================================================
const WT_TF = [
  ['1 千克 = 1000 克', true, '1 千克 = 1000 克，1 吨 = 1000 千克。'],
  ['1 吨 = 100 千克', false, '1 吨 = 1000 千克。'],
  ['1 千克棉花和 1 千克铁一样重', true, '都是 1 千克，当然一样重，只是棉花体积大。'],
  ['一个鸡蛋大约重 50 千克', false, '一个鸡蛋大约重 50 克，50 千克就像一个大人那么重了。'],
  ['一头大象大约重 5 吨', true, '大象很重，用“吨”作单位，大约 4～6 吨。'],
  ['一袋大米重 25 克', false, '一袋大米通常是 25 千克，25 克只有几块饼干那么重。'],
  ['曹冲称象是用石头的重量代替大象的重量', true, '船下沉到同样深的位置，说明石头和大象一样重，这就是“等量代换”。'],
  ['1000 千克的铁比 1 吨的棉花重', false, '1000 千克 = 1 吨，两个一样重。'],
]
function wtJudge() { return pickTF('mid', WT_TF) }
function wtMix() {
  const t = R(0, 3)
  if (t === 0) { const a = R(1, 9), b = pick([R(1, 9) * 100, R(1, 9) * 100 + 50, R(10, 99)]); return input('mid', `${a} 千克 ${b} 克 = ( ) 克`, a * 1000 + b, `${a} 千克 = ${a * 1000} 克，再加 ${b} 克：${a * 1000 + b} 克。${b < 100 ? `\n⚠️ 中间要补 0，不能写成 ${a}${b}。` : ''}`, null, '克') }
  if (t === 1) { const a = R(1, 9), b = pick([R(1, 9) * 100, R(1, 9) * 100 + 50, R(10, 90)]); return input('mid', `${a} 吨 ${b} 千克 = ( ) 千克`, a * 1000 + b, `${a} 吨 = ${a * 1000} 千克，再加 ${b} 千克：${a * 1000 + b} 千克。`, null, '千克') }
  if (t === 2) { const a = R(1, 9), b = R(1, 9) * 100, m = a * 1000 + b; return input('mid', `${m} 克 = ${a} 千克 ( ) 克`, b, `${m} 克里有 ${a} 个 1000 克，就是 ${a} 千克，还剩 ${b} 克。`, null, '克') }
  const a = R(2, 5), b = R(1, 9) * 100; return input('mid', `${a} 千克 − ${b} 克 = ( ) 克`, a * 1000 - b, `先统一单位：${a} 千克 = ${a * 1000} 克，\n${a * 1000} − ${b} = ${a * 1000 - b}（克）。`, null, '克')
}
function wtTrips() {
  const k = R(2, 6), n = R(3, 8), extra = R(1, k - 1), N = k * n + extra
  return input('hard', `有 ${N} 吨货物，一辆卡车每次最多运 ${k} 吨。至少要运几次才能运完？`, n + 1,
    `${N} ÷ ${k} = ${n}（次）……${extra}（吨）\n运 ${n} 次后还剩 ${extra} 吨，还要再运 1 次，\n所以至少要运：${n} + 1 = ${n + 1}（次）。\n⚠️ 易错：剩下的货也要运，要“进一”。`, null, '次')
}
function wtBalance() {
  const k = R(2, 4), each = pick([100, 150, 200, 250, 300]), tot = k * each, w = pick([[tot], [Math.floor(tot / 200) * 100, tot - Math.floor(tot / 200) * 100]])
  const thing = pick(['苹果', '橙子', '梨'])
  return input('hard', `天平左边放 ${k} 个同样的${thing}，右边放 ${w.map(x => x + ' 克').join(' 和 ')}的砝码，天平平衡了。1 个${thing}重多少克？`, each,
    `天平平衡，说明两边一样重：${k} 个${thing}重 ${w.join(' + ')} = ${tot} 克。\n1 个${thing}：${tot} ÷ ${k} = ${each}（克）。\n这就是曹冲称象用的“等量代换”。`, null, '克')
}
function wtBags() {
  const [per, n] = pick([[25, 40], [50, 20], [20, 50], [100, 10], [250, 4], [200, 5], [500, 2]])
  const t = R(1, 3)
  return input('hard', `一袋饲料重 ${per} 千克，${n * t} 袋饲料重几吨？`, t,
    `${n} 袋重：${per} × ${n} = ${per * n} 千克 = 1 吨；\n${n * t} 袋里有 ${t} 个 ${n} 袋，所以重 ${t} 吨。`, null, '吨')
}

// ============================================================
//  四、多位数乘一位数
// ============================================================
const MUL_TF = [
  ['三位数乘一位数，积一定是四位数', false, () => { const a = R(100, 199), b = R(2, 4); return `不一定。比如 ${a} × ${b} = ${a * b}，是三位数。` }],
  ['0 和任何数相乘都得 0', true, '对。0 乘任何数都得 0。'],
  ['因数中间有 0，积的中间也一定有 0', false, '不一定。比如 105 × 4 = 420，中间就没有 0。'],
  ['最大的两位数乘最大的一位数，积是三位数', true, '99 × 9 = 891，是三位数。'],
  ['一个因数末尾有 1 个 0，积的末尾就只有 1 个 0', false, '不一定。比如 50 × 4 = 200，积的末尾有 2 个 0。'],
  ['估算 298 × 3，可以把 298 看作 300，积大约是 900', true, '298 接近 300，300 × 3 = 900，所以积大约是 900。'],
  ['206 × 3 = 618', true, '206 × 3：6 × 3 = 18，写 8 进 1；0 × 3 + 1 = 1；2 × 3 = 6。积是 618。'],
  ['305 × 3 = 9015', false, '305 × 3 = 915。0 乘 3 得 0，再加上进位 1，十位写 1。'],
]
function mulJudge() { return pickTF('mid', MUL_TF) }
function mulZeroEnd() {
  const [a, k] = pick([[25, 4], [125, 8], [250, 4], [50, 6], [205, 4], [150, 4], [360, 5], [40, 5], [600, 5], [75, 4], [120, 5], [450, 2], [500, 6], [35, 2], [802, 5], [104, 5]])
  const p = a * k, z = String(p).match(/0*$/)[0].length
  return input('mid', `${a} × ${k} 的积末尾有几个 0？`, z, `先算出积：${a} × ${k} = ${p}，\n末尾有 ${z} 个 0。\n⚠️ 不能只数因数末尾的 0，有时候乘出来还会多出 0（比如 5 × 2 = 10）。`, null, '个')
}
function mulDigits() {
  const a = pick([R(11, 99), R(100, 999), R(100, 999)]), k = R(2, 9), p = a * k, n = String(p).length, nm = ['', '一', '两', '三', '四', '五'][n] + '位数'
  return choice('mid', `${a} × ${k} 的积是几位数？`, nm, ['两位数', '三位数', '四位数'], `可以先估一估，也可以直接算：${a} × ${k} = ${p}，是${nm}。\n小窍门：看最高位，${String(a)[0]} × ${k} ${Number(String(a)[0]) * k >= 10 ? '满十了，积会比因数多一位' : '不满十（还要看后面的进位），积和因数的位数可能一样'}。`, null, true)
}
function mulEst() {
  for (;;) {
    const r = R(2, 9) * 100, d = R(1, 4) * pick([1, -1]), a = r + d, k = R(2, 9), c = r * k
    return cmpQ('mid', `不用算出得数，比一比：${a} × ${k} ○ ${c}`, a * k, c, `${a} ${d > 0 ? '比' : '比'} ${r} ${d > 0 ? '大' : '小'}，\n${r} × ${k} = ${c}，所以 ${a} × ${k} ${d > 0 ? '>' : '<'} ${c}。\n（实际 ${a} × ${k} = ${a * k}）`)
  }
}
function mulEnough() {
  const p = R(2, 9) * 10 + pick([-2, -1, 1, 2, 3, 5]), k = R(3, 6), M = Math.round(p * k / 50) * 50 + pick([-10, 0, 10, 20])
  if (M === p * k || M <= 0) return mulEnough()
  const ok = M >= p * k
  return choice('hard', `妈妈带了 ${M} 元，想买 ${k} 个 ${p} 元的玩具。钱够吗？`, ok ? '够' : '不够', ['够', '不够'],
    `${p} × ${k} = ${p * k}（元），${M} ${ok ? '>' : '<'} ${p * k}，所以${ok ? '够' : '不够'}。`, null, true)
}
function mulThree() {
  const a = R(3, 5), p = R(12, 25), k = R(2, 4), v = a * p * k
  return input('hard', `一套故事书有 ${a} 本，每本 ${p} 元。学校图书室买了 ${k} 套，要花多少元？`, v,
    `方法一：先算一套多少元：${p} × ${a} = ${p * a}（元），再算 ${k} 套：${p * a} × ${k} = ${v}（元）。\n方法二：先算一共几本：${a} × ${k} = ${a * k}（本），再算钱：${p} × ${a * k} = ${v}（元）。`, null, '元')
}
function mulMaxDigit() {
  for (let g = 0; g < 100; g++) {
    const h = R(1, 3), o = R(0, 9), k = R(2, 4), lim = pick([1000, 800, 900, 600])
    let x = -1; for (let d = 0; d <= 9; d++) if ((h * 100 + d * 10 + o) * k < lim) x = d
    if (x < 1 || x > 8) continue
    return input('hard', `${h}□${o} × ${k} 的积小于 ${lim}，□ 里最大能填几？`, x,
      `试一试：\n${h}${x}${o} × ${k} = ${(h * 100 + x * 10 + o) * k}，比 ${lim} 小 ✔\n${h}${x + 1}${o} × ${k} = ${(h * 100 + (x + 1) * 10 + o) * k}，不比 ${lim} 小 ✘\n所以最大填 ${x}。`)
  }
}
function mulAge() {
  const a = R(7, 10), k = R(3, 5), c = R(2, 9), d = a * k, g = d * 2 - c
  return input('hard', `薇薇今年 ${a} 岁，爸爸的年龄是薇薇的 ${k} 倍，爷爷的年龄比爸爸的 2 倍少 ${c} 岁。爷爷今年多少岁？`, g,
    `第1步 爸爸：${a} × ${k} = ${d}（岁）\n第2步 爸爸的 2 倍：${d} × 2 = ${d * 2}（岁）\n第3步 爷爷：${d * 2} − ${c} = ${g}（岁）`, null, '岁')
}

// ============================================================
//  综合实践：数字编码
// ============================================================
const AREAS = ['530102', '110105', '310115', '440106', '510107', '330106', '420111', '320102']
function fakeId(y, m, d, girl) {
  const seq = String(R(10, 99)) + String(girl ? pick([0, 2, 4, 6, 8]) : pick([1, 3, 5, 7, 9]))
  return `${pick(AREAS)}${y}${p2(m)}${p2(d)}${seq}${pick(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'])}`
}
function codeEmergency() {
  const S = [['家里着火了', '119'], ['看到有人打架、偷东西', '110'], ['有人突然生病晕倒了', '120'], ['马路上发生了交通事故', '122']]
  const [s, a] = pick(S)
  return choice('mid', `${s}，应该拨打哪个电话？`, a, ['110', '119', '120', '122'], '110 报警，119 火警，120 急救，122 交通事故报警。\n这些特殊号码很短，方便记住、方便拨打。', null, true)
}
function codeIdAge() {
  const y = R(1950, 2016), m = R(1, 12), d = R(1, 28), id = fakeId(y, m, d, Math.random() < 0.5), yr = new Date().getFullYear()
  return input('mid', `身份证号 ${id} 的主人，到 ${yr} 年过生日时满多少岁？`, yr - y,
    `身份证号第 7～10 位是出生年份：${y} 年。\n${yr} − ${y} = ${yr - y}（岁）。`, null, '岁')
}
function codeSeat() {
  const r = R(1, 20), s = R(1, 30)
  if (Math.random() < 0.5) return input('mid', `电影院的座位编号用 4 位数表示：前两位是第几排，后两位是第几号。比如 0815 表示 8 排 15 号。${r} 排 ${s} 号的编号是多少？`, `${p2(r)}${p2(s)}`, `第几排写成两位：${p2(r)}；第几号写成两位：${p2(s)}；合起来是 ${p2(r)}${p2(s)}。${r < 10 || s < 10 ? '\n⚠️ 不满两位的要在前面补 0。' : ''}`)
  const ans = `${r}排${s}号`
  return choice('mid', `电影院的座位编号用 4 位数表示：前两位是第几排，后两位是第几号。座位 ${p2(r)}${p2(s)} 在哪里？`, ans,
    opts4(ans, [`${s}排${r}号`, `${r}排${s + 1}号`, `${r + 1}排${s}号`], () => `${R(1, 20)}排${R(1, 30)}号`), `前两位 ${p2(r)} 是第 ${r} 排，后两位 ${p2(s)} 是第 ${s} 号。`)
}
function codeLocker() {
  const g = R(1, 6), c = R(1, 9), n = R(1, 45), code = `${g}${p2(c)}${p2(n)}`, ans = `${g}年级${c}班${n}号`
  return choice('mid', `学校给每个同学一个 5 位编号：第 1 位是年级，第 2～3 位是班级，第 4～5 位是学号。编号 ${code} 表示什么？`, ans,
    opts4(ans, [`${c}年级${g}班${n}号`, `${g}年级${n}班${c}号`, `${g}年级${c}班${n + 1}号`], () => `${R(1, 6)}年级${R(1, 9)}班${R(1, 45)}号`),
    `${code}：第 1 位 ${g} 是 ${g} 年级；第 2～3 位 ${p2(c)} 是 ${c} 班；第 4～5 位 ${p2(n)} 是 ${n} 号。`)
}
function codeOldest() {
  const ps = []
  while (ps.length < 4) { const y = R(1960, 2018), m = R(1, 12), d = R(1, 28), k = y * 10000 + m * 100 + d; if (!ps.some(p => p.k === k)) ps.push({ k, id: fakeId(y, m, d, Math.random() < 0.5), y, m, d }) }
  const old = ps.reduce((a, b) => (a.k < b.k ? a : b))
  return Object.assign(choice('hard', '下面 4 个身份证号的主人，谁的年龄最大？', old.id, ps.map(p => p.id),
    `看第 7～14 位的出生日期，出生越早年龄越大：\n${ps.map(p => `${p.y}年${p.m}月${p.d}日`).join('\n')}\n最早的是 ${old.y} 年 ${old.m} 月 ${old.d} 日。`), { wide: true })
}
function codeCombos() {
  const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, R(3, 4)).sort(), rep = Math.random() < 0.5, n = ds.length
  const v = rep ? n * n : n * (n - 1)
  return input('hard', `用 ${ds.join('、')} 这 ${n} 个数字编两位数的密码，${rep ? '数字可以重复使用' : '每个数字只能用一次'}，一共能编出多少个不同的密码？`, v,
    `十位有 ${n} 种选法；\n${rep ? `个位也有 ${n} 种选法（可以重复）` : `个位只剩 ${n - 1} 种选法（不能和十位一样）`}；\n一共：${n} × ${rep ? n : n - 1} = ${v}（个）。`, null, '个')
}

// ============================================================
//  五、线和角
// ============================================================
const ANG_TF = [
  ['角的两条边画得越长，角就越大', false, '角的大小只看两条边张开得多大，和边的长短没有关系。'],
  ['钝角比直角大，直角比锐角大', true, '对：锐角 < 直角 < 钝角。'],
  ['角的两条边都是射线', true, '对。角是从一个点引出两条射线组成的。'],
  ['用放大镜看一个角，这个角会变大', false, '放大镜只能把边看得更长更粗，张开的大小不变，角不会变大。'],
  ['3 时整，钟面上的时针和分针组成直角', true, '对。3 时整和 9 时整，时针和分针都组成直角。'],
  ['一块三角板上有 2 个直角', false, '一块三角板上只有 1 个直角，另外 2 个是锐角。'],
  ['所有的直角都一样大', true, '对。直角的大小都相同，可以用三角板上的直角去比。'],
  ['经过两个点，只能画一条直线', true, '对。经过两点只能画一条直线。'],
  ['经过一个点，只能画一条直线', false, '经过一个点可以画无数条直线。'],
]
function angleJudge() { return pickTF('mid', ANG_TF) }
function angleShapes() {
  const S = [['长方形', 4, 0, 0], ['正方形', 4, 0, 0], ['一块三角板', 1, 2, 0], ['一副三角板（两块）', 2, 4, 0], ['红领巾（三角形）', 0, 2, 1]]
  const [s, r, a, o] = pick(S), k = R(0, 2), nm = ['直角', '锐角', '钝角'][k], v = [r, a, o][k]
  return input('mid', `${s}上有几个${nm}？`, v, `${s}上：直角 ${r} 个，锐角 ${a} 个，钝角 ${o} 个。\n所以${nm}有 ${v} 个。`, null, '个')
}
function lineMatch() {
  const sets = [
    [['线段', '有 2 个端点'], ['射线', '有 1 个端点'], ['直线', '没有端点']],
    [['线段', '可以量出长度'], ['射线', '向一端无限延长'], ['直线', '向两端无限延长']],
    [['线段', '直直的绳子拉紧'], ['射线', '手电筒射出的光'], ['直线', '两端都没有尽头']],
  ]
  return matchQ('mid', '连一连：把名称和它的特点配对', pick(sets), '线段：2 个端点，能量长度；\n射线：1 个端点，向一端无限延长，不能量长度；\n直线：没有端点，向两端无限延长，不能量长度。')
}
function linePoints() {
  const n = R(3, 7), v = n * (n - 1) / 2, parts = Array.from({ length: n - 1 }, (_, i) => n - 1 - i)
  return input('hard', `圆上有 ${n} 个点，每两个点之间连一条线段，一共能连多少条线段？`, v,
    `一个一个点地连，不重复：\n第 1 个点和后面的点连 ${n - 1} 条，第 2 个点再连 ${n - 2} 条……\n${parts.join(' + ')} = ${v}（条）。`, null, '条')
}
function angleHours() {
  const a = R(1, 6), b = R(a + 3, 12), k = R(0, 2), nm = ['锐角', '直角', '钝角'][k]
  const cls = h => { const d = 30 * Math.min(h % 12, 12 - (h % 12)); return d === 0 ? -1 : d < 90 ? 0 : d === 90 ? 1 : d < 180 ? 2 : -1 }
  const hs = []; for (let h = a; h <= b; h++) if (cls(h) === k) hs.push(h)
  return input('hard', `从 ${a} 时到 ${b} 时（包括 ${a} 时和 ${b} 时）的整点，时针和分针组成${nm}的有几次？`, hs.length,
    `整点时分针都指着 12，看时针离 12 有多远：\n1、2、10、11 时是锐角；3、9 时是直角；4、5、7、8 时是钝角；6 时和 12 时不组成这三种角。\n${a}～${b} 时里组成${nm}的是：${hs.length ? hs.join('、') + ' 时' : '没有'}，共 ${hs.length} 次。`, null, '次')
}

// ============================================================
//  六、分数的初步认识
// ============================================================
const FRAC_TF = [
  ['把一个蛋糕分成 4 份，每份是它的 1/4', false, '必须是“平均分”成 4 份，每份才是 1/4。'],
  ['把一个西瓜平均分成 5 份，每份是它的 1/5', true, '对。平均分成 5 份，每份就是 1/5。'],
  ['1/3 比 1/4 大', true, '分子都是 1，分母越大，每份越小。所以 1/3 > 1/4。'],
  ['1/8 比 1/6 大', false, '分子都是 1，分母越大每份越小，1/8 < 1/6。'],
  ['3/7 比 5/7 大', false, '分母相同，分子大的分数大，3/7 < 5/7。'],
  ['5/5 就是 1', true, '平均分成 5 份，5 份都取，就是整个，等于 1。'],
  ['1 − 1/4 = 3/4', true, '1 = 4/4，4/4 − 1/4 = 3/4。'],
  ['2/9 + 4/9 = 6/18', false, '分母相同时，分母不变，分子相加：2/9 + 4/9 = 6/9。'],
]
function fracJudge() { return pickTF('mid', FRAC_TF) }
function fracUnits() {
  const n = R(3, 10), k = R(2, n), t = R(0, 1)
  if (t === 0) return input('mid', `1 里面有几个 1/${n}？`, n, `把 1 平均分成 ${n} 份，每份是 1/${n}，所以 1 里面有 ${n} 个 1/${n}。`, null, '个')
  return choice('mid', `${k} 个 1/${n} 是多少？`, k === n ? '1' : F(k, n), opts4(k === n ? '1' : F(k, n), [F(1, n * k), F(n, k), F(k + 1, n)], () => F(R(1, n), n)), `${k} 个 1/${n} 就是 ${k}/${n}${k === n ? `，${n}/${n} = 1` : ''}。`)
}
function fracTo1() {
  const n = R(3, 12), k = R(1, n - 1)
  return choice('mid', `${F(k, n)} + ( ) = 1，括号里填几？`, F(n - k, n), opts4(F(n - k, n), [F(n - k + 1, n), F(k, n), F(1, n)], () => F(R(1, n - 1), n)),
    `1 = ${n}/${n}，\n${n}/${n} − ${k}/${n} = ${n - k}/${n}。`)
}
function fracWhoMore() {
  const a = R(2, 8), b = R(2, 8)
  if (a === b) return fracWhoMore()
  const thing = pick(['蛋糕', '比萨', '西瓜', '一块巧克力']), [x, y] = pick([['哥哥', '妹妹'], ['小明', '小红'], ['爸爸', '妈妈']])
  const ans = a < b ? x : y
  return choice('mid', `同一个${thing}，${x}吃了 1/${a}，${y}吃了 1/${b}。谁吃得多？`, ans, [x, y, '一样多'],
    `都是同一个${thing}。分子都是 1 时，分母越小，每份越大。\n1/${a} ${a < b ? '>' : '<'} 1/${b}，所以${ans}吃得多。`, null, true)
}
function fracClass() {
  const n = pick([3, 4, 5, 6]), per = R(5, 8), N = n * per, k = R(1, Math.floor((n - 1) / 2)), girls = per * k, boys = N - girls
  return input('hard', `三（1）班有 ${N} 人，其中女生占全班的 ${F(k, n)}。男生比女生多多少人？`, boys - girls,
    `第1步 女生：把 ${N} 人平均分成 ${n} 份，每份 ${N} ÷ ${n} = ${per}（人），${k} 份是 ${per} × ${k} = ${girls}（人）。\n第2步 男生：${N} − ${girls} = ${boys}（人）。\n第3步 ${boys} − ${girls} = ${boys - girls}（人）。${boys < girls ? '' : ''}`, null, '人')
}
function fracRope() {
  const n = R(4, 10); let k = R(2, n - 1); if (k * 2 === n) k++
  return choice('hard', `一根绳子平均剪成 ${n} 段，用去了 ${k} 段。用去的是全长的几分之几？还剩全长的几分之几？`, `用去 ${F(k, n)}，剩 ${F(n - k, n)}`,
    [`用去 ${F(k, n)}，剩 ${F(n - k, n)}`, `用去 ${F(k, n)}，剩 ${F(n, n - k)}`, `用去 ${F(1, k)}，剩 ${F(1, n - k)}`, `用去 ${F(n - k, n)}，剩 ${F(k, n)}`],
    `平均剪成 ${n} 段，每段是全长的 1/${n}。\n用去 ${k} 段是 ${k}/${n}；剩下 ${n} − ${k} = ${n - k} 段，是 ${n - k}/${n}。`)
}
function fracLess() {
  const n = R(6, 12), a = R(3, n - 2), b = R(1, a - 1), c = a - b
  if (a + c > n) return fracLess()
  return choice('hard', `一个西瓜，哥哥吃了 ${F(a, n)}，弟弟比哥哥少吃 ${F(b, n)}。两人一共吃了这个西瓜的几分之几？`, F(a + c, n),
    opts4(F(a + c, n), [F(c, n), F(a + b, n), F(a + c, n + n)], () => F(R(1, n - 1), n)),
    `第1步 弟弟：${a}/${n} − ${b}/${n} = ${c}/${n}\n第2步 一共：${a}/${n} + ${c}/${n} = ${a + c}/${n}\n⚠️ 分母相同，分母不变，只把分子相加减。`)
}

// ---------- 再补几种难题 ----------
function mixFix() {
  for (;;) {
    const a = R(12, 50), b = R(2, 9), c = R(2, 9), right = a + b * c, wrong = (a + b) * c
    const t = R(0, 1)
    if (t === 0) return input('hard', `${pick(NAMES)}这样算：${a} + ${b} × ${c} = ${a + b} × ${c} = ${wrong}。他算错了，正确的得数是多少？`, right,
      `错在先算了加法。没有括号时，要先算乘法：\n${b} × ${c} = ${b * c}，\n${a} + ${b * c} = ${right}。`)
    const m = b * c, d = R(2, 9)
    if (a <= m) continue
    const r2 = (a - m) * d, w2 = a - m * d
    if (w2 < 0) return input('hard', `计算 (${a} − ${b} × ${c}) × ${d} = ？`, r2, `先算括号里的，括号里先算乘法：\n${b} × ${c} = ${m}，${a} − ${m} = ${a - m}；\n再乘括号外的：${a - m} × ${d} = ${r2}。`)
    return input('hard', `${pick(NAMES)}把 (${a} − ${b} × ${c}) × ${d} 算成了 ${w2}，他忘了括号。正确的得数是多少？`, r2,
      `括号里要先算完：${b} × ${c} = ${m}，${a} − ${m} = ${a - m}；\n再算 ${a - m} × ${d} = ${r2}。`)
  }
}
function codeIdBuild() {
  const y = R(2012, 2018), m = R(1, 12), d = R(1, 28), girl = Math.random() < 0.5
  if (Math.random() < 0.5) return input('hard', `一个${girl ? '女' : '男'}孩 ${y} 年 ${m} 月 ${d} 日出生。她身份证号的第 7～14 位是什么？`.replace('她', girl ? '她' : '他'), `${y}${p2(m)}${p2(d)}`,
    `第 7～14 位是出生日期：年份 4 位 + 月份 2 位 + 日期 2 位：\n${y} + ${p2(m)} + ${p2(d)} = ${y}${p2(m)}${p2(d)}。${m < 10 || d < 10 ? '\n⚠️ 月、日不满两位要补 0。' : ''}`)
  const id = fakeId(y, m, d, girl), ans = girl ? '女' : '男'
  return choice('hard', `身份证号 ${id} 的主人是男生还是女生？哪年出生？`, `${ans}，${y}年`, [`男，${y}年`, `女，${y}年`, `${ans}，${y + 1}年`, `${girl ? '男' : '女'}，${y - 1}年`],
    `第 7～10 位 ${y} 是出生年份；\n第 17 位是 ${id[16]}，${girl ? '双数（偶数）是女' : '单数（奇数）是男'}。`)
}

// ============================================================
//  加进各单元（第七单元“复习与关联”重新汇总）
// ============================================================
const ADD = [
  { mid: [obsJudge, obsViewCount, obsDiffView, obsMove, obsSameView], hard: [obsTopNum, obsMax, obsFill8] },
  { mid: [mixCmp, mixMissing, mixOps, mixFirstPop], hard: [mixCalc3, mixFix] },
  { mid: [lenJudge, lenMix, lenDiff], hard: [lenRelay, lenTrip] },
  { mid: [wtJudge, wtMix], hard: [wtTrips, wtBalance, wtBags] },
  { mid: [mulJudge, mulZeroEnd, mulDigits, mulEst], hard: [mulEnough, mulThree, mulMaxDigit, mulAge] },
  { mid: [codeEmergency, codeIdAge, codeSeat, codeLocker], hard: [codeOldest, codeCombos, codeIdBuild] },
  { mid: [angleJudge, angleShapes, lineMatch], hard: [linePoints, angleHours] },
  { mid: [fracJudge, fracUnits, fracTo1, fracWhoMore], hard: [fracClass, fracRope, fracLess] },
]
// 旧的 mixWord / mixPick 换成了新版本，单元里的引用也要换掉
UNITS[1].hard = UNITS[1].hard.map(f => (f.name === 'mixWord' ? mixWord : f.name === 'mixPick' ? mixPick : f))
ADD.forEach((a, u) => { UNITS[u].mid = uniq(UNITS[u].mid.concat(a.mid)); UNITS[u].hard = uniq(UNITS[u].hard.concat(a.hard)) })
UNITS[8].mid = uniq(UNITS.slice(0, 8).flatMap(U => U.mid))
UNITS[8].hard = uniq(UNITS.slice(0, 8).flatMap(U => U.hard))
UNITS.forEach((U, u) => { if (!U.mix) ['mid', 'hard'].forEach(kind => U[kind].forEach(f => { ALL_GENS[f.name] = ALL_GENS[f.name] && ALL_GENS[f.name].f === f ? ALL_GENS[f.name] : { f, u, kind } })) })
