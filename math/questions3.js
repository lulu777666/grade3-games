// ============================================================
//  第三版：按新版人教版三年级上册目录重新编排
//  一 观察物体　二 混合运算　三 毫米、分米和千米　综合实践 曹冲称象的故事
//  四 多位数乘一位数　综合实践 数字编码　五 线和角　六 分数的初步认识　七 复习与关联
//  （questions.js 里的旧题目函数，这里会挑合适的继续用）
// ============================================================
const asHtml = q => { q.html = true; return q }
const p2 = n => String(n).padStart(2, '0')

// ============================================================
//  一、观察物体（小正方体搭成的立体图形）
//  模型 h[y][x]：y=0 前排、y=1 后排；x 从左到右；数字是这一格摞了几层
// ============================================================
function cubeModel(minN = 4, maxN = 8) {
  for (let g = 0; g < 500; g++) {
    const cols = pick([2, 3, 3, 3]), rows = pick([1, 2, 2, 2]), top = pick([2, 2, 3])
    const h = Array.from({ length: rows }, () => Array.from({ length: cols }, () => R(0, top)))
    const n = h.flat().reduce((a, b) => a + b, 0)
    if (n < minN || n > maxN) continue
    if (h[0].some((_, x) => h.every(r => r[x] === 0))) continue // 每一列都要有
    if (h.some(r => r.every(v => v === 0))) continue // 每一排都要有
    if (hiddenCube(h)) continue // 不要有完全被挡住、看不见的小正方体
    return h
  }
  return [[1, 2, 1], [1, 0, 0]]
}
function hiddenCube(h) {
  if (h.length < 2) return false
  const f = (x, z) => x < h[0].length && h[0][x] > z
  for (let x = 0; x < h[1].length; x++) for (let z = 0; z < h[1][x]; z++) if (f(x, z) && f(x, z + 1) && f(x + 1, z) && f(x + 1, z + 1)) return true
  return false
}
const colsGrid = hs => { const H = Math.max(...hs); return Array.from({ length: H }, (_, i) => hs.map(v => (v > H - 1 - i ? 1 : 0))) }
const VIEW = {
  front: h => colsGrid(h[0].map((_, x) => Math.max(...h.map(r => r[x])))),
  left: h => colsGrid(h.map(r => Math.max(...r)).reverse()), // 从左面看：后排在左边，前排在右边
  top: h => h.slice().reverse().map(r => r.map(v => (v > 0 ? 1 : 0))), // 从上面看：前排画在下面
}
const VNAME = { front: '正面', left: '左面', top: '上面' }
const gk = g => JSON.stringify(g)
function trimGrid(g) {
  let r = g.filter(row => row.some(v => v))
  const keep = r[0].map((_, j) => r.some(row => row[j]))
  return r.map(row => row.filter((_, j) => keep[j]))
}
function viewSvg(g, big) {
  const s = 22, W = 100, H = 80, rows = g.length, cols = g[0].length, ox = (W - cols * s) / 2, oy = (H - rows * s) / 2
  let r = ''
  g.forEach((row, i) => row.forEach((v, j) => { if (v) r += `<rect x="${ox + j * s}" y="${oy + i * s}" width="${s}" height="${s}"/>` }))
  return `<svg viewBox="0 0 ${W} ${H}" class="vfig${big ? ' big' : ''}"><g fill="#ffd27a" stroke="#a86b00" stroke-width="2">${r}</g></svg>`
}
function cubeSvg(h, cls) {
  const s = 26, d = 13, rows = h.length, cols = h[0].length, top = Math.max(...h.flat())
  const W = cols * s + rows * d + 8, H = top * s + rows * d + 8, ox = 4, oy = H - 4
  let p = ''
  for (let y = rows - 1; y >= 0; y--) for (let x = 0; x < cols; x++) for (let z = 0; z < h[y][x]; z++) {
    const fx = ox + x * s + y * d, fy = oy - (z + 1) * s - y * d
    p += `<path fill="#ffe7a8" d="M${fx} ${fy}l${d} ${-d}h${s}l${-d} ${d}z"/><path fill="#eba93c" d="M${fx + s} ${fy}l${d} ${-d}v${s}l${-d} ${d}z"/><rect fill="#ffcf5c" x="${fx}" y="${fy}" width="${s}" height="${s}"/>`
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="${cls || 'cfig'}" style="--w:${W}"><g stroke="#7a4b00" stroke-width="1.5" stroke-linejoin="round">${p}</g></svg>`
}
// 从上面看，并在格子里写上摞了几层
function numSvg(h) {
  const s = 30, rows = h.length, cols = h[0].length, W = cols * s + 8, H = rows * s + 26
  let r = ''
  h.slice().reverse().forEach((row, i) => row.forEach((v, j) => {
    if (v) r += `<rect x="${4 + j * s}" y="${4 + i * s}" width="${s}" height="${s}" fill="#e6f0ff" stroke="#4a5bd4" stroke-width="2"/><text x="${4 + j * s + s / 2}" y="${4 + i * s + s / 2 + 7}" text-anchor="middle" font-size="19" font-weight="bold" fill="#333">${v}</text>`
  }))
  return `<svg viewBox="0 0 ${W} ${H}" class="nfig">${r}<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-size="12" fill="#888">（下边是正面）</text></svg>`
}
function viewWrongs(g, dir) {
  const out = []
  if (dir === 'top') {
    for (let t = 0; t < 8; t++) {
      const c = g.map(r => r.slice()), i = R(0, c.length - 1), j = R(0, c[0].length - 1)
      c[i][j] = 1 - c[i][j]
      if (c.flat().some(v => v)) out.push(trimGrid(c))
    }
    out.push(g.map(r => r.concat([1])))
  } else {
    const hs = g[0].map((_, j) => g.reduce((a, r) => a + r[j], 0))
    for (let t = 0; t < 8; t++) {
      const c = hs.slice(), j = R(0, c.length - 1)
      c[j] = Math.max(1, c[j] + pick([-1, 1]))
      out.push(colsGrid(c))
    }
    out.push(colsGrid(hs.concat([1])), colsGrid(hs.slice(1).length ? hs.slice(1) : [2]))
  }
  return out
}
function viewTip(h, dir) {
  if (dir === 'front') {
    const hs = h[0].map((_, x) => Math.max(...h.map(r => r[x])))
    return `从正面看，看到的是每一竖列最高有几层：\n从左往右分别是 ${hs.join(' 层、')} 层。\n⚠️ 后排的小正方体被前排挡住了，同一列只看最高的那一摞。`
  }
  if (dir === 'left') {
    if (h.length === 1) return `只有一排，从左面看只能看到 1 列，最高有 ${Math.max(...h[0])} 层。`
    return `从左面看，要想象自己站在物体的左边：\n这时后排在左边，前排在右边。\n后排最高 ${Math.max(...h[1])} 层，前排最高 ${Math.max(...h[0])} 层。\n⚠️ 易错：从左面看，前后两排的位置容易画反。`
  }
  return `从上面看，只看每个位置有没有小正方体，不管摞了几层。\n${h.length > 1 ? '后排画在上面，前排画在下面。\n' : ''}⚠️ 易错：上面摞着的小正方体从上面看只是一个格子。`
}
function obsView() {
  for (let g = 0; g < 60; g++) {
    const h = cubeModel(), dir = pick(['front', 'left', 'top']), ans = VIEW[dir](h)
    const opts = [ans], keys = [gk(ans)]
    const cands = shuffle([VIEW.front(h), VIEW.left(h), VIEW.top(h), ans.map(r => r.slice().reverse())]).concat(shuffle(viewWrongs(ans, dir)))
    for (const c of cands) { const k = gk(c); if (!keys.includes(k) && opts.length < 4) { keys.push(k); opts.push(c) } }
    if (opts.length < 4) continue
    return asHtml(choice('mid', `从${VNAME[dir]}看这个立体图形，看到的是哪个图形？`, viewSvg(ans), opts.map(o => viewSvg(o)), viewTip(h, dir), cubeSvg(h)))
  }
}
function obsWhich() {
  for (let g = 0; g < 60; g++) {
    const h = cubeModel(), dir = pick(['front', 'left', 'top']), v = VIEW[dir](h)
    if (['front', 'left', 'top'].some(o => o !== dir && gk(VIEW[o](h)) === gk(v))) continue
    return choice('mid', '右边的平面图形，是从哪一面看左边的立体图形得到的？', `从${VNAME[dir]}看`, ['从正面看', '从左面看', '从上面看'],
      viewTip(h, dir), `<div class="obsrow">${cubeSvg(h)}<span class="arr">→</span>${viewSvg(v, true)}</div>`, true)
  }
  return obsView()
}
function obsCount() {
  const h = cubeModel(5, 9), n = h.flat().reduce((a, b) => a + b, 0)
  const rowTxt = h.map((r, y) => `${h.length > 1 ? (y === 0 ? '前排' : '后排') : '这一排'}：${r.filter(v => v).join(' + ')} = ${r.reduce((a, b) => a + b, 0)}（个）`).join('\n')
  return input('mid', '这个立体图形是用几个同样大的小正方体搭成的？', n,
    `一排一排地数，每一摞看有几层：\n${rowTxt}\n合起来一共 ${n} 个。\n⚠️ 易错：被上面压住的、后排被挡住一部分的小正方体也要数进去。`, cubeSvg(h), '个')
}
function obsNum() {
  for (let g = 0; g < 60; g++) {
    const h = cubeModel(5, 9)
    if (h.length < 2) continue
    const dir = pick(['front', 'left']), ans = VIEW[dir](h)
    const opts = [ans], keys = [gk(ans)]
    const cands = shuffle([VIEW.front(h), VIEW.left(h), ans.map(r => r.slice().reverse())]).concat(shuffle(viewWrongs(ans, dir)))
    for (const c of cands) { const k = gk(c); if (!keys.includes(k) && opts.length < 4) { keys.push(k); opts.push(c) } }
    if (opts.length < 4) continue
    const hs = dir === 'front' ? h[0].map((_, x) => Math.max(...h.map(r => r[x]))) : h.map(r => Math.max(...r)).reverse()
    return asHtml(choice('hard', `下图是从上面看到的形状，格子里的数表示这个位置摞了几个小正方体。从${VNAME[dir]}看，看到的是哪个图形？`, viewSvg(ans), opts.map(o => viewSvg(o)),
      (dir === 'front' ? '从正面看：每一竖列（上下对齐的格子）取最大的数，\n' : '从左面看：每一横排取最大的数，后排在左、前排在右，\n') +
      `从左往右分别是 ${hs.join(' 层、')} 层。`, numSvg(h)))
  }
  return obsView()
}
function obsModel() {
  for (let g = 0; g < 80; g++) {
    const dir = pick(['front', 'front', 'left']), h0 = cubeModel(), t = gk(VIEW[dir](h0))
    const ms = [h0], seen = [gk(h0)]
    for (let k = 0; k < 200 && ms.length < 4; k++) {
      const m = cubeModel()
      if (seen.includes(gk(m)) || gk(VIEW[dir](m)) === t) continue
      seen.push(gk(m)); ms.push(m)
    }
    if (ms.length < 4) continue
    return asHtml(choice('hard', `从${VNAME[dir]}看是上面这个形状的，是下面哪个立体图形？`, cubeSvg(h0, 'copt'), ms.map(m => cubeSvg(m, 'copt')),
      viewTip(h0, dir) + '\n可以每个选项都想一想“从这一面看是什么样”，再和题目里的图比一比。', `<div class="obsrow">${viewSvg(VIEW[dir](h0), true)}</div>`))
  }
  return obsView()
}

// ============================================================
//  二、混合运算
// ============================================================
// 每个模板返回 { e 算式, v 结果, f 第一步, fv 第一步结果, rest 第二步, rule 规则, other 另一个运算, alts 错的综合算式, wv 从左往右的错误结果 }
const MIX = [
  () => { const b = R(2, 9), c = R(2, 9), a = R(12, 60), m = b * c; return { e: `${a} + ${b} × ${c}`, v: a + m, f: `${b} × ${c}`, fv: m, rest: `${a} + ${m}`, rule: 'mul', other: `${a} + ${b}`, wv: (a + b) * c, alts: [`(${a} + ${b}) × ${c}`, `${a} × ${b} + ${c}`, `${a} + ${b} + ${c}`] } },
  () => { const b = R(2, 9), c = R(2, 9), m = b * c, a = m + R(3, 40); return { e: `${a} − ${b} × ${c}`, v: a - m, f: `${b} × ${c}`, fv: m, rest: `${a} − ${m}`, rule: 'mul', other: `${a} − ${b}`, wv: (a - b) * c, alts: [`(${a} − ${b}) × ${c}`, `${b} × ${c} − ${a}`, `${a} − ${b} + ${c}`] } },
  () => { const a = R(2, 9), b = R(2, 9), m = a * b, c = R(1, m - 1); return { e: `${a} × ${b} − ${c}`, v: m - c, f: `${a} × ${b}`, fv: m, rest: `${m} − ${c}`, rule: 'mul', other: b > c ? `${b} − ${c}` : null, alts: [`${a} × (${b} − ${c})`, `${c} − ${a} × ${b}`, `${a} + ${b} − ${c}`] } },
  () => { const b = R(2, 9), k = R(2, 9), a = b * k, c = R(5, 60); return { e: `${a} ÷ ${b} + ${c}`, v: k + c, f: `${a} ÷ ${b}`, fv: k, rest: `${k} + ${c}`, rule: 'div', other: `${b} + ${c}`, alts: [`${a} ÷ (${b} + ${c})`, `${a} + ${c} ÷ ${b}`, `(${a} + ${c}) ÷ ${b}`] } },
  () => { const c = R(2, 9), k = R(2, 9), b = c * k, a = k + R(5, 60); return { e: `${a} − ${b} ÷ ${c}`, v: a - k, f: `${b} ÷ ${c}`, fv: k, rest: `${a} − ${k}`, rule: 'div', other: a > b ? `${a} − ${b}` : null, wv: a > b && (a - b) % c === 0 ? (a - b) / c : null, alts: [`(${a} − ${b}) ÷ ${c}`, `${a} ÷ ${c} − ${b}`, `${b} ÷ ${c} − ${a}`] } },
  () => { const c = R(2, 9), k = R(2, 9), b = c * k, a = c * R(2, 9); return { e: `${a} + ${b} ÷ ${c}`, v: a + k, f: `${b} ÷ ${c}`, fv: k, rest: `${a} + ${k}`, rule: 'div', other: `${a} + ${b}`, wv: (a + b) / c, alts: [`(${a} + ${b}) ÷ ${c}`, `${a} ÷ ${c} + ${b}`, `${a} + ${b} + ${c}`] } },
  () => { const a = R(2, 6), b = R(1, 9 - a), c = R(2, 9), s = a + b; return { e: `(${a} + ${b}) × ${c}`, v: s * c, f: `${a} + ${b}`, fv: s, rest: `${s} × ${c}`, rule: 'paren', other: `${b} × ${c}`, wv: a + b * c, alts: [`${a} + ${b} × ${c}`, `${a} × ${c} + ${b}`, `${a} × (${b} + ${c})`] } },
  () => { const a = R(10, 30), k = R(2, 9), b = a - k, c = R(2, 9); return { e: `(${a} − ${b}) × ${c}`, v: k * c, f: `${a} − ${b}`, fv: k, rest: `${k} × ${c}`, rule: 'paren', other: `${b} × ${c}`, wv: a - b * c >= 0 ? a - b * c : null, alts: [`${a} − ${b} × ${c}`, `${a} × ${c} − ${b}`, `(${a} + ${b}) × ${c}`] } },
  () => { const c = R(2, 9), k = R(2, 9), s = c * k, a = R(Math.max(2, Math.ceil(s / 3)), s - 2), b = s - a; return { e: `(${a} + ${b}) ÷ ${c}`, v: k, f: `${a} + ${b}`, fv: s, rest: `${s} ÷ ${c}`, rule: 'paren', other: `${b} ÷ ${c}`, wv: b % c === 0 ? a + b / c : null, alts: [`${a} + ${b} ÷ ${c}`, `${a} ÷ ${c} + ${b}`, `(${a} + ${b}) × ${c}`] } },
  () => { const c = R(2, 9), k = R(2, 9), d = c * k, b = R(5, 40), a = d + b; return { e: `(${a} − ${b}) ÷ ${c}`, v: k, f: `${a} − ${b}`, fv: d, rest: `${d} ÷ ${c}`, rule: 'paren', other: `${b} ÷ ${c}`, alts: [`${a} − ${b} ÷ ${c}`, `${a} ÷ ${c} − ${b}`, `(${a} + ${b}) ÷ ${c}`] } },
  () => { const k = R(2, 9), q = R(2, 9), a = k * q, c = R(1, 20), b = c + k; return { e: `${a} ÷ (${b} − ${c})`, v: q, f: `${b} − ${c}`, fv: k, rest: `${a} ÷ ${k}`, rule: 'paren', other: `${a} ÷ ${b}`, alts: [`${a} ÷ ${b} − ${c}`, `(${a} − ${c}) ÷ ${b}`, `${a} − ${b} ÷ ${c}`] } },
  () => { const a = R(2, 9), b = R(1, 6), c = R(1, 9 - b), s = b + c; return { e: `${a} × (${b} + ${c})`, v: a * s, f: `${b} + ${c}`, fv: s, rest: `${a} × ${s}`, rule: 'paren', other: `${a} × ${b}`, wv: a * b + c, alts: [`${a} × ${b} + ${c}`, `(${a} + ${b}) × ${c}`, `${a} + ${b} × ${c}`] } },
  () => { const a = R(40, 95), b = R(10, a - 15), c = R(5, 30); return { e: `${a} − ${b} + ${c}`, v: a - b + c, f: `${a} − ${b}`, fv: a - b, rest: `${a - b} + ${c}`, rule: 'ltr', other: `${b} + ${c}`, wv: a - b - c >= 0 ? a - b - c : null, alts: [`${a} − (${b} + ${c})`, `${a} + ${c} + ${b}`, `${b} − ${a} + ${c}`] } },
  () => { const a = R(50, 99), b = R(10, 30), c = R(5, a - b - 5); return { e: `${a} − (${b} + ${c})`, v: a - b - c, f: `${b} + ${c}`, fv: b + c, rest: `${a} − ${b + c}`, rule: 'paren', other: `${a} − ${b}`, wv: a - b + c, alts: [`${a} − ${b} + ${c}`, `${a} + ${b} − ${c}`, `(${a} − ${b}) + ${c}`] } },
  () => { for (;;) { const a = R(2, 9), b = R(2, 9), c = R(2, 9), m = a * b; if (m % c || m / c > 9 || c === a || c === b) continue; return { e: `${a} × ${b} ÷ ${c}`, v: m / c, f: `${a} × ${b}`, fv: m, rest: `${m} ÷ ${c}`, rule: 'ltr2', other: b % c === 0 ? `${b} ÷ ${c}` : null, alts: [`${c} × ${b} ÷ ${a}`, `${a} × ${b} − ${c}`, `${a} + ${b} ÷ ${c}`] } } },
  () => { const b = R(2, 9), k = R(2, 9), a = b * k, c = R(2, 9); return { e: `${a} ÷ ${b} × ${c}`, v: k * c, f: `${a} ÷ ${b}`, fv: k, rest: `${k} × ${c}`, rule: 'ltr2', other: `${b} × ${c}`, wv: a % (b * c) === 0 ? a / (b * c) : null, alts: [`${a} ÷ (${b} × ${c})`, `${a} ÷ ${b} + ${c}`, `${b} × ${c} ÷ ${a}`] } },
]
const RULE = {
  mul: '没有括号，有乘法也有加减法：先算乘法，再算加减法。',
  div: '没有括号，有除法也有加减法：先算除法，再算加减法。',
  paren: '有括号，要先算括号里面的。',
  ltr: '只有加法和减法：从左往右依次计算。',
  ltr2: '只有乘法和除法：从左往右依次计算。',
}
const mixSteps = m => `${RULE[m.rule]}\n第1步：${m.f} = ${m.fv}\n第2步：${m.rest} = ${m.v}`
const mixWarn = m => (m.rule === 'mul' || m.rule === 'div' ? `\n⚠️ 易错：不能直接从左往右算！` : m.rule === 'paren' ? '\n⚠️ 易错：看到括号，先算括号里的。' : '')
function mixCalc() {
  const m = pick(MIX)()
  return input('mid', `计算：${m.e} =`, m.v, mixSteps(m) + mixWarn(m))
}
function mixFirst() {
  for (;;) {
    const m = pick(MIX)()
    if (!m.other) continue
    const ans = `先算 ${m.f}`
    return choice('mid', `计算 ${m.e} 时，应该先算哪一步？`, ans, [ans, `先算 ${m.other}`, '先算哪一步都一样'], `${RULE[m.rule]}\n所以${ans}，得 ${m.fv}；\n再算 ${m.rest} = ${m.v}。`, null, true)
  }
}
function mixJudge() {
  for (;;) {
    const m = pick(MIX)()
    if (m.wv == null || !Number.isInteger(m.wv) || m.wv === m.v || m.wv < 0) continue
    const right = Math.random() < 0.45, show = right ? m.v : m.wv
    return choice('mid', `判断对错：${m.e} = ${show}`, right ? '对' : '错', ['对', '错'],
      `${RULE[m.rule]}\n第1步：${m.f} = ${m.fv}\n第2步：${m.rest} = ${m.v}\n所以 ${m.e} = ${m.v}，${right ? '这道题算对了 ✔' : `不是 ${m.wv}。\n⚠️ ${m.wv} 是按错误的顺序算出来的。`}`, null, true)
  }
}
function mixMatch() {
  const pairs = [], vs = new Set()
  for (let g = 0; g < 200 && pairs.length < 4; g++) {
    const m = pick(MIX)()
    if (vs.has(m.v)) continue
    vs.add(m.v); pairs.push([m.e, String(m.v)])
  }
  return matchQ('mid', '连一连：把算式和得数配成对', pairs, '先看运算顺序，再算：\n' + pairs.map(p => `${p[0]} = ${p[1]}`).join('\n') + '\n记住：有括号先算括号里的；没有括号先算乘除，后算加减。')
}
function mixMerge() {
  const m = pick(MIX)()
  const opts = [m.e, ...m.alts]
  return choice('mid', `把两道分步算式合成一道综合算式：\n${m.f} = ${m.fv}\n${m.rest} = ${m.v}`, m.e, opts,
    `第一步算的是 ${m.f}，要让它在综合算式里先算。\n${m.rule === 'paren' ? '它是加减法（或要先算的部分），所以要加上括号。' : m.rule.startsWith('ltr') ? '从左往右算，本来就先算它，不用加括号。' : '乘除法本来就先算，不用加括号。'}\n所以综合算式是：${m.e}`)
}
function mixParen() {
  for (;;) {
    const a = R(2, 5), b = R(2, 9 - a), c = R(4, 9), d = R(1, c - 2)
    const E = [[`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d], [`${a} + ${b} × (${c} − ${d})`, a + b * (c - d)], [`(${a} + ${b}) × (${c} − ${d})`, (a + b) * (c - d)], [`${a} + ${b} × ${c} − ${d}`, a + b * c - d]]
    if (new Set(E.map(x => x[1])).size < 4) continue
    const [ans, v] = E[R(0, 2)]
    return choice('hard', `在 ${a} + ${b} × ${c} − ${d} 里添上括号，使结果等于 ${v}。下面添得对的是哪一个？`, ans, E.map(x => x[0]),
      '每个都算一算：\n' + E.map(x => `${x[0]} = ${x[1]}`).join('\n') + `\n所以 ${ans} 的结果是 ${v}。\n⚠️ 括号能改变运算顺序，括号里的要先算。`)
  }
}
const WORD = [
  n => { const p = R(6, 9), d = R(3, 8), N = p * d + R(12, 48), v = N - p * d; return { q: `一本故事书有 ${N} 页，${n}每天看 ${p} 页，看了 ${d} 天。还剩多少页没看？`, v, u: '页', e: `${N} − ${p} × ${d}`, alts: [`(${N} − ${p}) × ${d}`, `${N} − ${p} + ${d}`, `${p} × ${d} + ${N}`], s: `第1步 已经看了：${p} × ${d} = ${p * d}（页）\n第2步 还剩：${N} − ${p * d} = ${v}（页）` } },
  n => { const c = R(3, 9), k = R(3, 9), s = c * k, a = R(Math.ceil(s / 2), s - 2), b = s - a; return { q: `篮子里有 ${a} 个苹果，又放进 ${b} 个，平均分给 ${c} 个小朋友，每人分到几个？`, v: k, u: '个', e: `(${a} + ${b}) ÷ ${c}`, alts: [`${a} + ${b} ÷ ${c}`, `${a} ÷ ${c} + ${b}`, `(${a} + ${b}) × ${c}`], s: `第1步 一共有：${a} + ${b} = ${s}（个）\n第2步 每人分：${s} ÷ ${c} = ${k}（个）` } },
  n => { const p = R(3, 9), k = R(2, 9), M = p * k < 45 ? pick([50, 100]) : 100, v = M - p * k; return { q: `${n}带了 ${M} 元，买了 ${k} 个笔记本，每个 ${p} 元。还剩多少元？`, v, u: '元', e: `${M} − ${p} × ${k}`, alts: [`(${M} − ${p}) × ${k}`, `${M} − ${p} − ${k}`, `${M} + ${p} × ${k}`], s: `第1步 买本子花了：${p} × ${k} = ${p * k}（元）\n第2步 还剩：${M} − ${p * k} = ${v}（元）` } },
  () => { const c = R(4, 8), k = R(3, 9), s = c * k, a = Math.max(2, Math.floor(s / 2) + R(-3, 3)), b = s - a; return { q: `三年级去春游，有男生 ${a} 人，女生 ${b} 人，每 ${c} 人分成一组，可以分成几组？`, v: k, u: '组', e: `(${a} + ${b}) ÷ ${c}`, alts: [`${a} + ${b} ÷ ${c}`, `${a} ÷ ${c} + ${b}`, `(${a} − ${b}) ÷ ${c}`], s: `第1步 一共有：${a} + ${b} = ${s}（人）\n第2步 分成：${s} ÷ ${c} = ${k}（组）` } },
  () => { const a = R(6, 9), k = R(3, 9), b = R(10, 30), v = a * k + b; return { q: `每箱有 ${a} 瓶牛奶，搬来 ${k} 箱，又拿来 ${b} 瓶散装的。一共有多少瓶？`, v, u: '瓶', e: `${a} × ${k} + ${b}`, alts: [`${a} × (${k} + ${b})`, `${a} + ${k} × ${b}`, `(${a} + ${b}) × ${k}`], s: `第1步 ${k} 箱有：${a} × ${k} = ${a * k}（瓶）\n第2步 一共：${a * k} + ${b} = ${v}（瓶）` } },
  n => { const c = R(3, 9), k = R(3, 9), r = c * k, b = R(5, 30), a = r + b; return { q: `${n}有 ${a} 张卡片，送给同学 ${b} 张后，剩下的平均放进 ${c} 个盒子。每盒放几张？`, v: k, u: '张', e: `(${a} − ${b}) ÷ ${c}`, alts: [`${a} − ${b} ÷ ${c}`, `${a} ÷ ${c} − ${b}`, `(${a} + ${b}) ÷ ${c}`], s: `第1步 还剩：${a} − ${b} = ${r}（张）\n第2步 每盒：${r} ÷ ${c} = ${k}（张）` } },
  () => { const k = R(3, 9), q = R(3, 9), N = k * q, b = R(2, 9); return { q: `有 ${N} 个桃，平均分给 ${k} 只小猴，猴妈妈又给每只小猴 ${b} 个。现在每只小猴有几个桃？`, v: q + b, u: '个', e: `${N} ÷ ${k} + ${b}`, alts: [`${N} ÷ (${k} + ${b})`, `${N} + ${b} ÷ ${k}`, `(${N} + ${b}) ÷ ${k}`], s: `第1步 先分：${N} ÷ ${k} = ${q}（个）\n第2步 再加：${q} + ${b} = ${q + b}（个）` } },
  () => { const p = R(6, 9), r = R(5, 9), s = R(10, p * r - 5), v = p * r - s; return { q: `小剧场每排有 ${p} 个座位，一共 ${r} 排，已经坐了 ${s} 人。还空着多少个座位？`, v, u: '个', e: `${p} × ${r} − ${s}`, alts: [`${p} × (${r} − ${s})`, `${s} − ${p} × ${r}`, `${p} + ${r} − ${s}`], s: `第1步 一共有座位：${p} × ${r} = ${p * r}（个）\n第2步 还空着：${p * r} − ${s} = ${v}（个）` } },
]
function mixWord() {
  const w = pick(WORD)(pick(NAMES))
  return input('hard', w.q, w.v, `${w.s}\n综合算式：${w.e} = ${w.v}`, null, w.u)
}
function mixPick() {
  const w = pick(WORD)(pick(NAMES))
  return choice('hard', `${w.q}\n下面哪个综合算式是对的？`, w.e, [w.e, ...w.alts], `${w.s}\n把两步合起来：${w.e} = ${w.v}\n${/\(/.test(w.e) ? '⚠️ 要先算的加减法，必须加上括号。' : '⚠️ 乘除法本来就先算，不用加括号。'}`)
}

// ============================================================
//  三、毫米、分米和千米
// ============================================================
function lenConv() { return u3Conv([0, 1, 2, 3, 4, 7, 8]) }
function lenCmp() { return u3Cmp(R(0, 1)) }
function lenUnit() { return u3Unit('len') }
function lenPop() { return u3Pop('len') }
function rulerSvg(start, mm) {
  // 只画需要的那一段尺子，刻度更大，毫米小格看得清
  const cm = Math.min(10, Math.ceil((start * 10 + mm) / 10) + 1), u = 266 / (cm * 10), x0 = 17
  let t = ''
  for (let i = 0; i <= cm * 10; i++) { const x = x0 + i * u, L = i % 10 === 0 ? 18 : i % 5 === 0 ? 13 : 8; t += `<line x1="${x.toFixed(1)}" y1="48" x2="${x.toFixed(1)}" y2="${48 + L}"/>` }
  let n = ''
  for (let c = 0; c <= cm; c++) n += `<text x="${(x0 + c * 10 * u).toFixed(1)}" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="#333">${c}</text>`
  const a = x0 + start * 10 * u, b = a + mm * u
  return `<svg viewBox="0 0 300 100" class="fig wide ruler"><rect x="6" y="46" width="288" height="48" rx="4" fill="#fff6d6" stroke="#c9a54a"/>` +
    `<g stroke="#555" stroke-width="1.2">${t}</g>${n}<text x="290" y="92" text-anchor="end" font-size="9" fill="#888">单位：厘米</text>` +
    `<path d="M${a} 20h${(b - a - 12).toFixed(1)}l12 8l-12 8h${-(b - a - 12).toFixed(1)}z" fill="#ff9f1c" stroke="#b86a00"/><line x1="${a}" y1="18" x2="${a}" y2="46" stroke="#e8505b" stroke-dasharray="3 2"/><line x1="${b.toFixed(1)}" y1="18" x2="${b.toFixed(1)}" y2="46" stroke="#e8505b" stroke-dasharray="3 2"/></svg>`
}
function lenRuler() {
  let mm; do { mm = R(13, 59) } while (mm % 10 === 0)
  return input('mid', '这支铅笔长多少毫米？', mm,
    `铅笔从 0 刻度开始，到 ${Math.floor(mm / 10)} 厘米再过 ${mm % 10} 个小格。\n1 厘米 = 10 毫米，${Math.floor(mm / 10)} 厘米 = ${Math.floor(mm / 10) * 10} 毫米，\n再加 ${mm % 10} 毫米：${Math.floor(mm / 10) * 10} + ${mm % 10} = ${mm}（毫米）。\n⚠️ 每一个小格是 1 毫米。`, rulerSvg(0, mm), '毫米')
}
function lenRulerH() {
  const s = R(1, 3)
  let mm; do { mm = R(15, 69 - s * 10) } while (mm % 10 === 0)
  const e = s * 10 + mm
  return input('hard', '这根小棒长多少毫米？（看清楚，它不是从 0 开始的）', mm,
    `左端对着 ${s} 厘米（${s * 10} 毫米），右端对着 ${Math.floor(e / 10)} 厘米 ${e % 10} 毫米（${e} 毫米）。\n长度 = 右端 − 左端：${e} − ${s * 10} = ${mm}（毫米）。\n⚠️ 易错：不从 0 开始量时，不能直接读右端的刻度。`, rulerSvg(s, mm), '毫米')
}
function lenAdd() {
  const t = R(0, 2)
  if (t === 0) { const a = R(2, 9), b = R(2, 9); return input('mid', `${a}厘米 + ${b}毫米 =（　）毫米`, a * 10 + b, `先统一单位：${a}厘米 = ${a * 10}毫米，\n${a * 10} + ${b} = ${a * 10 + b}（毫米）。`) }
  if (t === 1) { const a = R(2, 9), b = R(1, 9); return input('mid', `${a}分米 − ${b}厘米 =（　）厘米`, a * 10 - b, `先统一单位：${a}分米 = ${a * 10}厘米，\n${a * 10} − ${b} = ${a * 10 - b}（厘米）。`) }
  const a = R(2, 5), b = R(1, 9); return input('mid', `${a}米 − ${b}分米 =（　）分米`, a * 10 - b, `先统一单位：${a}米 = ${a * 10}分米，\n${a * 10} − ${b} = ${a * 10 - b}（分米）。`)
}
function lenWalk() {
  const n = pick(NAMES), a = R(25, 48) * 10, b = R(15, 40) * 10, s = a + b
  return input('hard', `${n}家到学校 ${a} 米，学校到图书馆 ${b} 米。${n}从家经过学校去图书馆，再按原路走回家，一共走了多少米？`, s * 2,
    `第1步 去的时候：${a} + ${b} = ${s}（米）；\n第2步 回来的路一样长，也是 ${s} 米；\n一共：${s} + ${s} = ${s * 2}（米）。\n⚠️ 易错：“原路走回家”说明要走两趟。`, null, '米')
}
function lenTrack() {
  const n = pick(NAMES)
  const [L, k, goal] = pick([[400, 1, 1], [400, 2, 1], [200, 3, 1], [200, 4, 1], [250, 3, 1], [400, 3, 2], [400, 4, 2], [500, 3, 2]])
  const ran = L * k, left = goal * 1000 - ran
  return input('hard', `操场跑道一圈是 ${L} 米，${n}跑了 ${k} 圈。再跑多少米，就正好跑了 ${goal} 千米？`, left,
    `第1步 已经跑了：${L} × ${k} = ${ran}（米）；\n第2步 ${goal} 千米 = ${goal * 1000} 米；\n第3步 还要跑：${goal * 1000} − ${ran} = ${left}（米）。`, null, '米')
}
function lenCut() {
  const [a, b] = pick([[1, 2], [1, 5], [2, 4], [2, 5], [3, 5], [3, 6], [4, 5], [4, 8]]), n = a * 10 / b
  return input('hard', `一根彩带长 ${a} 米，剪成每段长 ${b} 分米的小段，可以剪成几段？`, n,
    `单位不同，先统一单位：${a} 米 = ${a * 10} 分米，\n${a * 10} ÷ ${b} = ${n}（段）。\n⚠️ 易错：不能直接用 ${a} 和 ${b} 来算。`, null, '段')
}

// ============================================================
//  综合实践：曹冲称象的故事（吨、千克、克，等量替换）
// ============================================================
function wtConv() {
  const t = R(0, 7)
  if (t === 0) { const a = R(2, 9); return input('mid', `${a}吨 =（　）千克`, a * 1000, `1吨 = 1000千克，${a}吨 = ${a} 个 1000 千克 = ${a * 1000}千克。`) }
  if (t === 1) { const a = R(2, 9); return input('mid', `${a * 1000}千克 =（　）吨`, a, `1000千克 = 1吨，${a * 1000}千克里有 ${a} 个 1000千克，就是 ${a} 吨。`) }
  if (t === 2) { const a = R(2, 9); return input('mid', `${a}千克 =（　）克`, a * 1000, `1千克 = 1000克，${a}千克 = ${a * 1000}克。`) }
  if (t === 3) { const a = R(2, 9); return input('mid', `${a * 1000}克 =（　）千克`, a, `1000克 = 1千克，${a * 1000}克 = ${a}千克。`) }
  if (t === 4) { const a = R(1, 5), b = R(1, 9) * 100; return input('mid', `${a}吨${b}千克 =（　）千克`, a * 1000 + b, `${a}吨 = ${a * 1000}千克，\n${a * 1000} + ${b} = ${a * 1000 + b}（千克）。`) }
  if (t === 5) { const a = R(1, 5), b = R(1, 9) * 100; return input('mid', `${a}千克${b}克 =（　）克`, a * 1000 + b, `${a}千克 = ${a * 1000}克，\n${a * 1000} + ${b} = ${a * 1000 + b}（克）。`) }
  if (t === 6) { const a = R(1, 3), b = R(1, a * 10 - 1) * 100; return input('mid', `${a}千克 − ${b}克 =（　）克`, a * 1000 - b, `先统一单位：${a}千克 = ${a * 1000}克，\n${a * 1000} − ${b} = ${a * 1000 - b}（克）。`) }
  const a = R(1, 4), b = R(1, a * 10 - 1) * 100
  return input('mid', `${a}吨 − ${b}千克 =（　）千克`, a * 1000 - b, `先统一单位：${a}吨 = ${a * 1000}千克，\n${a * 1000} − ${b} = ${a * 1000 - b}（千克）。`)
}
function wtCmp() {
  const t = R(0, 5)
  if (t === 0) { const a = R(2, 8), b = a * 1000 + pick([-200, 0, 100, -50]); return cmpQ('mid', `${a}千克 ○ ${b}克`, a * 1000, b, `先统一单位：${a}千克 = ${a * 1000}克，\n再比较 ${a * 1000} 和 ${b}。`) }
  if (t === 1) { const a = R(2, 8), b = a * 1000 + pick([-500, 0, 300, -100]); return cmpQ('mid', `${a}吨 ○ ${b}千克`, a * 1000, b, `先统一单位：${a}吨 = ${a * 1000}千克，\n再比较 ${a * 1000} 和 ${b}。`) }
  if (t === 2) { const a = R(1, 4), c = R(1, 9) * 100, b = a * 1000 + c + pick([-100, 0, 100]); return cmpQ('mid', `${a}吨${c}千克 ○ ${b}千克`, a * 1000 + c, b, `${a}吨${c}千克 = ${a * 1000 + c}千克，\n再和 ${b}千克 比。`) }
  if (t === 3) { const a = R(3, 7) * 100, b = R(3, 7) * 100; return cmpQ('mid', `${a}千克 + ${b}千克 ○ 1吨`, a + b, 1000, `${a} + ${b} = ${a + b}（千克），1吨 = 1000千克，\n再比较 ${a + b} 和 1000。`) }
  if (t === 4) { const a = R(3, 9) * 100; return cmpQ('mid', `${a}克 ○ 1千克`, a, 1000, `1千克 = 1000克，${a} < 1000。`) }
  return cmpQ('mid', pick(['1千克铁 ○ 1000克棉花', '1吨棉花 ○ 1000千克铁']), 1, 1, '先统一单位，它们的重量完全一样！\n⚠️ 易错：不要被“铁很重、棉花很轻”骗了，要看数量和单位。')
}
function wtUnit() { return u3Unit('wt') }
function wtPop() { return u3Pop('wt') }
function wtOrder() {
  const base = R(1, 3)
  const vals = uniq([base * 1000, base * 1000 - R(1, 4) * 100, base * 1000 + R(1, 4) * 100, (base + 1) * 1000]).slice(0, 4)
  if (vals.length < 4) return wtOrder()
  const show = v => (v % 1000 === 0 ? `${v / 1000}吨` : v > 1000 && Math.random() < 0.5 ? `${Math.floor(v / 1000)}吨${v % 1000}千克` : `${v}千克`)
  const sorted = vals.slice().sort((a, b) => a - b), shown = sorted.map(show)
  return orderQ('mid', '按从轻到重的顺序，依次点一点', shown, `先都换成“千克”：\n${sorted.map((v, i) => `${shown[i]} = ${v}千克`).join('\n')}\n所以：${shown.join(' < ')}`)
}
function caoStone() {
  const [t, k] = pick([[2, 4], [2, 5], [3, 5], [3, 6], [4, 5], [4, 8]]), w = t * 1000 / k, inT = Math.random() < 0.5
  return input('hard', `曹冲称象：先把大象赶上船，在船身和水面齐平的地方画一条线。再把大象赶下船，往船上装石头，直到船沉到同一条线。石头分成 ${k} 堆来称，每堆重 ${w} 千克。这头大象重多少${inT ? '吨' : '千克'}？`, inT ? t : t * 1000,
    `船沉到同一条线，说明石头和大象一样重，这就是“等量替换”。\n石头一共重：${w} × ${k} = ${t * 1000}（千克）\n${inT ? `${t * 1000}千克 = ${t}吨，所以大象重 ${t} 吨。` : `所以大象重 ${t * 1000} 千克。`}`, null, inT ? '吨' : '千克')
}
function caoSwap() {
  if (Math.random() < 0.5) {
    const a = R(3, 6), b = R(2, 9)
    return input('hard', `1 头大象和 ${a} 头牛一样重，1 头牛和 ${b} 只羊一样重。1 头大象和几只羊一样重？`, a * b,
      `用“等量替换”：\n1 头大象 = ${a} 头牛，\n每头牛都可以换成 ${b} 只羊，\n${a} 头牛 = ${b} × ${a} = ${a * b} 只羊。\n所以 1 头大象和 ${a * b} 只羊一样重。`, null, '只')
  }
  const k = R(2, 4), m = R(2, 5)
  return input('hard', `天平上，2 个菠萝和 ${2 * k} 个苹果一样重，1 个苹果和 ${m} 个梨一样重。1 个菠萝和几个梨一样重？`, k * m,
    `第1步 2 个菠萝 = ${2 * k} 个苹果，所以 1 个菠萝 = ${2 * k} ÷ 2 = ${k} 个苹果；\n第2步 1 个苹果 = ${m} 个梨，${k} 个苹果 = ${m} × ${k} = ${k * m} 个梨。\n所以 1 个菠萝和 ${k * m} 个梨一样重。`, null, '个')
}
function caoIdea() {
  const pool = [
    ['曹冲是用什么办法称出大象有多重的？', '用石头代替大象，称石头的重量', ['把大象切成几块来称', '找一杆特别大的秤直接称', '看一看，估一估'], '大象太重，没有能直接称它的秤。曹冲让石头和大象让船沉到同一条线，石头就和大象一样重，再一块一块称石头。这叫“等量替换”。'],
    ['称象时，为什么一定要让装石头的船沉到同一条线？', '这样石头和大象一样重', ['这样船不会翻', '这样石头好搬', '这样水不会进船里'], '船沉得一样深，说明船上东西的重量一样。所以石头的重量就是大象的重量。'],
    ['为什么不直接称大象，而要称石头？', '石头能分成一块一块的，能用秤称', ['石头比大象重', '大象不肯站上秤', '石头更好看'], '大象是一个整体，太重了称不了；石头可以分开，一块一块称完再加起来。'],
    ['1 吨和 1000 千克比，哪个重？', '一样重', ['1吨重', '1000千克重', '没法比'], '1吨 = 1000千克，所以它们一样重。'],
    ['3 吨棉花和 3000 千克铁，哪个重？', '一样重', ['铁重', '棉花重', '没法比'], '3吨 = 3000千克，重量一样。\n⚠️ 不要被“铁很重”骗了，要看数量和单位。'],
    ['计量很重的东西（比如大象、货车上的货物），通常用什么作单位？', '吨', ['克', '千克', '米'], '计量很重的物品，通常用“吨”作单位。1吨 = 1000千克。'],
  ]
  const [q, a, wr, tip] = pick(pool)
  return choice('mid', q, a, [a, ...wr], tip)
}

// ============================================================
//  四、多位数乘一位数（补充一道找错题）
// ============================================================
function mulFind() {
  let a, k
  do { a = R(13, 89); k = R(3, 9) } while (a % 10 * k < 10 || a * k >= 1000)
  const c = Math.floor(a % 10 * k / 10), wrong = a * k - c * 10, n = pick(NAMES)
  const ans = '十位没有加上个位进上来的数'
  return choice('hard', `${n}算 ${a} × ${k} = ${wrong}，错在哪里？`, ans, [ans, '个位算错了', '十位乘错了', '没有错'],
    `正确的算法：\n${mulSteps(a, k)}\n${n}的得数比正确答案少了 ${c * 10}，说明十位忘了加上个位进上来的 ${c}。`, null, true)
}

// ============================================================
//  综合实践：数字编码
// ============================================================
const REGION = ['530102', '530702', '110105', '440305', '510107', '330106', '530381', '420102']
function makeId(y, mo, d, male, reg, seq, ck) {
  const sx = male ? pick([1, 3, 5, 7, 9]) : pick([0, 2, 4, 6, 8])
  return (reg || pick(REGION)) + y + p2(mo) + p2(d) + (seq || p2(R(10, 99))) + sx + (ck != null ? ck : R(0, 9))
}
const bday = () => [R(2013, 2018), R(1, 12), R(1, 28)]
function codeIdDate() {
  const [y, mo, d] = bday(), id = makeId(y, mo, d, Math.random() < 0.5), ans = `${y}年${mo}月${d}日`
  return choice('mid', `一个身份证号码是 ${id}。\n身份证号码的第 7～14 位表示出生日期。这个人是哪天出生的？`, ans,
    opts4(ans, [d <= 12 && d !== mo ? `${y}年${d}月${mo}日` : `${y}年${mo}月${d + 1}日`, `${y + 1}年${mo}月${d}日`, `${y - 1}年${mo}月${d}日`], () => `${y}年${R(1, 12)}月${R(1, 28)}日`),
    `从左往右数到第 7 位：\n第 7～10 位 ${y} 是年，第 11～12 位 ${p2(mo)} 是月，第 13～14 位 ${p2(d)} 是日。\n所以是 ${ans} 出生的。\n（前 6 位是地址码，表示户口所在的地方。）`)
}
function codeIdSex() {
  const [y, mo, d] = bday(), male = Math.random() < 0.5, id = makeId(y, mo, d, male), x = id[16]
  return choice('mid', `身份证号码 ${id}。\n第 17 位（倒数第二位）是单数表示男性，是双数表示女性。这个人是男性还是女性？`, male ? '男性' : '女性', ['男性', '女性'],
    `第 17 位是 ${x}，${x} 是${male ? '单' : '双'}数，所以是${male ? '男' : '女'}性。\n⚠️ 要数清楚是第 17 位，不是最后一位。`, null, true)
}
function codeIdFind() {
  const [y, mo, d] = bday(), reg = pick(REGION), seq = p2(R(10, 99)), ck = R(0, 9)
  const ans = makeId(y, mo, d, false, reg, seq, ck)
  const dd = d <= 12 && d !== mo ? [d, mo] : [mo, d === 28 ? 27 : d + 1]
  const opts = [ans, makeId(y, mo, d, true, reg, seq, ck), makeId(y, dd[0], dd[1], false, reg, seq, ck), makeId(y - 1, mo, d, false, reg, seq, ck)]
  const q = choice('hard', `${y}年${mo}月${d}日出生的一个女孩，她的身份证号码可能是哪一个？`, ans, opts,
    `要看两个地方：\n① 第 7～14 位要是 ${y}${p2(mo)}${p2(d)}；\n② 第 17 位要是双数（女性）。\n只有 ${ans} 两样都对。`)
  q.wide = true
  return q
}
function codeStudent() {
  const y = R(2022, 2025), c = R(1, 9), s = R(1, 45), n = pick(NAMES)
  let ey, ec, es; do { ey = R(2020, 2025); ec = R(1, 9); es = R(1, 45) } while (ey === y && ec === c)
  const ans = `${y}${p2(c)}${p2(s)}`
  return input('mid', `学校这样编学号：入学年份（4位）+ 班级（2位）+ 座号（2位）。\n例如：${ey}年入学、${ec}班、${es}号，学号是 ${ey}${p2(ec)}${p2(es)}。\n${n} ${y}年入学，在 ${c} 班，座号是 ${s} 号，学号是多少？`, ans,
    `按规则一段一段写：\n入学年份 ${y}，班级 ${p2(c)}，座号 ${p2(s)}\n合起来是 ${ans}。\n⚠️ 易错：班级、座号不够两位时，前面要补 0。`)
}
function codeStudentRead() {
  const y = R(2022, 2025), c = R(1, 9), s = R(1, 45), id = `${y}${p2(c)}${p2(s)}`, askC = Math.random() < 0.5
  return input('mid', `学号的编法：入学年份（4位）+ 班级（2位）+ 座号（2位）。\n学号 ${id} 的同学在${askC ? '几班' : '班里是几号'}？`, askC ? c : s,
    `把学号分成三段：${y} | ${p2(c)} | ${p2(s)}\n${y} 是入学年份，${p2(c)} 是班级（${c} 班），${p2(s)} 是座号（${s} 号）。`, null, askC ? '班' : '号')
}
function codeRoom() {
  const f = R(2, 9), r = R(1, 19), code = `${f}${p2(r)}`
  if (Math.random() < 0.5) {
    const ans = `${f}楼第${r}间`
    return choice('mid', `宾馆的房间编号：第 1 位表示楼层，后两位表示第几间。${code} 号房间在哪里？`, ans,
      opts4(ans, [r <= 9 ? `${r}楼第${f}间` : `${Math.floor(r / 10)}楼第${f}${r % 10}间`, `${f + 1}楼第${r}间`, `${f}楼第${r + 1}间`], () => `${R(2, 9)}楼第${R(1, 19)}间`),
      `${code}：第 1 位 ${f} 表示 ${f} 楼，后两位 ${p2(r)} 表示第 ${r} 间。\n所以是 ${ans}。`)
  }
  return input('mid', `宾馆的房间编号：第 1 位表示楼层，后两位表示第几间。${f} 楼第 ${r} 间房间的编号是多少？`, code,
    `楼层 ${f} 写在第 1 位，第 ${r} 间写成两位数 ${p2(r)}，\n合起来是 ${code}。${r < 10 ? '\n⚠️ 易错：第 ' + r + ' 间要写成 ' + p2(r) + '，不能写成 ' + f + r + '。' : ''}`)
}
function codePost() {
  const pre = pick(['10', '20', '30', '51', '53', '65', '67', '71', '43']), ans = pre + R(1000, 9999)
  return choice('mid', '邮政编码是用来表示地区、方便寄信送包裹的。下面哪一个可能是邮政编码？', ans,
    [ans, pre + R(100, 999), pre + R(10000, 99999), 'A' + pre + R(100, 999)],
    `邮政编码由 6 位数字组成。\n前两位表示省（自治区、直辖市），后面几位表示更小的地区和邮局。\n所以只有 ${ans} 是 6 位数字。`)
}
function codeSport() {
  const g = R(1, 6), boy = Math.random() < 0.5, k = R(1, 30), code = `${g}${boy ? 1 : 2}${p2(k)}`, G = '一二三四五六'[g - 1]
  const rule = '运动会给运动员编号：第 1 位表示年级，第 2 位表示性别（1 是男生，2 是女生），后两位是序号。'
  if (Math.random() < 0.5) {
    const ans = `${G}年级${boy ? '男' : '女'}生${k}号`
    return choice('hard', `${rule}\n编号 ${code} 表示什么？`, ans,
      opts4(ans, [`${G}年级${boy ? '女' : '男'}生${k}号`, `${'一二三四五六'[(g % 6)]}年级${boy ? '男' : '女'}生${k}号`, `${boy ? '一' : '二'}年级${boy ? '男' : '女'}生${k}号`], () => `${G}年级${boy ? '男' : '女'}生${R(1, 30)}号`),
      `${code} 分成三段：${g} | ${boy ? 1 : 2} | ${p2(k)}\n${g} → ${G}年级，${boy ? '1 → 男生' : '2 → 女生'}，${p2(k)} → ${k} 号。`)
  }
  return input('hard', `${rule}\n${G}年级${boy ? '男' : '女'}生 ${k} 号的编号是多少？`, code,
    `年级 ${g}，性别 ${boy ? 1 : 2}，序号写成两位 ${p2(k)}，\n合起来是 ${code}。`)
}

// ============================================================
//  五、线和角
// ============================================================
function angleSvg(deg, rot) {
  const L = 115, rad = a => a * Math.PI / 180
  const pts = [[0, 0], [L * Math.cos(rad(rot)), -L * Math.sin(rad(rot))], [L * Math.cos(rad(rot + deg)), -L * Math.sin(rad(rot + deg))]]
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const cx = 150 - (Math.min(...xs) + Math.max(...xs)) / 2, cy = 85 - (Math.min(...ys) + Math.max(...ys)) / 2
  const P = ([x, y]) => `${(cx + x).toFixed(1)} ${(cy + y).toFixed(1)}`
  const u = a => [Math.cos(rad(a)), -Math.sin(rad(a))]
  let mark
  if (deg === 90) { const [a1, b1] = u(rot), [a2, b2] = u(rot + 90), k = 16; mark = `<path d="M${P([a1 * k, b1 * k])} L${P([a1 * k + a2 * k, b1 * k + b2 * k])} L${P([a2 * k, b2 * k])}" fill="none" stroke="#e8505b" stroke-width="2"/>` }
  else { const r = 24, [a1, b1] = u(rot), [a2, b2] = u(rot + deg); mark = `<path d="M${P([a1 * r, b1 * r])} A${r} ${r} 0 0 0 ${P([a2 * r, b2 * r])}" fill="none" stroke="#e8505b" stroke-width="2"/>` }
  return `<svg viewBox="0 0 300 170" class="fig wide"><g stroke="#4a5bd4" stroke-width="4" stroke-linecap="round"><line x1="${cx}" y1="${cy}" x2="${(cx + pts[1][0]).toFixed(1)}" y2="${(cy + pts[1][1]).toFixed(1)}"/><line x1="${cx}" y1="${cy}" x2="${(cx + pts[2][0]).toFixed(1)}" y2="${(cy + pts[2][1]).toFixed(1)}"/></g>${mark}<circle cx="${cx}" cy="${cy}" r="4" fill="#333"/></svg>`
}
const angleName = d => (d < 90 ? '锐角' : d === 90 ? '直角' : '钝角')
function angleKind() {
  const deg = pick([30, 40, 50, 60, 70, 90, 90, 110, 120, 130, 140, 150]), rot = pick([0, 0, 10, 20, 30, -10, 45]), ans = angleName(deg)
  return choice('mid', '这是一个什么角？', ans, ['锐角', '直角', '钝角'],
    `用三角板上的直角去比一比：\n和直角一样大的是直角；比直角小的是锐角；比直角大的是钝角。\n这个角${deg === 90 ? '和直角一样大' : deg < 90 ? '比直角小' : '比直角大'}，所以是${ans}。`, angleSvg(deg, rot), true)
}
function angleClock() {
  const h = pick([1, 2, 3, 4, 5, 7, 8, 9, 10, 11]), d = 30 * Math.min(h, 12 - h), ans = angleName(d)
  return choice('mid', `${h}时整，钟面上的时针和分针组成的是什么角？`, ans, ['锐角', '直角', '钝角'],
    `分针指着 12，时针指着 ${h}。\n3时整和9时整，两根针正好组成直角；\n${d < 90 ? `时针离 12 比 3（或 9）更近，张开得比直角小，是锐角` : d === 90 ? '所以是直角' : `时针离 12 比 3（或 9）更远，张开得比直角大，是钝角`}。`, clockSvg(h, 0), true)
}
function lineSvg(kind) {
  const dot = (x, l) => `<circle cx="${x}" cy="40" r="5" fill="#333"/><text x="${x}" y="68" text-anchor="middle" font-size="16" fill="#333">${l}</text>`
  const ln = (a, b) => `<line x1="${a}" y1="40" x2="${b}" y2="40" stroke="#4a5bd4" stroke-width="4"/>`
  if (kind === '线段') return `<svg viewBox="0 0 300 80" class="fig wide">${ln(70, 230)}${dot(70, 'A')}${dot(230, 'B')}</svg>`
  if (kind === '射线') return Math.random() < 0.5 ? `<svg viewBox="0 0 300 80" class="fig wide">${ln(60, 300)}${dot(60, 'A')}</svg>` : `<svg viewBox="0 0 300 80" class="fig wide">${ln(0, 240)}${dot(240, 'A')}</svg>`
  return `<svg viewBox="0 0 300 80" class="fig wide">${ln(0, 300)}</svg>`
}
function lineKind() {
  const k = pick(['线段', '射线', '直线'])
  return choice('mid', '下面画的是线段、射线还是直线？', k, ['线段', '射线', '直线'],
    '数一数有几个端点：\n线段：有 2 个端点，可以量出长度；\n射线：只有 1 个端点，向一边无限延长；\n直线：没有端点，向两边无限延长。\n' + `这个图有 ${k === '线段' ? 2 : k === '射线' ? 1 : 0} 个端点，所以是${k}。`, lineSvg(k), true)
}
const LINE_FACTS = [
  ['线段有两个端点', 1, '线段有两个端点，可以量出长度。'],
  ['射线有两个端点', 0, '射线只有一个端点，另一边可以无限延长。'],
  ['直线没有端点', 1, '直线向两边无限延长，没有端点。'],
  ['射线比直线短', 0, '射线和直线都可以无限延长，没法比长短。'],
  ['一条射线长5厘米', 0, '射线可以无限延长，量不出长度。只有线段能量出长度。'],
  ['线段能量出长度', 1, '线段有两个端点，能量出长度。'],
  ['角的边越长角越大', 0, '角的大小只看两条边张开得大不大，和边的长短没有关系。'],
  ['两边张得越开角越大', 1, '角的两条边张开得越大，角就越大。'],
  ['钝角比直角大', 1, '比直角大的角是钝角。'],
  ['锐角比直角小', 1, '比直角小的角是锐角。'],
  ['一个角有两个顶点', 0, '一个角只有一个顶点和两条边。'],
  ['所有直角都一样大', 1, '直角的大小都相同。'],
  ['把边延长角就变大', 0, '角的大小和边的长短无关，边延长了，角的大小不变。'],
  ['用放大镜看角会变大', 0, '放大镜只能把边放大，两条边张开的大小不变，所以角不变。'],
  ['经过一点能画无数条直线', 1, '经过一个点，可以画无数条直线。'],
  ['经过两点只能画一条直线', 1, '经过两个点，只能画一条直线。'],
  ['三角板上有一个直角', 1, '每块三角板上都有一个直角。'],
  ['长方形有4个直角', 1, '长方形和正方形的4个角都是直角。'],
]
function lineJudge() {
  const [s, ok, why] = pick(LINE_FACTS)
  return choice('mid', `判断对错：${s}。`, ok ? '对' : '错', ['对', '错'], why, null, true)
}
function linePop() {
  const yes = shuffle(LINE_FACTS.filter(f => f[1])).slice(0, R(2, 3)), no = shuffle(LINE_FACTS.filter(f => !f[1])).slice(0, 6 - yes.length)
  return popQ('mid', '戳破所有说法正确的气球', yes.map(f => ({ t: f[0], ok: true })).concat(no.map(f => ({ t: f[0], ok: false }))),
    yes.concat(no).map(f => `${f[1] ? '✔' : '✘'} ${f[0]}：${f[2]}`).join('\n'))
}
function segCount() {
  const n = R(3, 6), L = 'ABCDEF'.slice(0, n).split(''), xs = []
  let x = 30
  for (let i = 0; i < n; i++) { xs.push(x); x += R(30, 60) * 4 / n }
  const sc = 240 / (xs[n - 1] - 30)
  const X = xs.map(v => 30 + (v - 30) * sc)
  const fig = `<svg viewBox="0 0 300 80" class="fig wide"><line x1="${X[0]}" y1="35" x2="${X[n - 1]}" y2="35" stroke="#4a5bd4" stroke-width="4"/>${X.map((v, i) => `<circle cx="${v.toFixed(1)}" cy="35" r="5" fill="#333"/><text x="${v.toFixed(1)}" y="63" text-anchor="middle" font-size="16">${L[i]}</text>`).join('')}</svg>`
  const parts = Array.from({ length: n - 1 }, (_, i) => n - 1 - i), ans = n * (n - 1) / 2
  return input('hard', '图中一共有几条线段？', ans,
    `按顺序数，不重复也不漏掉：\n${L.slice(0, n - 1).map((l, i) => `以 ${l} 为左端点：${L.slice(i + 1).map(r => l + r).join('、')}，${n - 1 - i} 条`).join('\n')}\n合起来：${parts.join(' + ')} = ${ans}（条）。`, fig, '条')
}
function angleFan() {
  const n = R(3, 5), total = R(110, 150), cuts = []
  for (let i = 0; i < n; i++) cuts.push(Math.round(total * i / (n - 1) + (i > 0 && i < n - 1 ? R(-8, 8) : 0)))
  const cx = 60, cy = 140, L = 120, rad = a => a * Math.PI / 180
  const fig = `<svg viewBox="0 0 300 160" class="fig wide"><g stroke="#4a5bd4" stroke-width="4" stroke-linecap="round">${cuts.map(a => `<line x1="${cx}" y1="${cy}" x2="${(cx + L * Math.cos(rad(a))).toFixed(1)}" y2="${(cy - L * Math.sin(rad(a))).toFixed(1)}"/>`).join('')}</g><circle cx="${cx}" cy="${cy}" r="5" fill="#333"/><text x="${cx - 18}" y="${cy + 6}" font-size="16">O</text></svg>`
  const parts = Array.from({ length: n - 1 }, (_, i) => n - 1 - i), ans = n * (n - 1) / 2
  return input('hard', `从点 O 引出 ${n} 条射线（如图），图中一共有几个角？`, ans,
    `先数单个的小角，有 ${n - 1} 个；\n再数两个小角合成的角，有 ${n - 2} 个；${n > 3 ? `\n三个小角合成的有 ${n - 3} 个；` : ''}${n > 4 ? '\n四个小角合成的有 1 个；' : ''}\n合起来：${parts.join(' + ')} = ${ans}（个）。\n也可以这样想：每两条射线组成一个角。`, fig, '个')
}
function angleCut() {
  const paper = pick(['长方形', '正方形'])
  const ans = '3个、4个或5个'
  return choice('hard', `一张${paper}纸有 4 个角，用剪刀沿直线剪去一个角，剩下的部分可能有几个角？`, ans, [ans, '只能是3个', '只能是4个', '只能是5个'],
    '有三种剪法：\n① 从一个顶点剪到对面的顶点：剩下 3 个角；\n② 从一个顶点剪到一条边上：剩下 4 个角；\n③ 从一条边剪到相邻的另一条边：剩下 5 个角。\n⚠️ 易错：不要以为“4 − 1 = 3”就只有一种答案，动手剪一剪就知道了。', null, true)
}
function angleTime() {
  const want = pick(['锐角', '直角', '钝角'])
  const hs = { 锐角: [1, 2, 10, 11], 直角: [3, 9], 钝角: [4, 5, 7, 8] }
  const ans = `${pick(hs[want])}时整`
  const others = shuffle(Object.keys(hs).filter(k => k !== want).flatMap(k => hs[k])).slice(0, 3).map(h => `${h}时整`)
  return choice('hard', `下面哪个时刻，钟面上的时针和分针组成的是${want}？`, ans, [ans, ...others],
    '整时的时候分针都指着 12，只看时针在哪里：\n1时、2时、10时、11时 → 锐角；\n3时、9时 → 直角；\n4时、5时、7时、8时 → 钝角。')
}

// ============================================================
//  单元表（新版人教版三年级上册）
// ============================================================
const UNITS = [
  { label: '第一单元', name: '观察物体', icon: '🧊', color: '#6c7cf5', mid: [obsView, obsWhich, obsCount], hard: [obsNum, obsModel, obsView] },
  { label: '第二单元', name: '混合运算', icon: '🧮', color: '#ff8a5c', mid: [mixCalc, mixFirst, mixJudge, mixMatch, mixMerge], hard: [mixWord, mixPick, mixParen] },
  { label: '第三单元', name: '毫米、分米和千米', icon: '📏', color: '#3fbf9f', mid: [lenConv, lenRuler, lenCmp, u3Order, lenUnit, lenPop, lenAdd], hard: [lenRulerH, u3Rope, lenWalk, lenTrack, lenCut] },
  { label: '综合实践', name: '曹冲称象的故事', icon: '🐘', color: '#a0784a', mid: [wtConv, wtCmp, wtUnit, wtPop, wtOrder, caoIdea], hard: [caoStone, caoSwap, u3Truck, u3Bridge, u3Animal] },
  { label: '第四单元', name: '多位数乘一位数', icon: '🚀', color: '#5aa9e6', mid: [u6Vert, u6Oral, u6Pop, u6Est, u6Match], hard: [u6Zero, u6Word, u6Box, u6Price, mulFind] },
  { label: '综合实践', name: '数字编码', icon: '🔢', color: '#2ec4b6', mid: [codeIdDate, codeIdSex, codeStudent, codeStudentRead, codeRoom, codePost], hard: [codeIdFind, codeSport] },
  { label: '第五单元', name: '线和角', icon: '📐', color: '#8b6cf0', mid: [angleKind, lineKind, angleClock, lineJudge, linePop], hard: [segCount, angleFan, angleCut, angleTime] },
  { label: '第六单元', name: '分数的初步认识', icon: '🍰', color: '#ff6f6f', mid: [u8Shade, u8Read, u8Cmp, u8Order, u8Calc, u8Match], hard: [u8Calc3, u8Qty, u8Left, u8Who, u8Pizza] },
  { label: '第七单元', name: '复习与关联', icon: '🧩', color: '#e8a400', mix: true, mid: [], hard: [] },
]
// 复习与关联：把前面所有单元的题混在一起
UNITS[8].mid = uniq(UNITS.slice(0, 8).flatMap(U => U.mid))
UNITS[8].hard = uniq(UNITS.slice(0, 8).flatMap(U => U.hard))

// 每个出题函数属于哪个单元（复习单元的题也记回原来的单元）
const ALL_GENS = {}
UNITS.forEach((U, u) => { if (!U.mix) ['mid', 'hard'].forEach(kind => U[kind].forEach(f => { if (!ALL_GENS[f.name]) ALL_GENS[f.name] = { f, u, kind } })) })

const qKey = q => q.type + '|' + q.q + '|' + (q.fig || '') + (q.items ? JSON.stringify(q.items) : '') + (q.pairs ? JSON.stringify(q.pairs) : '') + '|' + q.answer
function qHash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }
function wpick(arr, ws) {
  let t = ws.reduce((a, b) => a + b, 0) * Math.random()
  for (let i = 0; i < arr.length; i++) { t -= ws[i]; if (t <= 0) return arr[i] }
  return arr[arr.length - 1]
}
function finishQ(q, f, u) {
  q.gen = f.name
  q.unit = ALL_GENS[f.name] ? ALL_GENS[f.name].u : u
  q.hid = qHash(qKey(q))
  if (q.type === 'choice' && !q.keep) q.options = shuffle(q.options)
  return q
}
let RECENT_GEN = [] // 最近几关用过的出题函数，尽量换着出
// 出一组题：nMid 道中等 + nHard 道难题（难题排在后面）
// opt.lv：第几关（0~2 每关侧重不同的题型）；opt.avoid：最近做过的题（哈希），尽量不再出
function makeSet(units, nMid, nHard, opt) {
  opt = opt || {}
  const out = [], seen = new Set(), used = {}, avoid = opt.avoid || new Set(), lv = opt.lv
  const take = (kind, n) => {
    let order = []
    while (order.length < n) order = order.concat(shuffle(units))
    for (let i = 0; i < n; i++) {
      const u = order[i], pool = UNITS[u][kind]
      let q = null
      for (let g = 0; g < 80 && !q; g++) {
        const ws = pool.map((f, j) => {
          let w = 1 / (1 + 4 * (used[f.name] || 0))
          if (RECENT_GEN.includes(f.name)) w *= 0.6
          if (lv != null && lv < 3 && pool.length >= 3 && j % 3 === lv) w *= 2.2
          return w
        })
        const f = wpick(pool, ws), c = f()
        if (!c) continue
        const k = qKey(c)
        if (seen.has(k)) continue
        if (g < 50 && avoid.has(qHash(k))) continue
        q = finishQ(c, f, u)
      }
      if (!q) continue
      seen.add(qKey(q)); used[q.gen] = (used[q.gen] || 0) + 1
      out.push(q)
    }
  }
  take('mid', nMid); take('hard', nHard)
  RECENT_GEN = RECENT_GEN.concat(out.map(q => q.gen)).slice(-24)
  return out
}
const makeLevel = (unit, lv, avoid) => (lv === 3 ? makeSet([unit], 8, 4, { lv, avoid }) : makeSet([unit], 7, 3, { lv, avoid }))
// 专项训练：和某道错题同一类型的 n 道新题
function similar(w, n) {
  const g = ALL_GENS[w.gen]
  const out = [], seen = new Set([qKey(w)])
  for (let t = 0; t < 120 && out.length < n; t++) {
    const f = g ? g.f : pick(UNITS[w.unit] ? UNITS[w.unit][w.diff === 'hard' ? 'hard' : 'mid'] : UNITS[8].mid)
    const c = f()
    if (!c || seen.has(qKey(c))) continue
    seen.add(qKey(c)); out.push(finishQ(c, f, w.unit))
  }
  return out
}

window.MATH = { UNITS, makeSet, makeLevel, similar, shuffle, clockSvg, shapeParts, qKey, qHash, ALL_GENS }
