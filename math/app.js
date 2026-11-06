// ============================================================
//  数学闯关岛 · 游戏主程序
//  UNITS、makeSet、makeLevel、shuffle、clockSvg、shapeParts、qKey 来自 questions.js
// ============================================================
const $app = document.getElementById('app')
const $fx = document.getElementById('fx')
const KEY = 'math3a_v1'
const DAILY_GOAL = 30
const TEST_MIN = 30, TEST_MID = 14, TEST_HARD = 5, PT_MID = 5, PT_HARD = 6 // 14×5 + 5×6 = 100

// ---------------- 存档 ----------------
function defaults() {
  return {
    coins: 0, xp: 0, stars: {}, wrong: [], badges: [], bestCombo: 0, totalCorrect: 0, totalAns: 0, hardCorrect: 0,
    streak: 0, lastDay: '', fixed: 0, daily: { date: '', correct: 0, claimed: false },
    sound: true, music: true, unlockAll: false, petName: '算算龙', tests: [], testUnits: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  }
}
let S
try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')) } catch (e) { S = defaults() }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { } }
const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const today = () => dayKey(new Date())
const dateCN = (d = new Date()) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${'日一二三四五六'[d.getDay()]}`
function ensureDaily() { if (S.daily.date !== today()) S.daily = { date: today(), correct: 0, claimed: false } }
function checkIn() {
  if (S.lastDay === today()) return
  const y = new Date(); y.setDate(y.getDate() - 1)
  S.streak = S.lastDay === dayKey(y) ? S.streak + 1 : 1
  S.lastDay = today()
}
ensureDaily()

// ============================================================
//  声音：音效 + 背景音乐（全部用程序合成，不用音频文件）
// ============================================================
let AC = null
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)() } catch (e) { return null } }
  if (AC.state === 'suspended') AC.resume()
  return AC
}
function tone(freq, t0, dur, type = 'sine', vol = 0.18) {
  if (!S.sound || !audio()) return
  const o = AC.createOscillator(), g = AC.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(vol, AC.currentTime + t0)
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + t0 + dur)
  o.connect(g); g.connect(AC.destination)
  o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + dur + 0.05)
}
const SFX = {
  tap: () => tone(660, 0, 0.06, 'triangle', 0.08),
  good: c => { const b = 523 * Math.pow(1.06, Math.min(c, 10)); tone(b, 0, 0.12, 'triangle'); tone(b * 1.5, 0.09, 0.2, 'triangle') },
  bad: () => { tone(220, 0, 0.18, 'sawtooth', 0.08); tone(160, 0.12, 0.25, 'sawtooth', 0.08) },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle')),
  coin: () => { tone(988, 0, 0.08, 'square', 0.06); tone(1319, 0.07, 0.18, 'square', 0.06) },
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, 'triangle')),
  pop: () => { tone(900, 0, 0.05, 'square', 0.07); tone(500, 0.03, 0.12, 'triangle', 0.1) },
  tick: () => tone(1200, 0, 0.03, 'sine', 0.05),
}

// ---- 背景音乐：三种风格 ----
const mf = n => 440 * Math.pow(2, (n - 69) / 12)
const SONGS = {
  // 闯关：轻松舒缓（C 大调五声音阶，慢慢的琶音）
  calm: {
    bpm: 84, vol: 0.55, step(s, t, dt) {
      const ch = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]][Math.floor(s / 16) % 4], p = s % 16
      if (p === 0) ch.forEach(n => mnote(mf(n), t, dt * 16, 'sine', 0.035, 0.8))
      if (p % 8 === 0) mnote(mf(ch[0] - 12), t, dt * 4, 'triangle', 0.07, 0.02)
      const arp = [0, 1, 2, 1, 2, 1, 0, 2][p % 8]
      if (Math.random() < 0.6) mnote(mf(ch[arp] + 12), t, dt * 1.6, 'triangle', 0.03, 0.01)
      if (p % 4 === 2 && Math.random() < 0.22) mnote(mf([72, 74, 76, 79, 81][Math.floor(Math.random() * 5)] + 12), t, dt * 4, 'sine', 0.02, 0.01)
    },
  },
  // Boss：紧张（a 小调，快节奏低音 + 心跳鼓点）
  tense: {
    bpm: 126, vol: 0.5, step(s, t, dt) {
      const ch = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]][Math.floor(s / 8) % 4], p = s % 8
      mnote(mf(ch[0] - 24), t, dt * 0.8, 'sawtooth', p % 2 === 0 ? 0.035 : 0.02, 0.005)
      if (p === 0 || p === 3 || p === 6) ch.forEach(n => mnote(mf(n), t, dt * 0.6, 'triangle', 0.018, 0.005))
      if (p === 0 || p === 4) kick(t)
      mnote(5200, t, 0.03, 'sine', 0.005, 0.001)
    },
  },
  // 小测验：专注（很慢的柔和和弦 + 偶尔一声风铃）
  focus: {
    bpm: 60, vol: 0.6, step(s, t, dt) {
      const ch = [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 64]][Math.floor(s / 16) % 4], p = s % 16
      if (p === 0) ch.forEach(n => mnote(mf(n), t, dt * 17, 'sine', 0.028, 1.6))
      if (p % 2 === 0 && Math.random() < 0.16) mnote(mf([76, 79, 81, 84, 88][Math.floor(Math.random() * 5)]), t, dt * 5, 'sine', 0.018, 0.01)
    },
  },
}
const Music = {
  name: 'calm', timer: null, step: 0, nextT: 0, bus: null,
  bus_() {
    if (this.bus) return this.bus
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600
    this.bus = AC.createGain(); this.bus.gain.value = 0; this.bus.connect(lp); lp.connect(AC.destination)
    return this.bus
  },
  play(name) {
    if (name) this.name = name
    if (!S.music || !AC || AC.state !== 'running') return
    if (this.timer && this.cur === this.name) return
    this.cur = this.name
    const b = this.bus_()
    b.gain.cancelScheduledValues(AC.currentTime)
    b.gain.setTargetAtTime(SONGS[this.name].vol, AC.currentTime, 0.6)
    this.step = 0; this.nextT = AC.currentTime + 0.15
    clearInterval(this.timer)
    this.timer = setInterval(() => this.tick(), 60)
  },
  stop() {
    clearInterval(this.timer); this.timer = null; this.cur = null
    if (this.bus) this.bus.gain.setTargetAtTime(0, AC.currentTime, 0.2)
  },
  tick() {
    const sg = SONGS[this.cur], dt = 60 / sg.bpm / 2
    while (this.nextT < AC.currentTime + 0.3) { sg.step(this.step, this.nextT, dt); this.step++; this.nextT += dt }
  },
}
function mnote(freq, t, dur, type, vol, atk) {
  const o = AC.createOscillator(), g = AC.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, atk + 0.05))
  o.connect(g); g.connect(Music.bus_())
  o.start(t); o.stop(t + dur + 0.1)
}
function kick(t) {
  const o = AC.createOscillator(), g = AC.createGain()
  o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15)
  g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  o.connect(g); g.connect(Music.bus_()); o.start(t); o.stop(t + 0.2)
}
// 手机浏览器要求“先点一下屏幕”才能放声音
document.addEventListener('pointerdown', () => { if (audio()) Music.play() }, true)
document.addEventListener('visibilitychange', () => {
  if (!AC) return
  if (document.hidden) AC.suspend(); else AC.resume().then(() => Music.play())
})
function toggleMusic() { S.music = !S.music; save(); if (S.music) { audio(); Music.play() } else Music.stop(); render() }
function toggleSound() { S.sound = !S.sound; save(); render() }

// ---------------- 小工具 ----------------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const fmt = s => esc(s).replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>').replace(/\n/g, '<br>')
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
function setTheme(t) { document.body.dataset.theme = t || '' }

// ---------------- 宠物 ----------------
const PET = [
  { xp: 0, face: '🥚', stage: '神秘的蛋', say: ['里面好像有什么在动……', '多答对几题，我就要破壳啦！'] },
  { xp: 20, face: '🐣', stage: '刚破壳', say: ['哇，我出来了！谢谢薇薇！', '再多答几题，我会长大哦'] },
  { xp: 80, face: '🦎', stage: '小蜥蜴', say: ['我长出小爪子啦！', '薇薇算得真快！'] },
  { xp: 200, face: '🐲', stage: '小龙', say: ['我变成小龙啦！吼～', '一起去打Boss吧！'] },
  { xp: 500, face: '🐉', stage: '神龙', say: ['我是数学神龙！', '薇薇是最棒的数学小高手！'] },
]
const petNow = () => { let p = PET[0]; for (const x of PET) if (S.xp >= x.xp) p = x; return p }
const petNext = () => PET.find(x => x.xp > S.xp)
function addXp(n) { const b = petNow(); S.xp += n; const a = petNow(); return a !== b ? a : null }

// ---------------- 成就徽章 ----------------
const BOSS_WINS = () => UNITS.filter((_, u) => (S.stars[lvId(u, 3)] || 0) > 0).length
const bestTest = () => S.tests.reduce((m, t) => Math.max(m, t.score), -1)
const BADGES = [
  { id: 'first', i: '🎉', n: '出发啦', d: '第一次通过一关', ok: () => Object.values(S.stars).some(v => v > 0) },
  { id: 'c5', i: '🔥', n: '小火苗', d: '连续答对5题', ok: () => S.bestCombo >= 5 },
  { id: 'c10', i: '⚡', n: '闪电手', d: '连续答对10题', ok: () => S.bestCombo >= 10 },
  { id: 'c20', i: '🌟', n: '停不下来', d: '连续答对20题', ok: () => S.bestCombo >= 20 },
  { id: 'h20', i: '💪', n: '难题克星', d: '答对20道难题', ok: () => S.hardCorrect >= 20 },
  { id: 's5', i: '⭐', n: '摘星星', d: '5关拿到3颗星', ok: () => Object.values(S.stars).filter(v => v === 3).length >= 5 },
  { id: 's20', i: '🏅', n: '满星达人', d: '20关拿到3颗星', ok: () => Object.values(S.stars).filter(v => v === 3).length >= 20 },
  { id: 'b1', i: '👑', n: 'Boss克星', d: '打败第1个Boss', ok: () => BOSS_WINS() >= 1 },
  { id: 'b5', i: '🛡️', n: '勇者', d: '打败5个Boss', ok: () => BOSS_WINS() >= 5 },
  { id: 'b9', i: '🏆', n: '岛主', d: '打败全部9个Boss', ok: () => BOSS_WINS() >= 9 },
  { id: 't90', i: '🧠', n: '聪明的薇薇', d: '小测验得90分以上', ok: () => bestTest() >= 90 },
  { id: 't100', i: '💎', n: '无敌的薇薇', d: '小测验得100分', ok: () => bestTest() >= 100 },
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

// ============================================================
//  页面
// ============================================================
let tab = 'map'
function go(t) {
  stopTimer(); G = null; tab = t; setTheme(''); Music.play('calm'); render(); window.scrollTo(0, 0)
}
function render() {
  ensureDaily()
  if (G) return
  if (tab === 'map') renderMap()
  else if (tab === 'test') renderTestSetup()
  else if (tab === 'wrong') renderWrong()
  else if (tab === 'badges') renderBadges()
}
function topbar(title) {
  const n = S.wrong.length
  return `<div class="topbar"><div class="title">${title}</div>
    <span class="chip" id="coinChip">💰 ${S.coins}</span>
    <span class="chip" title="连续天数">🔥 ${S.streak}天</span>
    <button class="chip wrongchip ${n ? 'has' : ''}" onclick="go('wrong')">📕 错题 ${n}</button></div>`
}
function nav() {
  const n = S.wrong.length, b = (t, i, name, extra = '') => `<button class="${tab === t ? 'on' : ''}" onclick="go('${t}')"><b>${i}</b>${name}${extra}</button>`
  return `<div class="nav">${b('map', '🗺️', '闯关')}${b('test', '📝', '小测验')}${b('wrong', '📕', '错题本', n ? `<span class="badge">${n}</span>` : '')}${b('badges', '🏅', '成就')}</div>`
}
function soundLinks() {
  return `<div class="small" style="text-align:center;margin:18px 0">
    <a href="javascript:toggleMusic()" class="lnk">${S.music ? '🎵 音乐：开' : '🎵 音乐：关'}</a>
    <a href="javascript:toggleSound()" class="lnk">${S.sound ? '🔊 音效：开' : '🔇 音效：关'}</a>
    <a href="javascript:toggleUnlock()" class="lnk">${S.unlockAll ? '🔓 全部解锁：开' : '🔒 全部解锁：关'}</a><br>人教版三年级上册数学</div>`
}

// ---------------- 地图 ----------------
function unlocked(u, l) { return S.unlockAll || l === 0 || (S.stars[lvId(u, l - 1)] || 0) > 0 }
function toggleUnlock() { S.unlockAll = !S.unlockAll; save(); SFX.tap(); toast(S.unlockAll ? '🔓 全部关卡已解锁' : '🔒 恢复成：过一关才解锁下一关'); render() }
function renderMap() {
  const p = petNow(), nx = petNext(), pct = nx ? Math.round((S.xp - p.xp) / (nx.xp - p.xp) * 100) : 100, d = S.daily
  let h = topbar('🏝️ 闯关岛')
  h += `<div class="datebar">📅 ${dateCN()}</div>`
  h += `<div class="cheer" onclick="SFX.good(3)">💪 <span>薇薇加油！</span> 💪</div>`
  h += `<div class="card pet"><div class="face" id="petFace" onclick="petTap()">${p.face}</div>
      <div class="info"><div class="name">${esc(S.petName)} <span class="small">· ${p.stage}</span></div>
        <div class="say" id="petSay">${pickSay(p)}</div><div class="bar"><i style="width:${pct}%"></i></div>
        <div class="small">${nx ? `成长值 ${S.xp}/${nx.xp}，答对1题+1` : '已经是最强形态啦！'}</div></div>
      <button class="btn gold sm" onclick="feed()">喂食<br>30💰</button></div>`
  h += `<div class="card daily"><div class="ic">${d.claimed ? '✅' : '🎁'}</div>
      <div class="info"><b>今日任务：答对 ${DAILY_GOAL} 题</b>
        <div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, d.correct / DAILY_GOAL * 100)}%;background:linear-gradient(90deg,#5ce1a0,#2bb673)"></i></div>
        <div class="small">${Math.min(d.correct, DAILY_GOAL)}/${DAILY_GOAL}　完成可领 80 金币</div></div>
      ${d.claimed ? '<span class="small">已领取</span>' : `<button class="btn green sm" ${d.correct >= DAILY_GOAL ? '' : 'disabled'} onclick="claimDaily()">领取</button>`}</div>`
  const bt = bestTest()
  h += `<div class="card testcard" onclick="go('test')"><div class="ic">📝</div><div class="info"><b>综合小测验</b><div class="small">${TEST_MID + TEST_HARD}题 · ${TEST_MIN}分钟 · 满分100分 · 可选单元${bt >= 0 ? `<br>最好成绩：${bt}分` : ''}</div></div><span class="btn sm">去测验</span></div>`
  let firstNext = null
  UNITS.forEach((U, u) => {
    const got = [0, 1, 2, 3].reduce((a, l) => a + (S.stars[lvId(u, l)] || 0), 0)
    h += `<div class="unit"><div class="head" style="background:${U.color}"><span>${U.icon}</span><span><span class="no">第${u + 1}单元</span><br>${U.name}</span><span class="prog">⭐ ${got}/12</span></div><div class="nodes">`
    for (let l = 0; l < 4; l++) {
      const st = S.stars[lvId(u, l)] || 0, open = unlocked(u, l), boss = l === 3, isNext = open && st === 0 && !firstNext
      if (isNext) firstNext = 1
      h += `<div class="node ${boss ? 'boss' : ''} ${open ? '' : 'lock'} ${isNext ? 'next' : ''}" ${isNext ? 'id="nextNode"' : ''}>
        <button class="dot" style="background:${U.color}" onclick="tapNode(${u},${l})">${open ? (boss ? '👹' : l + 1) : '🔒'}</button>
        <div class="lbl">${LV_NAMES[l]}</div><div class="stars">${open ? starStr(st) : ''}</div></div>`
    }
    h += '</div></div>'
  })
  $app.innerHTML = h + soundLinks() + nav()
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
  checkBadges().forEach(b => toast(`获得徽章 ${b.i} ${b.n}`)); save()
}
function claimDaily() {
  if (S.daily.claimed || S.daily.correct < DAILY_GOAL) return
  S.daily.claimed = true; S.coins += 80; save(); SFX.win(); confetti(40)
  toast('🎁 今日任务完成！<br>+80 金币'); renderMap()
}
function tapNode(u, l) {
  if (!unlocked(u, l)) { SFX.bad(); toast('🔒 先通过前一关才能解锁哦'); return }
  SFX.tap()
  if (l === 3) {
    modal(`<div class="i">👹</div><h3>${UNITS[u].name} · Boss战</h3><p>一共12题（4道难题），只有3颗❤️<br>答错1题少1颗心，心没了就失败。<br>赢了金币翻倍！</p>
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

// ============================================================
//  答题
// ============================================================
let G = null
function newGame(mode, qs, extra) {
  G = Object.assign({ mode, qs, i: 0, right: 0, combo: 0, maxCombo: 0, coins: 0, hearts: 0, locked: false, typed: '', rec: [], score: 0 }, extra || {})
  renderQ()
}
function startLevel(u, l) {
  const boss = l === 3
  setTheme(boss ? 'boss' : ''); Music.play(boss ? 'tense' : 'calm')
  newGame('level', makeLevel(u, l), { u, l, boss, hearts: boss ? 3 : 0 })
}
function startWrong() {
  if (!S.wrong.length) return
  setTheme(''); Music.play('calm')
  newGame('wrong', shuffle(S.wrong).slice(0, 10).map(q => JSON.parse(JSON.stringify(q))))
}
function quitQuiz() {
  modal(`<div class="i">🤔</div><h3>要退出吗？</h3><p>${G && G.mode === 'test' ? '测验还没交卷，退出后这次成绩不算哦' : '这一关的进度不会保存哦'}</p>
    <div class="row"><button class="btn ghost" onclick="closeModal();go(tab)">退出</button><button class="btn" onclick="closeModal()">继续答题</button></div>`)
}
const diffTag = q => {
  const hard = q.diff === 'hard'
  if (G.mode === 'test') return `<span class="tag ${hard ? 'hard' : 'mid'}">${hard ? '难题' : '中等'} · ${hard ? PT_HARD : PT_MID}分</span>`
  return `<span class="tag ${hard ? 'hard' : 'mid'}">${hard ? '💪 难题 · 金币×2' : '中等'}</span>`
}
function renderQ() {
  const q = G.qs[G.i]
  G.locked = false; G.typed = ''
  const pct = G.i / G.qs.length * 100
  let title = G.mode === 'wrong' ? '📕 错题复习' : G.mode === 'test' ? '📝 小测验' : `${UNITS[G.u].icon} ${LV_NAMES[G.l]}`
  let h = `<div class="quiz-top"><button class="x" onclick="quitQuiz()">✕</button><div class="bar"><i style="width:${pct}%"></i></div>`
  if (G.boss) h += `<span class="hearts" id="hearts">${heartsHtml()}</span>`
  if (G.mode === 'test') h += `<span class="timer" id="timer">⏱ --:--</span>`
  h += `<button class="x mus" onclick="toggleMusicQuiz()">${S.music ? '🎵' : '🔇'}</button></div>`
  h += `<div class="qmeta"><span>${title} · ${G.i + 1}/${G.qs.length}</span>${G.mode === 'test' ? `<span>${UNITS[q.unit] ? UNITS[q.unit].icon + ' 第' + (q.unit + 1) + '单元' : ''}</span>` : `<span class="combo" id="combo">${G.combo >= 2 ? `🔥${G.combo}连对` : ''}</span><span>💰 +${G.coins}</span>`}</div>`
  h += `<div class="qcard" id="qcard">${diffTag(q)}<div class="qtext ${q.q.length > 26 ? 'long' : ''}">${fmt(q.q)}</div>${q.type === 'clock' ? '' : (q.fig || '')}`
  h += BODY[q.type](q) + '</div>'
  if (G.mode === 'test') h += `<div class="skip"><button onclick="skipQ()">这题不会，先跳过 →</button></div>`
  h += `<div class="feedback" id="fb"></div>`
  $app.innerHTML = h
  window.scrollTo(0, 0)
  if (INIT[q.type]) INIT[q.type](q)
  if (G.mode === 'test') updateTimer()
}
function toggleMusicQuiz() { S.music = !S.music; save(); if (S.music) { audio(); Music.play() } else Music.stop(); const b = document.querySelector('.mus'); if (b) b.textContent = S.music ? '🎵' : '🔇' }
const heartsHtml = () => [0, 1, 2].map(i => `<span class="${i < G.hearts ? '' : 'off'}">❤️</span>`).join('')
const padHtml = () => `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="key('${n}')">${n}</button>`).join('')}<button class="del" onclick="key('del')">⌫</button><button onclick="key('0')">0</button><button class="ok" onclick="key('ok')">✓</button></div>`

// ---------- 各种题型的界面 ----------
const BODY = {
  choice: q => `<div class="opts ${q.options.length === 3 ? 'three' : ''}">` + q.options.map((o, k) => `<button class="opt" data-k="${k}" onclick="pickOpt(${k})">${fmt(o)}</button>`).join('') + '</div>',
  input: q => `<div class="answer-row"><div class="answer-box" id="abox">?</div>${q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ''}</div>` + '</div>' + padHtml() + '<div>',
  vertical: q => {
    const sym = q.op === '-' ? '−' : q.op === '*' ? '×' : '+', A = String(q.a), B = String(q.b), C = q.answer
    const W = Math.max(A.length, B.length, C.length) + 1
    const row = (s, lead) => `<div class="vrow">${Array.from({ length: W }, (_, j) => { const r = W - 1 - j; return `<span>${j === 0 && lead ? lead : r < s.length ? s[s.length - 1 - r] : ''}</span>` }).join('')}</div>`
    const ans = `<div class="vrow">${Array.from({ length: W }, (_, j) => { const r = W - 1 - j; return r < C.length ? `<span class="vbox" data-r="${r}"></span>` : '<span></span>' }).join('')}</div>`
    return `<div class="vert">${row(A)}${row(B, sym)}<div class="vline"></div>${ans}</div><div class="small">从个位（最右边）开始填，像在本子上写竖式一样</div></div>` + padHtml() + '<div>'
  },
  clock: q => `${clockSvg(12, 0, 'dragClock')}<div class="small">👆 拖动<b style="color:#333">长针（分针）</b>和<b style="color:#e8505b">短针（时针）</b></div><button class="btn green wide" onclick="checkClock()">✓ 拨好了</button>`,
  shade: q => `<div id="shadeBox">${shapeParts(q.shape, q.n)}</div><div class="small" id="shadeCnt">已涂 0 份</div><button class="btn green wide" onclick="checkShade()">✓ 涂好了</button>`,
  order: q => `<div class="slots" id="slots">${q.items.map((_, i) => `<button class="slot" data-s="${i}" onclick="unOrder(${i})"></button>${i < q.items.length - 1 ? '<span class="lt">&lt;</span>' : ''}`).join('')}</div>
    <div class="chips" id="chips">${q.shown.map((t, i) => `<button class="pchip" data-c="${i}" onclick="doOrder(${i})">${fmt(t)}</button>`).join('')}</div>
    <button class="btn green wide" id="ordOk" disabled onclick="checkOrder()">✓ 排好了</button>`,
  match: q => `<div class="match"><div class="col">${q.pairs.map((p, i) => `<button class="mitem" data-l="${i}" onclick="tapL(${i})">${fmt(p[0])}</button>`).join('')}</div>
    <div class="col">${q.right.map((r, i) => `<button class="mitem" data-r="${i}" onclick="tapR(${i})">${fmt(r)}</button>`).join('')}</div></div>
    <div class="small">先点左边，再点右边，配成一对（点已配对的可以取消）</div><button class="btn green wide" id="mOk" disabled onclick="checkMatch()">✓ 连好了</button>`,
  pop: q => `<div class="balloons">${q.items.map((it, i) => `<button class="balloon c${i % 6}" data-b="${i}" style="--d:${(i * 0.37) % 2}s" onclick="popB(${i})"><span>${fmt(it.t)}</span></button>`).join('')}</div><div class="small" id="popCnt">还有 ${q.items.filter(x => x.ok).length} 个要戳</div>`,
}
const INIT = {
  clock(q) {
    G.cl = { H: 12, m: 0 }
    const svg = document.getElementById('dragClock')
    let hand = null
    const ang = e => {
      const r = svg.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2
      return { a: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360, d: Math.hypot(x, y) / (r.width / 2) * 100 }
    }
    const diff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }
    svg.addEventListener('pointerdown', e => {
      if (G.locked) return
      const { a, d } = ang(e), ma = G.cl.m * 6, ha = ((G.cl.H % 12) + G.cl.m / 60) * 30
      hand = d < 58 && diff(a, ha) < 50 ? 'H' : diff(a, ma) <= diff(a, ha) ? 'M' : 'H'
      svg.setPointerCapture(e.pointerId); move(e)
    })
    const move = e => {
      if (!hand || G.locked) return
      const { a } = ang(e)
      if (hand === 'M') {
        const nm = Math.round(a / 30) * 5 % 60, pm = G.cl.m
        if (nm !== pm) {
          if (pm >= 45 && nm <= 15) G.cl.H = G.cl.H % 12 + 1
          if (pm <= 15 && nm >= 45) G.cl.H = (G.cl.H + 10) % 12 + 1
          G.cl.m = nm; SFX.tick()
        }
      } else {
        let H = Math.round((a - G.cl.m / 2) / 30)
        H = ((H % 12) + 12) % 12 || 12
        if (H !== G.cl.H) { G.cl.H = H; SFX.tick() }
      }
      drawHands(G.cl.H, G.cl.m)
    }
    svg.addEventListener('pointermove', move)
    const up = () => { hand = null }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up)
  },
  shade(q) {
    G.sh = new Set()
    document.querySelectorAll('#shadeBox [data-i]').forEach(el => el.addEventListener('click', () => {
      if (G.locked) return
      const i = +el.dataset.i
      G.sh.has(i) ? G.sh.delete(i) : G.sh.add(i)
      el.classList.toggle('on', G.sh.has(i)); SFX.tap()
      document.getElementById('shadeCnt').textContent = `已涂 ${G.sh.size} 份`
    }))
  },
  order() { G.ord = [] },
  match() { G.mt = {}; G.sel = null },
  pop() { G.popped = new Set() },
}
function drawHands(H, m) {
  const svg = document.getElementById('dragClock'); if (!svg) return
  svg.querySelector('.hand-h').setAttribute('transform', `rotate(${((H % 12) + m / 60) * 30} 100 100)`)
  svg.querySelector('.hand-m').setAttribute('transform', `rotate(${m * 6} 100 100)`)
}

// ---------- 各题型的作答 ----------
function key(k) {
  if (G.locked) return
  const q = G.qs[G.i], vert = q.type === 'vertical', max = vert ? q.answer.length : 6
  SFX.tap()
  if (k === 'del') G.typed = G.typed.slice(0, -1)
  else if (k === 'ok') {
    if (!G.typed) return
    if (vert && G.typed.length < max) { toast('还有空格没填完哦'); return }
    const v = vert ? G.typed.split('').reverse().join('').replace(/^0+(?=\d)/, '') : G.typed
    submit(v === q.answer, v, vert ? null : document.getElementById('abox'))
    return
  } else if (G.typed.length < max) G.typed = (!vert && G.typed === '0' ? '' : G.typed) + k
  if (vert) {
    document.querySelectorAll('.vbox').forEach(b => { const r = +b.dataset.r; b.textContent = G.typed[r] || ''; b.classList.toggle('cur', r === G.typed.length) })
  } else document.getElementById('abox').textContent = G.typed || '?'
}
function pickOpt(k) {
  if (G.locked) return
  const q = G.qs[G.i], el = document.querySelector(`.opt[data-k="${k}"]`)
  if (G.mode !== 'test') document.querySelectorAll('.opt').forEach(b => {
    const o = q.options[+b.dataset.k]
    b.classList.add(o === q.answer ? 'right' : b === el ? 'wrong' : 'dim')
  })
  else el.classList.add('chosen')
  submit(q.options[k] === q.answer, q.options[k], el)
}
function checkClock() {
  if (G.locked) return
  const q = G.qs[G.i], ok = G.cl.H % 12 === q.h % 12 && G.cl.m === q.m
  if (!ok && G.mode !== 'test') { // 显示正确的指针
    const svg = document.getElementById('dragClock')
    svg.insertAdjacentHTML('beforeend', `<line x1="100" y1="100" x2="100" y2="56" stroke="#2bb673" stroke-width="7" stroke-linecap="round" opacity=".75" transform="rotate(${((q.h % 12) + q.m / 60) * 30} 100 100)"/><line x1="100" y1="100" x2="100" y2="26" stroke="#2bb673" stroke-width="4" stroke-linecap="round" opacity=".75" transform="rotate(${q.m * 6} 100 100)"/>`)
  }
  submit(ok, `${G.cl.H}时${G.cl.m ? G.cl.m + '分' : '整'}`, document.getElementById('dragClock'))
}
function checkShade() {
  if (G.locked) return
  const q = G.qs[G.i]
  if (!G.sh.size) { toast('先点格子涂色哦'); return }
  submit(G.sh.size === q.k, `涂了 ${G.sh.size} 份`, document.getElementById('shadeBox'))
}
function doOrder(i) {
  if (G.locked || G.ord.includes(i)) return
  const q = G.qs[G.i]
  G.ord.push(i); SFX.tap(); drawOrder(q)
}
function unOrder(s) {
  if (G.locked || s >= G.ord.length) return
  G.ord.splice(s, 1); SFX.tap(); drawOrder(G.qs[G.i])
}
function drawOrder(q) {
  document.querySelectorAll('.slot').forEach((el, s) => { el.innerHTML = G.ord[s] !== undefined ? fmt(q.shown[G.ord[s]]) : ''; el.classList.toggle('full', G.ord[s] !== undefined) })
  document.querySelectorAll('.pchip').forEach(el => el.classList.toggle('used', G.ord.includes(+el.dataset.c)))
  document.getElementById('ordOk').disabled = G.ord.length < q.items.length
}
function checkOrder() {
  if (G.locked) return
  const q = G.qs[G.i], given = G.ord.map(i => q.shown[i])
  submit(given.join('|') === q.items.join('|'), given.join(' < '), document.getElementById('slots'))
}
const MCOL = ['#4a5bd4', '#ff9f1c', '#2bb673', '#e86aa6', '#8b6cf0']
function tapL(i) {
  if (G.locked) return
  SFX.tap()
  if (G.mt[i] !== undefined) { delete G.mt[i]; G.sel = null } else G.sel = G.sel === i ? null : i
  drawMatch()
}
function tapR(r) {
  if (G.locked) return
  SFX.tap()
  const owner = Object.keys(G.mt).find(l => G.mt[l] === r)
  if (G.sel === null) { if (owner !== undefined) delete G.mt[owner]; drawMatch(); return }
  if (owner !== undefined) delete G.mt[owner]
  G.mt[G.sel] = r; G.sel = null; drawMatch()
}
function drawMatch() {
  const q = G.qs[G.i]
  document.querySelectorAll('[data-l]').forEach(el => {
    const l = +el.dataset.l, r = G.mt[l]
    el.classList.toggle('sel', G.sel === l)
    el.style.background = r !== undefined ? MCOL[l] : ''; el.style.color = r !== undefined ? '#fff' : ''
  })
  document.querySelectorAll('[data-r]').forEach(el => {
    const r = +el.dataset.r, l = Object.keys(G.mt).find(k => G.mt[k] === r)
    el.style.background = l !== undefined ? MCOL[l] : ''; el.style.color = l !== undefined ? '#fff' : ''
  })
  document.getElementById('mOk').disabled = Object.keys(G.mt).length < q.pairs.length
}
function checkMatch() {
  if (G.locked) return
  const q = G.qs[G.i]
  const ok = q.pairs.every((p, l) => q.right[G.mt[l]] === p[1])
  submit(ok, q.pairs.map((p, l) => `${p[0]} → ${q.right[G.mt[l]]}`).join('；'), document.querySelector('.match'))
}
function popB(i) {
  if (G.locked || G.popped.has(i)) return
  const q = G.qs[G.i], it = q.items[i], el = document.querySelector(`[data-b="${i}"]`)
  G.popped.add(i)
  if (it.ok) {
    SFX.pop(); vibrate(10); el.classList.add('popped')
    const left = q.items.filter((x, k) => x.ok && !G.popped.has(k)).length
    document.getElementById('popCnt').textContent = left ? `还有 ${left} 个要戳` : '全部戳完啦！'
    if (!left) submit(true, '', el)
  } else {
    el.classList.add('badpop')
    if (G.mode !== 'test') q.items.forEach((x, k) => { if (x.ok && !G.popped.has(k)) document.querySelector(`[data-b="${k}"]`).classList.add('hint') })
    submit(false, `戳了「${it.t}」`, el)
  }
}
function skipQ() { if (!G.locked) submit(false, '（跳过）', null) }

// ---------- 判分和反馈 ----------
const praiseList = c => c >= 5 ? ['太厉害了！', '停不下来！', '数学小天才！', '薇薇无敌！'] : c >= 3 ? ['真棒！', '越来越快了！', '漂亮！', '薇薇好厉害！'] : ['答对了！', '正确！', '好样的！']
function submit(ok, given, el) {
  G.locked = true
  const q = G.qs[G.i], hard = q.diff === 'hard'
  ensureDaily(); checkIn()
  S.totalAns++
  if (ok) { S.totalCorrect++; S.daily.correct++; if (hard) S.hardCorrect++ }
  // ---- 小测验：不马上告诉对错，像真正考试一样 ----
  if (G.mode === 'test') {
    G.rec.push({ q, ok, given })
    if (ok) { G.right++; G.score += hard ? PT_HARD : PT_MID; addXp(1) }
    SFX.tap(); save()
    setTimeout(() => { G.i++; G.i >= G.qs.length ? finishTest('done') : renderQ() }, 350)
    return
  }
  const rect = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0 }
  if (q.type === 'input' && el) el.classList.add(ok ? 'right' : 'wrong')
  if (q.type === 'vertical') document.querySelectorAll('.vbox').forEach(b => b.classList.add(ok ? 'right' : 'wrong'))
  const fb = document.getElementById('fb')
  if (ok) {
    G.right++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo)
    S.bestCombo = Math.max(S.bestCombo, G.combo)
    let gain = (hard ? 20 : 10) + Math.min(G.combo - 1, 5) * 2
    if (G.boss) gain *= 2
    if (G.mode === 'wrong') { gain = 5; removeWrong(q); S.fixed++ }
    G.coins += gain
    const evo = addXp(1); if (evo) G.evo = evo
    SFX.good(G.combo); vibrate(15)
    floatText(`+${gain}💰`, rect.left + rect.width / 2, rect.top)
    const pl = praiseList(G.combo)
    fb.className = 'feedback good show'
    fb.innerHTML = `<div class="t">✅ ${pl[Math.floor(Math.random() * pl.length)]} ${G.combo >= 2 ? `<span class="combo pop">🔥${G.combo}连对</span>` : ''}</div>`
    const c = document.getElementById('combo'); if (c) { c.textContent = G.combo >= 2 ? `🔥${G.combo}连对` : ''; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop') }
    setTimeout(next, G.combo >= 3 ? 800 : 1000)
  } else {
    G.combo = 0
    if (G.mode === 'level') addWrong(q)
    SFX.bad(); vibrate([40, 40, 40])
    const card = document.getElementById('qcard'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake')
    if (G.boss) { G.hearts--; const hs = document.getElementById('hearts'); hs.innerHTML = heartsHtml(); hs.classList.add('hit') }
    fb.className = 'feedback bad show'
    fb.innerHTML = `<div class="t">❌ 没关系，看看怎么做</div>
      ${given ? `<div class="yours">你的答案：${fmt(given)}</div>` : ''}
      <div class="ans">✅ 正确答案：${fmt(q.answerText || q.answer)}</div>
      <div class="tip">${fmt(q.tip || '再仔细想一想～')}</div>
      <button class="btn red" onclick="next()">${G.boss && G.hearts <= 0 ? '看结果' : '我懂了，下一题 →'}</button>`
  }
  save()
}
function next() {
  if (!G) return
  if (G.boss && G.hearts <= 0) return finishLevel()
  G.i++
  G.i >= G.qs.length ? finishLevel() : renderQ()
}
function addWrong(q) {
  if (S.wrong.some(w => qKey(w) === qKey(q))) return
  S.wrong.push(JSON.parse(JSON.stringify(q)))
  if (S.wrong.length > 100) S.wrong.shift()
}
function removeWrong(q) { S.wrong = S.wrong.filter(w => qKey(w) !== qKey(q)) }

// ---------------- 闯关结算 ----------------
function finishLevel() {
  const n = G.qs.length, rate = G.right / n
  let stars = 0, bonus = 0, title, sub
  if (G.mode === 'level') {
    stars = G.boss ? (G.hearts <= 0 ? 0 : G.hearts) : rate >= 0.9 ? 3 : rate >= 0.7 ? 2 : rate >= 0.6 ? 1 : 0
    const id = lvId(G.u, G.l), old = S.stars[id] || 0
    if (stars > old) { bonus = (stars - old) * 20; S.stars[id] = stars }
  }
  S.coins += G.coins + bonus
  const badges = checkBadges(); save()
  const pass = G.mode === 'wrong' || stars > 0, perfect = G.mode === 'level' && G.right === n
  if (G.mode === 'wrong') { title = '复习完成！'; sub = `改正了 ${G.right} 道错题` }
  else if (!pass) { title = G.boss ? 'Boss 太强了…' : '差一点点！'; sub = G.boss ? '心用完了，再挑战一次吧！' : `答对 ${G.right}/${n} 题，答对6题就能过关` }
  else { title = stars === 3 ? '完美通关！' : stars === 2 ? '闯关成功！' : '过关啦！'; sub = `答对 ${G.right}/${n} 题` }
  if (perfect) { title = '薇薇真棒！'; sub = `满分！${n} 题全部答对 🎉` }
  setTheme(''); Music.play('calm')
  pass ? (SFX.win(), confetti(stars === 3 ? 110 : 60)) : SFX.lose()
  if (perfect) setTimeout(() => fireworks('薇薇真棒！', `满分！${n}题全对`), 400)
  let h = `<div class="result"><div style="font-size:64px">${pass ? (G.boss ? '👑' : '🎉') : '💪'}</div><div class="big">${title}</div><div style="color:var(--sub)">${sub}</div>`
  if (G.mode === 'level') h += `<div class="bigstars">${[0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">⭐</span>`).join('')}</div>`
  h += `<div class="stats"><span class="chip">💰 +${G.coins + bonus}</span><span class="chip">🔥 最高${G.maxCombo}连对</span>${bonus ? `<span class="chip">新星星奖励 +${bonus}</span>` : ''}</div>`
  badges.forEach(b => { h += `<div class="newbadge">🎖️ 获得新徽章：${b.i} ${b.n}（${b.d}）</div>` })
  h += '<div class="acts">'
  if (G.mode === 'level') {
    const nl = G.l < 3 ? [G.u, G.l + 1] : G.u < UNITS.length - 1 ? [G.u + 1, 0] : null
    if (pass && nl && unlocked(...nl)) h += `<button class="btn green" onclick="startLevel(${nl[0]},${nl[1]})">下一关 →</button>`
    h += `<button class="btn ${pass ? 'ghost' : ''}" onclick="startLevel(${G.u},${G.l})">${pass && stars < 3 ? '再玩一次，冲3星！' : '再玩一次'}</button>`
  } else if (S.wrong.length) h += `<button class="btn" onclick="startWrong()">继续复习（还有${S.wrong.length}题）</button>`
  h += `<button class="btn ghost" onclick="go('map')">回到地图</button></div></div>`
  const evo = G.evo
  G = null
  $app.innerHTML = h; window.scrollTo(0, 0)
  document.querySelectorAll('.bigstars span').forEach((s, i) => setTimeout(() => { s.classList.add('in'); if (i < stars) tone(784 + i * 200, 0, 0.15, 'triangle') }, 300 + i * 350))
  if (evo) setTimeout(() => showEvolve(evo), perfect ? 5600 : 1600)
}

// ============================================================
//  小测验
// ============================================================
function renderTestSetup() {
  const sel = S.testUnits
  let h = topbar('📝 小测验')
  h += `<div class="datebar">📅 ${dateCN()}</div>`
  h += `<div class="card"><b>📋 测验说明</b><div class="small" style="font-size:14px;line-height:1.7;margin-top:4px">
    · 一共 <b>${TEST_MID + TEST_HARD}</b> 题，限时 <b>${TEST_MIN} 分钟</b>，满分 <b>100 分</b><br>
    · 中等题 ${TEST_MID} 道，每道 ${PT_MID} 分；难题 ${TEST_HARD} 道，每道 ${PT_HARD} 分<br>
    · 像真正考试一样：做完才公布成绩，然后可以看每道错题的讲解<br>
    · 时间到了会自动交卷</div></div>`
  h += `<div class="h2">选择要考的单元 <span class="small">（可多选）</span></div>
    <div class="selbtns"><button class="btn sm ghost" onclick="selAll(true)">全选</button><button class="btn sm ghost" onclick="selAll(false)">全不选</button></div>
    <div class="ugrid">${UNITS.map((U, u) => `<button class="usel ${sel.includes(u) ? 'on' : ''}" style="--c:${U.color}" onclick="selUnit(${u})"><span class="ck">${sel.includes(u) ? '✔' : ''}</span><span class="ui">${U.icon}</span><span class="un">第${u + 1}单元<br><b>${U.name}</b></span></button>`).join('')}</div>`
  h += `<button class="btn big-start" ${sel.length ? '' : 'disabled'} onclick="startTest()">🚀 开始测验（已选 ${sel.length} 个单元）</button>`
  if (S.tests.length) {
    h += `<div class="h2">📜 历史成绩</div><div class="card hist">` + S.tests.slice().reverse().slice(0, 15).map(t =>
      `<div class="hrow"><span class="hd">${t.date}</span><span class="hs ${rating(t.score).cls}">${t.score}分</span><span class="ht">${rating(t.score).name}</span></div>`).join('') + '</div>'
  }
  $app.innerHTML = h + nav()
}
function selUnit(u) { const s = S.testUnits; s.includes(u) ? s.splice(s.indexOf(u), 1) : s.push(u); s.sort((a, b) => a - b); save(); SFX.tap(); renderTestSetup() }
function selAll(on) { S.testUnits = on ? UNITS.map((_, i) => i) : []; save(); SFX.tap(); renderTestSetup() }
function rating(s) {
  if (s >= 100) return { name: '无敌的薇薇', icon: '👑', cls: 'r4', say: '满分！你就是数学小天才，谁也挡不住！' }
  if (s >= 90) return { name: '聪明的薇薇', icon: '🌟', cls: 'r3', say: '太棒了！离满分只差一点点，下次冲击无敌！' }
  if (s >= 60) return { name: '普通的薇薇', icon: '🙂', cls: 'r2', say: '及格啦！把错题弄懂，就能变成聪明的薇薇！' }
  return { name: '笨笨的薇薇', icon: '🐢', cls: 'r1', say: '没关系！认真看看错题讲解，下次一定会更好！' }
}
let timerId = null
function stopTimer() { clearInterval(timerId); timerId = null }
function startTest() {
  if (!S.testUnits.length) return
  setTheme('test'); Music.play('focus')
  newGame('test', makeSet(S.testUnits, TEST_MID, TEST_HARD), { units: S.testUnits.slice(), t0: Date.now(), deadline: Date.now() + TEST_MIN * 60000 })
  stopTimer(); timerId = setInterval(updateTimer, 1000)
}
function updateTimer() {
  if (!G || G.mode !== 'test') return stopTimer()
  const left = Math.max(0, G.deadline - Date.now()), s = Math.ceil(left / 1000)
  const el = document.getElementById('timer')
  if (el) { el.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; el.classList.toggle('warn', s <= 300) }
  if (s <= 300 && !G.hurry) { G.hurry = true; Music.play('tense'); toast('⏰ 还剩 5 分钟，加油！') }
  if (left <= 0) finishTest('time')
}
function finishTest(why) {
  stopTimer()
  const g = G
  // 时间到了还没做的题，算作没答
  for (let i = g.rec.length; i < g.qs.length; i++) g.rec.push({ q: g.qs[i], ok: false, given: '（没来得及做）' })
  const used = Math.min(TEST_MIN * 60, Math.round((Date.now() - g.t0) / 1000))
  const rt = rating(g.score), now = new Date()
  const unitsTxt = g.units.length === UNITS.length ? '全部单元' : '第' + g.units.map(u => u + 1).join('、') + '单元'
  S.tests.push({ date: `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, score: g.score, units: g.units, used })
  if (S.tests.length > 50) S.tests.shift()
  g.rec.forEach(r => { if (!r.ok) addWrong(r.q) })
  S.coins += g.score
  const badges = checkBadges(); save()
  G = null; setTheme(''); Music.play('calm')
  const wrongs = g.rec.filter(r => !r.ok)
  let h = `<div class="result">${why === 'time' ? '<div class="small" style="margin-bottom:8px">⏰ 时间到，已自动交卷</div>' : ''}
    <div class="cert ${rt.cls}" id="cert">
      <div class="cert-date">📅 ${dateCN(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}</div>
      <div class="cert-head">数学小测验 · 成绩单</div>
      <div class="cert-icon">${rt.icon}</div>
      <div class="cert-title">${rt.name}</div>
      <div class="cert-score"><b>${g.score}</b> 分</div>
      <div class="cert-info">考试范围：${unitsTxt}<br>答对 ${g.right}/${g.qs.length} 题 · 用时 ${Math.floor(used / 60)}分${used % 60}秒</div>
      <div class="cert-say">${rt.say}</div>
    </div>
    <div class="small">📸 可以截图保存这张成绩单哦　·　获得 💰 ${g.score} 金币</div>`
  badges.forEach(b => { h += `<div class="newbadge">🎖️ 获得新徽章：${b.i} ${b.n}（${b.d}）</div>` })
  if (wrongs.length) {
    h += `<div class="h2" style="text-align:left">🔍 错题讲解（${wrongs.length} 道，已放进错题本）</div>`
    h += wrongs.map((r, i) => `<div class="card review"><div class="rq"><span class="tag ${r.q.diff === 'hard' ? 'hard' : 'mid'}">${r.q.diff === 'hard' ? '难题' : '中等'}</span> ${fmt(r.q.q)}</div>
      ${r.q.fig && r.q.type !== 'clock' ? r.q.fig : r.q.type === 'clock' ? clockSvg(r.q.h, r.q.m) : ''}
      <div class="yours">你的答案：${fmt(r.given || '—')}</div><div class="ans">✅ 正确答案：${fmt(r.q.answerText || r.q.answer)}</div><div class="tip">${fmt(r.q.tip)}</div></div>`).join('')
  }
  h += `<div class="acts"><button class="btn green" onclick="go('test')">再测一次</button><button class="btn ghost" onclick="go('map')">回到首页</button></div></div>`
  $app.innerHTML = h; window.scrollTo(0, 0)
  if (g.score >= 100) { SFX.win(); setTimeout(() => fireworks('无敌的薇薇', '小测验满分 100 分！'), 300) }
  else if (g.score >= 90) { SFX.win(); confetti(110) }
  else if (g.score >= 60) { SFX.win(); confetti(50) }
  else SFX.lose()
}

// ---------------- 错题本 ----------------
const TYPE_NAME = { choice: '选择', input: '填空', vertical: '竖式', clock: '拨钟', shade: '涂色', order: '排序', match: '连线', pop: '戳气球' }
function renderWrong() {
  let h = topbar('📕 错题本')
  if (!S.wrong.length) h += `<div class="card empty"><div class="i">🌈</div>错题本是空的，太棒了！<br>闯关和测验中答错的题会自动收到这里。</div>`
  else {
    h += `<div class="card" style="text-align:center"><div style="font-size:15px;margin-bottom:10px">有 <b style="color:var(--bad);font-size:22px">${S.wrong.length}</b> 道题等薇薇来消灭<br><span class="small">在复习里答对，就会从错题本里移走</span></div>
      <button class="btn" style="width:100%;padding:13px;font-size:18px" onclick="startWrong()">开始复习（每次最多10题）</button></div><div class="card wlist">` +
      S.wrong.slice().reverse().map(w => `<details class="w"><summary><span class="u">${UNITS[w.unit] ? UNITS[w.unit].icon : ''}</span><span>${fmt(w.q)}</span><span class="tt">${TYPE_NAME[w.type] || ''}</span></summary>
        <div class="ans">✅ 正确答案：${fmt(w.answerText || w.answer)}</div><div class="tip">${fmt(w.tip || '')}</div></details>`).join('') + '</div>'
  }
  $app.innerHTML = h + nav()
}

// ---------------- 成就 ----------------
function renderBadges() {
  const acc = S.totalAns ? Math.round(S.totalCorrect / S.totalAns * 100) : 0, bt = bestTest()
  let h = topbar('🏅 我的成就')
  h += `<div class="card statrow"><div><b>${S.totalCorrect}</b><span>答对题数</span></div><div><b>${acc}%</b><span>正确率</span></div><div><b>${S.bestCombo}</b><span>最高连对</span></div>
    <div><b>${totalStars()}</b><span>星星 / 108</span></div><div><b>${BOSS_WINS()}</b><span>打败Boss / 9</span></div><div><b>${bt >= 0 ? bt : '-'}</b><span>测验最高分</span></div></div>`
  h += `<div class="h2">徽章 ${S.badges.length}/${BADGES.length}</div><div class="grid">` +
    BADGES.map(b => `<div class="bd ${S.badges.includes(b.id) ? '' : 'lock'}"><div class="i">${b.i}</div><div class="n">${b.n}</div><div class="d">${b.d}</div></div>`).join('') + '</div>'
  $app.innerHTML = h + soundLinks() + nav()
}

// ---------------- 满分烟花 ----------------
function fireworks(text, sub, ms = 5000) {
  const wrap = document.createElement('div'); wrap.className = 'fw'
  wrap.innerHTML = `<canvas></canvas><div class="fw-text">${esc(text)}<small>${esc(sub || '')}</small><small class="fw-date">${dateCN()}</small></div><div class="fw-tip">点一下继续</div>`
  document.body.appendChild(wrap)
  const cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d')
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight
  cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr)
  const cols = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585', '#ff9f1c', '#b388ff', '#ffffff']
  const rockets = [], parts = [], t0 = performance.now()
  let lastLaunch = 0, closed = false
  const launch = () => rockets.push({ x: W * (0.12 + Math.random() * 0.76), y: H, vy: -(H * 0.016 + Math.random() * H * 0.006), ty: H * (0.12 + Math.random() * 0.35), c: cols[Math.floor(Math.random() * cols.length)] })
  function burst(x, y, c) {
    const n = 70, ring = Math.random() < 0.4
    for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n, sp = ring ? 3.6 : 1 + Math.random() * 4; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: Math.random() < 0.25 ? '#fff' : c }) }
    tone(90 + Math.random() * 60, 0, 0.35, 'triangle', 0.12); tone(1800 + Math.random() * 600, 0.05, 0.25, 'square', 0.015)
  }
  function close() { if (closed) return; closed = true; wrap.style.opacity = '0'; setTimeout(() => wrap.remove(), 600) }
  wrap.onclick = close
  function frame(now) {
    if (closed) return
    const el = now - t0
    if (el < ms - 1200 && now - lastLaunch > 320) { launch(); if (Math.random() < 0.35) launch(); lastLaunch = now }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(12,14,48,0.25)'; ctx.fillRect(0, 0, W, H)
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

render()
const nn = document.getElementById('nextNode')
if (nn && totalStars() > 0) setTimeout(() => nn.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
