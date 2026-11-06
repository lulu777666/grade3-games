// ============================================================
//  数学闯关岛 · 游戏主程序
// ============================================================
// UNITS、makeLevel、shuffle 来自 questions.js
const $app = document.getElementById('app')
const $fx = document.getElementById('fx')
const KEY = 'math3a_v1'

// ---------------- 存档 ----------------
function defaults() {
  return {
    coins: 0, xp: 0, stars: {}, wrong: [], badges: [], bestCombo: 0,
    totalCorrect: 0, totalAns: 0, streak: 0, lastDay: '', fixed: 0,
    daily: { date: '', correct: 0, claimed: false }, sound: true, petName: '算算龙',
  }
}
let S
try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')) } catch (e) { S = defaults() }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { } }
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
function ensureDaily() { if (S.daily.date !== today()) S.daily = { date: today(), correct: 0, claimed: false } }
function checkIn() {
  const t = today()
  if (S.lastDay === t) return
  const y = new Date(); y.setDate(y.getDate() - 1)
  const ys = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`
  S.streak = S.lastDay === ys ? S.streak + 1 : 1
  S.lastDay = t
}
ensureDaily()

// ---------------- 声音（不用音频文件，直接合成） ----------------
let AC
function tone(freq, t0, dur, type = 'sine', vol = 0.18) {
  if (!S.sound) return
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)()
    if (AC.state === 'suspended') AC.resume()
    const o = AC.createOscillator(), g = AC.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(vol, AC.currentTime + t0)
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + t0 + dur)
    o.connect(g); g.connect(AC.destination)
    o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + dur + 0.05)
  } catch (e) { }
}
const SFX = {
  tap: () => tone(660, 0, 0.06, 'triangle', 0.08),
  good: c => { const b = 523 * Math.pow(1.06, Math.min(c, 10)); tone(b, 0, 0.12, 'triangle'); tone(b * 1.5, 0.09, 0.2, 'triangle') },
  bad: () => { tone(220, 0, 0.18, 'sawtooth', 0.08); tone(160, 0.12, 0.25, 'sawtooth', 0.08) },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle')),
  coin: () => { tone(988, 0, 0.08, 'square', 0.06); tone(1319, 0.07, 0.18, 'square', 0.06) },
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, 'triangle')),
}

// ---------------- 小工具 ----------------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const fmt = s => esc(s).replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>')
const starStr = n => [0, 1, 2].map(i => `<span class="${i < n ? '' : 'off'}">⭐</span>`).join('')
const totalStars = () => Object.values(S.stars).reduce((a, b) => a + b, 0)
const lvId = (u, l) => `${u}-${l}`
const LV_NAMES = ['第1关', '第2关', '第3关', 'Boss']
function toast(html) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html; document.body.appendChild(d); setTimeout(() => d.remove(), 2300) }
function confetti(n = 70) {
  const cs = ['#ff6b6b', '#ffd166', '#06d6a0', '#4a5bd4', '#ff9f1c', '#e86aa6']
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'confetti'
    d.style.left = Math.random() * 100 + 'vw'; d.style.background = cs[i % cs.length]
    d.style.animationDuration = 1.6 + Math.random() * 1.4 + 's'; d.style.animationDelay = Math.random() * 0.4 + 's'
    $fx.appendChild(d); setTimeout(() => d.remove(), 3500)
  }
}
function floatText(txt, x, y) {
  const d = document.createElement('div'); d.className = 'floattxt'; d.textContent = txt
  d.style.left = x + 'px'; d.style.top = y + 'px'; $fx.appendChild(d); setTimeout(() => d.remove(), 1000)
}
function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms) } catch (e) { } }

// ---------------- 宠物 ----------------
const PET = [
  { xp: 0, face: '🥚', stage: '神秘的蛋', say: ['里面好像有什么在动……', '多答对几题，我就要破壳啦！'] },
  { xp: 20, face: '🐣', stage: '刚破壳', say: ['哇，我出来了！谢谢你！', '再多答几题，我会长大哦'] },
  { xp: 80, face: '🦎', stage: '小蜥蜴', say: ['我长出小爪子啦！', '你算得真快！'] },
  { xp: 200, face: '🐲', stage: '小龙', say: ['我变成小龙啦！吼～', '一起去打Boss吧！'] },
  { xp: 500, face: '🐉', stage: '神龙', say: ['我是数学神龙！', '你是最棒的数学小高手！'] },
]
const petNow = () => { let p = PET[0]; for (const x of PET) if (S.xp >= x.xp) p = x; return p }
const petNext = () => PET.find(x => x.xp > S.xp)
function addXp(n) {
  const before = petNow()
  S.xp += n
  const after = petNow()
  return after !== before ? after : null
}

// ---------------- 成就徽章 ----------------
const BOSS_WINS = () => UNITS.filter((_, u) => (S.stars[lvId(u, 3)] || 0) > 0).length
const BADGES = [
  { id: 'first', i: '🎉', n: '出发啦', d: '第一次通过一关', ok: () => Object.values(S.stars).some(v => v > 0) },
  { id: 'c5', i: '🔥', n: '小火苗', d: '连续答对5题', ok: () => S.bestCombo >= 5 },
  { id: 'c10', i: '⚡', n: '闪电手', d: '连续答对10题', ok: () => S.bestCombo >= 10 },
  { id: 'c20', i: '🌟', n: '停不下来', d: '连续答对20题', ok: () => S.bestCombo >= 20 },
  { id: 's5', i: '⭐', n: '摘星星', d: '5关拿到3颗星', ok: () => Object.values(S.stars).filter(v => v === 3).length >= 5 },
  { id: 's20', i: '🏅', n: '满星达人', d: '20关拿到3颗星', ok: () => Object.values(S.stars).filter(v => v === 3).length >= 20 },
  { id: 'b1', i: '👑', n: 'Boss克星', d: '打败第1个Boss', ok: () => BOSS_WINS() >= 1 },
  { id: 'b5', i: '🛡️', n: '勇者', d: '打败5个Boss', ok: () => BOSS_WINS() >= 5 },
  { id: 'b9', i: '🏆', n: '岛主', d: '打败全部9个Boss', ok: () => BOSS_WINS() >= 9 },
  { id: 'q100', i: '💯', n: '百题勇士', d: '累计答对100题', ok: () => S.totalCorrect >= 100 },
  { id: 'q500', i: '🎓', n: '数学博士', d: '累计答对500题', ok: () => S.totalCorrect >= 500 },
  { id: 'd3', i: '📅', n: '天天向上', d: '连续3天来闯关', ok: () => S.streak >= 3 },
  { id: 'd7', i: '🗓️', n: '一周不断', d: '连续7天来闯关', ok: () => S.streak >= 7 },
  { id: 'fix10', i: '🩹', n: '知错就改', d: '改正10道错题', ok: () => S.fixed >= 10 },
  { id: 'pet', i: '🐲', n: '驯龙高手', d: '宠物长成小龙', ok: () => S.xp >= 200 },
]
function checkBadges() {
  const got = []
  for (const b of BADGES) if (!S.badges.includes(b.id) && b.ok()) { S.badges.push(b.id); got.push(b) }
  return got
}

// ---------------- 页面切换 ----------------
let tab = 'map'
function go(t) { tab = t; render(); window.scrollTo(0, 0) }
function render() {
  ensureDaily()
  if (tab === 'map') renderMap()
  else if (tab === 'wrong') renderWrong()
  else if (tab === 'badges') renderBadges()
}
function topbar(title) {
  return `<div class="topbar"><div class="title">${title}</div>
    <span class="chip" id="coinChip">💰 ${S.coins}</span>
    <span class="chip">⭐ ${totalStars()}</span>
    <span class="chip" title="连续天数">🔥 ${S.streak}</span></div>`
}
function nav() {
  const n = S.wrong.length
  return `<div class="nav">
    <button class="${tab === 'map' ? 'on' : ''}" onclick="go('map')"><b>🗺️</b>闯关</button>
    <button class="${tab === 'wrong' ? 'on' : ''}" onclick="go('wrong')"><b>📕</b>错题本${n ? `<span class="badge">${n}</span>` : ''}</button>
    <button class="${tab === 'badges' ? 'on' : ''}" onclick="go('badges')"><b>🏅</b>成就</button></div>`
}

// ---------------- 地图 ----------------
function unlocked(u, l) { return l === 0 || (S.stars[lvId(u, l - 1)] || 0) > 0 }
function renderMap() {
  const p = petNow(), nx = petNext()
  const pct = nx ? Math.round((S.xp - p.xp) / (nx.xp - p.xp) * 100) : 100
  const d = S.daily, goal = 20
  let h = topbar('🏝️ 数学闯关岛')
  h += `<div class="cheer" onclick="SFX.good(3)">💪 <span>薇薇加油！</span> 💪</div>`
  h += `<div class="card pet">
      <div class="face" id="petFace" onclick="petTap()">${p.face}</div>
      <div class="info"><div class="name">${esc(S.petName)} <span class="small">· ${p.stage}</span></div>
        <div class="say" id="petSay">${pickSay(p)}</div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="small">${nx ? `成长值 ${S.xp}/${nx.xp}，答对1题+1` : '已经是最强形态啦！'}</div></div>
      <button class="btn gold sm" onclick="feed()">喂食<br>30💰</button></div>`
  h += `<div class="card daily"><div class="ic">${d.claimed ? '✅' : '🎁'}</div>
      <div class="info"><b>今日任务：答对 ${goal} 题</b>
        <div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, d.correct / goal * 100)}%;background:linear-gradient(90deg,#5ce1a0,#2bb673)"></i></div>
        <div class="small">${Math.min(d.correct, goal)}/${goal}　完成可领 50 金币</div></div>
      ${d.claimed ? '<span class="small">已领取</span>' : `<button class="btn green sm" ${d.correct >= goal ? '' : 'disabled'} onclick="claimDaily()">领取</button>`}</div>`
  let firstNext = null
  UNITS.forEach((U, u) => {
    const got = [0, 1, 2, 3].reduce((a, l) => a + (S.stars[lvId(u, l)] || 0), 0)
    h += `<div class="unit"><div class="head" style="background:${U.color}"><span>${U.icon}</span><span><span class="no">第${u + 1}单元</span><br>${U.name}</span><span class="prog">⭐ ${got}/12</span></div><div class="nodes">`
    for (let l = 0; l < 4; l++) {
      const st = S.stars[lvId(u, l)] || 0, open = unlocked(u, l), boss = l === 3
      const isNext = open && st === 0 && !firstNext
      if (isNext) firstNext = lvId(u, l)
      h += `<div class="node ${boss ? 'boss' : ''} ${open ? '' : 'lock'} ${isNext ? 'next' : ''}" ${isNext ? 'id="nextNode"' : ''}>
        <button class="dot" style="background:${U.color}" onclick="tapNode(${u},${l})">${open ? (boss ? '👹' : l + 1) : '🔒'}</button>
        <div class="lbl">${LV_NAMES[l]}</div><div class="stars">${open ? starStr(st) : ''}</div></div>`
    }
    h += '</div></div>'
  })
  h += `<div class="small" style="text-align:center;margin:18px 0">人教版三年级上册 · 每个单元的第1关都能直接玩<br>
    <a href="javascript:toggleSound()" style="color:var(--pri)">${S.sound ? '🔊 声音：开' : '🔇 声音：关'}</a></div>`
  $app.innerHTML = h + nav()
}
function pickSay(p) { return p.say[Math.floor(Math.random() * p.say.length)] }
function petTap() {
  const f = document.getElementById('petFace'); f.classList.remove('jump'); void f.offsetWidth; f.classList.add('jump')
  document.getElementById('petSay').textContent = pickSay(petNow()); SFX.tap()
}
function feed() {
  if (S.coins < 30) { toast('金币不够啦 💰<br>去闯关赚金币吧！'); return }
  S.coins -= 30; SFX.coin()
  const evo = addXp(5)
  save(); renderMap(); petTap()
  document.getElementById('petSay').textContent = '好好吃！成长值+5 😋'
  if (evo) showEvolve(evo)
  const nb = checkBadges(); if (nb.length) { save(); nb.forEach(b => toast(`获得徽章 ${b.i} ${b.n}`)) }
}
function claimDaily() {
  if (S.daily.claimed || S.daily.correct < 20) return
  S.daily.claimed = true; S.coins += 50; save(); SFX.win(); confetti(40)
  toast('🎁 今日任务完成！<br>+50 金币'); renderMap()
}
function toggleSound() { S.sound = !S.sound; save(); renderMap() }
function tapNode(u, l) {
  if (!unlocked(u, l)) { SFX.bad(); toast('🔒 先通过前一关才能解锁哦'); return }
  SFX.tap()
  if (l === 3) {
    modal(`<div class="i">👹</div><h3>${UNITS[u].name} · Boss战</h3><p>一共12题，只有3颗❤️<br>答错1题少1颗心，心没了就失败。<br>赢了金币翻倍！</p>
      <div class="row"><button class="btn ghost" onclick="closeModal()">再想想</button><button class="btn" onclick="closeModal();startLevel(${u},3)">开战！</button></div>`)
  } else startLevel(u, l)
}
function modal(html) {
  closeModal()
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal'
  bg.innerHTML = `<div class="modal">${html}</div>`; document.body.appendChild(bg)
}
function closeModal() { const m = document.getElementById('modal'); if (m) m.remove() }
function showEvolve(p) {
  SFX.win(); confetti(80)
  modal(`<div class="i" style="font-size:80px">${p.face}</div><h3>${esc(S.petName)}进化了！</h3><p>变成了「${p.stage}」<br>${p.say[0]}</p><button class="btn" onclick="closeModal()">太好了！</button>`)
}

// ---------------- 答题 ----------------
let G = null // 当前这一局
function startLevel(u, l) {
  const boss = l === 3
  G = { mode: 'level', u, l, boss, qs: makeLevel(u, l, boss ? 12 : 10), i: 0, right: 0, combo: 0, maxCombo: 0, coins: 0, hearts: boss ? 3 : 0, locked: false, typed: '' }
  renderQ()
}
function startWrong() {
  if (!S.wrong.length) return
  G = { mode: 'wrong', qs: shuffle(S.wrong).slice(0, 10).map(q => ({ ...q, options: q.options && !q.keep ? shuffle(q.options) : q.options })), i: 0, right: 0, combo: 0, maxCombo: 0, coins: 0, hearts: 0, locked: false, typed: '' }
  renderQ()
}
function quitQuiz() {
  modal(`<div class="i">🤔</div><h3>要退出吗？</h3><p>这一关的进度不会保存哦</p>
    <div class="row"><button class="btn ghost" onclick="closeModal();G=null;go(tab)">退出</button><button class="btn" onclick="closeModal()">继续答题</button></div>`)
}
function renderQ() {
  const q = G.qs[G.i]
  G.locked = false; G.typed = ''
  const pct = G.i / G.qs.length * 100
  const title = G.mode === 'wrong' ? '📕 错题复习' : `${UNITS[G.u].icon} ${LV_NAMES[G.l]}`
  let h = `<div class="quiz-top"><button class="x" onclick="quitQuiz()">✕</button><div class="bar"><i style="width:${pct}%"></i></div>
    ${G.boss ? `<span class="hearts" id="hearts">${[0, 1, 2].map(i => `<span class="${i < G.hearts ? '' : 'off'}">❤️</span>`).join('')}</span>` : ''}</div>
    <div class="qmeta"><span>${title} · ${G.i + 1}/${G.qs.length}</span><span class="combo" id="combo">${G.combo >= 2 ? `🔥${G.combo}连对` : ''}</span><span>💰 +${G.coins}</span></div>
    <div class="qcard" id="qcard"><div class="qtext ${q.q.length > 26 ? 'long' : ''}">${fmt(q.q)}</div>${q.fig || ''}`
  if (q.type === 'choice') {
    h += `<div class="opts ${q.options.length === 3 ? 'three' : ''}">` +
      q.options.map((o, k) => `<button class="opt" data-k="${k}" onclick="pickOpt(${k})">${fmt(o)}</button>`).join('') + '</div></div>'
  } else {
    h += `<div class="answer-box" id="abox">?</div></div><div class="pad">` +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="key('${n}')">${n}</button>`).join('') +
      `<button class="del" onclick="key('del')">⌫</button><button onclick="key('0')">0</button><button class="ok" onclick="key('ok')">✓</button></div>`
  }
  h += `<div class="feedback" id="fb"></div>`
  $app.innerHTML = h
  window.scrollTo(0, 0)
}
function key(k) {
  if (G.locked) return
  SFX.tap()
  if (k === 'del') G.typed = G.typed.slice(0, -1)
  else if (k === 'ok') { if (G.typed) answer(G.typed, document.getElementById('abox')); return }
  else if (G.typed.length < 6) G.typed = (G.typed === '0' ? '' : G.typed) + k
  document.getElementById('abox').textContent = G.typed || '?'
}
function pickOpt(k) {
  if (G.locked) return
  const q = G.qs[G.i]
  answer(q.options[k], document.querySelector(`.opt[data-k="${k}"]`))
}
function answer(val, el) {
  G.locked = true
  const q = G.qs[G.i], ok = String(val) === q.answer
  ensureDaily(); checkIn()
  S.totalAns++
  const rect = el.getBoundingClientRect()
  if (q.type === 'choice') {
    document.querySelectorAll('.opt').forEach(b => {
      const o = q.options[+b.dataset.k]
      if (o === q.answer) b.classList.add('right')
      else if (b === el) b.classList.add('wrong')
      else b.classList.add('dim')
    })
  } else el.classList.add(ok ? 'right' : 'wrong')
  const fb = document.getElementById('fb')
  if (ok) {
    G.right++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo)
    S.totalCorrect++; S.daily.correct++
    S.bestCombo = Math.max(S.bestCombo, G.combo)
    let gain = 10 + Math.min(G.combo - 1, 5) * 2
    if (G.boss) gain *= 2
    if (G.mode === 'wrong') { gain = 5; removeWrong(q); S.fixed++ }
    G.coins += gain
    const evo = addXp(1)
    if (evo) G.evo = evo
    SFX.good(G.combo); vibrate(15)
    floatText(`+${gain}💰`, rect.left + rect.width / 2, rect.top)
    const praise = G.combo >= 5 ? ['太厉害了！', '停不下来！', '数学小天才！'] : G.combo >= 3 ? ['真棒！', '越来越快了！', '漂亮！'] : ['答对了！', '正确！', '好样的！']
    fb.className = 'feedback good show'
    fb.innerHTML = `<div class="t">✅ ${praise[Math.floor(Math.random() * praise.length)]} ${G.combo >= 2 ? `<span class="combo pop">🔥${G.combo}连对</span>` : ''}</div>`
    const c = document.getElementById('combo'); if (c) { c.textContent = G.combo >= 2 ? `🔥${G.combo}连对` : ''; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop') }
    setTimeout(next, G.combo >= 3 ? 750 : 950)
  } else {
    G.combo = 0
    if (G.mode === 'level') addWrong(q)
    SFX.bad(); vibrate([40, 40, 40])
    const card = document.getElementById('qcard'); card.classList.add('shake')
    if (G.boss) {
      G.hearts--
      const hs = document.getElementById('hearts')
      hs.innerHTML = [0, 1, 2].map(i => `<span class="${i < G.hearts ? '' : 'off'}">❤️</span>`).join(''); hs.classList.add('hit')
    }
    fb.className = 'feedback bad show'
    fb.innerHTML = `<div class="t">❌ 正确答案是：${fmt(q.answer)}</div><div class="tip">💡 ${fmt(q.tip || '再仔细想一想～')}</div>
      <button class="btn red" onclick="next()">${G.boss && G.hearts <= 0 ? '看结果' : '知道了，下一题 →'}</button>`
  }
  save()
}
function next() {
  if (!G) return
  if (G.boss && G.hearts <= 0) return finish()
  G.i++
  if (G.i >= G.qs.length) finish()
  else renderQ()
}
const qKey = q => q.q + '|' + (q.fig || '')
function addWrong(q) {
  if (S.wrong.some(w => qKey(w) === qKey(q))) return
  const { type, q: text, answer, options, tip, fig, keep, unit } = q
  S.wrong.push({ type, q: text, answer, options, tip, fig, keep, unit })
  if (S.wrong.length > 80) S.wrong.shift()
}
function removeWrong(q) { S.wrong = S.wrong.filter(w => qKey(w) !== qKey(q)) }

// ---------------- 结算 ----------------
function finish() {
  const n = G.qs.length, rate = G.right / n
  let stars = 0, newStars = 0, bonus = 0, title, sub
  if (G.mode === 'level') {
    if (G.boss) stars = G.hearts <= 0 ? 0 : G.hearts
    else stars = rate >= 0.9 ? 3 : rate >= 0.7 ? 2 : rate >= 0.6 ? 1 : 0
    const id = lvId(G.u, G.l), old = S.stars[id] || 0
    if (stars > old) { newStars = stars - old; S.stars[id] = stars; bonus = newStars * 20 }
  }
  S.coins += G.coins + bonus
  const badges = checkBadges()
  save()
  const pass = G.mode === 'wrong' || stars > 0
  if (G.mode === 'wrong') { title = '复习完成！'; sub = `改正了 ${G.right} 道错题` }
  else if (!pass) { title = G.boss ? 'Boss 太强了…' : '差一点点！'; sub = G.boss ? '心用完了，再挑战一次吧！' : `答对 ${G.right}/${n} 题，答对6题就能过关` }
  else { title = stars === 3 ? '完美通关！' : stars === 2 ? '闯关成功！' : '过关啦！'; sub = `答对 ${G.right}/${n} 题` }
  const perfect = G.mode === 'level' && G.right === n
  if (perfect) { title = '薇薇真棒！'; sub = `满分！${n} 题全部答对 🎉` }
  pass ? (SFX.win(), confetti(stars === 3 ? 110 : 60)) : SFX.lose()
  if (perfect) setTimeout(() => fireworks('薇薇真棒！', `满分！${n}题全对`), 400)
  let h = `<div class="result"><div style="font-size:64px">${pass ? (G.boss ? '👑' : '🎉') : '💪'}</div>
    <div class="big">${title}</div><div style="color:var(--sub)">${sub}</div>`
  if (G.mode === 'level') h += `<div class="bigstars">${[0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">⭐</span>`).join('')}</div>`
  h += `<div class="stats"><span class="chip">💰 +${G.coins + bonus}</span><span class="chip">🔥 最高${G.maxCombo}连对</span>${bonus ? `<span class="chip">新星星奖励 +${bonus}</span>` : ''}</div>`
  badges.forEach(b => { h += `<div class="newbadge">🎖️ 获得新徽章：${b.i} ${b.n}（${b.d}）</div>` })
  h += '<div class="acts">'
  if (G.mode === 'level') {
    const nextL = G.l < 3 ? [G.u, G.l + 1] : G.u < UNITS.length - 1 ? [G.u + 1, 0] : null
    if (pass && nextL && unlocked(...nextL)) h += `<button class="btn green" onclick="startLevel(${nextL[0]},${nextL[1]})">下一关 →</button>`
    h += `<button class="btn ${pass ? 'ghost' : ''}" onclick="startLevel(${G.u},${G.l})">${pass && stars < 3 ? '再玩一次，冲3星！' : '再玩一次'}</button>`
  } else if (S.wrong.length) h += `<button class="btn" onclick="startWrong()">继续复习（还有${S.wrong.length}题）</button>`
  h += `<button class="btn ghost" onclick="G=null;go('map')">回到地图</button></div></div>`
  $app.innerHTML = h
  window.scrollTo(0, 0)
  document.querySelectorAll('.bigstars span').forEach((s, i) => setTimeout(() => { s.classList.add('in'); if (i < stars) tone(784 + i * 200, 0, 0.15, 'triangle') }, 300 + i * 350))
  const evo = G.evo
  if (evo) setTimeout(() => showEvolve(evo), perfect ? 5600 : 1600)
}

// ---------------- 满分烟花 ----------------
function fireworks(text, sub, ms = 5000) {
  const wrap = document.createElement('div'); wrap.className = 'fw'
  wrap.innerHTML = `<canvas></canvas><div class="fw-text">${esc(text)}<small>${esc(sub || '')}</small></div><div class="fw-tip">点一下继续</div>`
  document.body.appendChild(wrap)
  const cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d')
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight
  cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr)
  const cols = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585', '#ff9f1c', '#b388ff', '#ffffff']
  const rockets = [], parts = []
  const t0 = performance.now(); let lastLaunch = 0, closed = false
  const launch = () => rockets.push({ x: W * (0.12 + Math.random() * 0.76), y: H, vy: -(H * 0.016 + Math.random() * H * 0.006), ty: H * (0.12 + Math.random() * 0.35), c: cols[Math.floor(Math.random() * cols.length)] })
  function burst(x, y, c) {
    const n = 70, ring = Math.random() < 0.4
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n, sp = ring ? 3.6 : 1 + Math.random() * 4
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: Math.random() < 0.25 ? '#fff' : c })
    }
    tone(90 + Math.random() * 60, 0, 0.35, 'triangle', 0.12); tone(1800 + Math.random() * 600, 0.05, 0.25, 'square', 0.015)
  }
  function close() {
    if (closed) return; closed = true
    wrap.style.opacity = '0'; setTimeout(() => wrap.remove(), 600)
  }
  wrap.onclick = close
  function frame(now) {
    if (closed) return
    const el = now - t0
    if (el < ms - 1200 && now - lastLaunch > 320) { launch(); if (Math.random() < 0.35) launch(); lastLaunch = now }
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(12,14,48,0.25)'; ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i]; r.y += r.vy; r.vy *= 0.99
      ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(r.x, r.y, 2.5, 0, 7); ctx.fill()
      if (r.y <= r.ty) { burst(r.x, r.y, r.c); rockets.splice(i, 1) }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.05; p.life -= 0.011
      if (p.life <= 0) { parts.splice(i, 1); continue }
      ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.3, 0, 7); ctx.fill()
    }
    ctx.globalAlpha = 1
    if (el > ms) close(); else requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

// ---------------- 错题本 ----------------
function renderWrong() {
  let h = topbar('📕 错题本')
  if (!S.wrong.length) {
    h += `<div class="card empty"><div class="i">🌈</div>错题本是空的，太棒了！<br>闯关时答错的题会自动收到这里。</div>`
  } else {
    h += `<div class="card" style="text-align:center"><div style="font-size:15px;margin-bottom:10px">有 <b style="color:var(--bad);font-size:22px">${S.wrong.length}</b> 道题等你来消灭<br><span class="small">在复习里答对，就会从错题本里移走</span></div>
      <button class="btn" style="width:100%;padding:13px;font-size:18px" onclick="startWrong()">开始复习（每次最多10题）</button></div>
      <div class="card wlist">` + S.wrong.slice().reverse().map(w => `<div class="w"><span class="u">${UNITS[w.unit] ? UNITS[w.unit].icon : ''}</span><span>${fmt(w.q)}</span></div>`).join('') + '</div>'
  }
  $app.innerHTML = h + nav()
}

// ---------------- 成就 ----------------
function renderBadges() {
  const acc = S.totalAns ? Math.round(S.totalCorrect / S.totalAns * 100) : 0
  let h = topbar('🏅 我的成就')
  h += `<div class="card statrow"><div><b>${S.totalCorrect}</b><span>答对题数</span></div><div><b>${acc}%</b><span>正确率</span></div><div><b>${S.bestCombo}</b><span>最高连对</span></div>
    <div><b>${totalStars()}</b><span>星星 / 108</span></div><div><b>${BOSS_WINS()}</b><span>打败Boss / 9</span></div><div><b>${S.streak}</b><span>连续天数</span></div></div>`
  h += `<div class="h2">徽章 ${S.badges.length}/${BADGES.length}</div><div class="grid">` +
    BADGES.map(b => `<div class="bd ${S.badges.includes(b.id) ? '' : 'lock'}"><div class="i">${b.i}</div><div class="n">${b.n}</div><div class="d">${b.d}</div></div>`).join('') + '</div>'
  $app.innerHTML = h + nav()
}

render()
const nn = document.getElementById('nextNode')
if (nn && totalStars() > 0) setTimeout(() => nn.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
