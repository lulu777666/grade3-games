// ============================================================
//  三年级数学上 · 游戏主程序（第三版）
//  UNITS、makeSet、makeLevel、similar、shuffle、clockSvg、shapeParts、qKey、qHash 来自 questions.js / questions3.js
// ============================================================
const $app = document.getElementById('app')
const $fx = document.getElementById('fx')
// 家长体验模式：网址后面加 ?demo=1，用另一份存档，不影响薇薇的进度
const DEMO = /[?&]demo=1/.test(location.search)
const KEY = DEMO ? 'math3a_demo' : 'math3a_v1'
const DAILY_GOAL = 30
const TEST_MIN = 30, TEST_MID = 20, TEST_HARD = 10, PT_MID = 3, PT_HARD = 4 // 20×3 + 10×4 = 100
const TEST_PER_DAY = 5
const DRILL_N = 5

// ============================================================
//  金币规则（第九版，算好了的）：每周一切重新开始（错题本除外）
//  每周最多能赚：答题 30×7 + 今日任务 20×7 + 每周任务 30×6 + 宝箱 100 + 小测验连续2次满分 60 + 徽章奖励 20+40+50+80 = 880
//  花销：小樱升满4级 50+60+70+80 = 260，商店全部 420，爸爸的钱包 200 → 880（刚好）
//  所以：每一项都拿满，买齐装扮、小樱升满，剩下的正好 200 买钱包；少拿一样都不够
// ============================================================
const COIN = { mid: 1, hard: 2, dayCap: 30, daily: 20, weekTask: 30, chest: 100, testStreak: 60 }
const LV_COST = [50, 60, 70, 80]
const WALLET = { p: 200, n: '爸爸的钱包 20 元' }
// 集徽章领奖励：本周集到一定数量可以领金币（算进“本周赚的金币”）
const BADGE_RW = [{ n: 5, coin: 20 }, { n: 10, coin: 40 }, { n: 15, coin: 50 }, { n: 21, coin: 80 }]
// 一周最多能赚的金币（= 880）。本周赚满这么多，才能买爸爸的钱包
const WEEK_MAX = COIN.dayCap * 7 + COIN.daily * 7 + COIN.weekTask * 6 + COIN.chest + COIN.testStreak + BADGE_RW.reduce((s, r) => s + r.coin, 0)

// ---------------- 存档 ----------------
function defaults() {
  return {
    ver: 9, coins: 0, xp: 0, petLv: 0, stars: {}, wrong: [], wrongDone: [], bestCombo: 0, totalCorrect: 0, totalAns: 0, hardCorrect: 0,
    streak: 0, lastDay: '', fixed: 0, daily: { date: '', correct: 0, claimed: false },
    sound: true, music: true, unlockAll: false, petName: '小樱', tests: [], testUnits: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    recentQ: [], owned: [], hat: '', dress: '', shoes: '', week: null, weekHist: [], bossKills: 0,
    coinDay: { date: '', n: 0 }, testDay: { date: '', n: 0 }, perfStreak: 0, walletLog: [], maxLv: 0,
  }
}
let S, saved = {}
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch (e) { saved = {} }
S = Object.assign(defaults(), saved)
if (saved.coins !== undefined && (saved.ver || 0) < 4) {
  // 第三版按新版教材重新排了单元：旧的星星和错题对不上了，清掉
  if ((saved.ver || 0) < 3) { S.stars = {}; S.wrong = []; S.wrongDone = []; S.testUnits = [0, 1, 2, 3, 4, 5, 6, 7, 8]; S.recentQ = [] }
  // 第四版：宠物换成小樱，金币变“值钱”了：旧金币按 5:1 换算，原来的成长阶段换成小樱的等级
  S.petLv = [0, 20, 80, 200, 500].filter(x => (saved.xp || 0) >= x).length - 1
  S.maxLv = S.petLv
  S.coins = Math.round((saved.coins || 0) / 5)
  S.petName = '小樱'; S.owned = []
  S.ver = 4
}
if (saved.coins !== undefined && (saved.ver || 0) < 5) {
  // 第五版：商店改成 头饰/公主裙/鞋子。旧商品里新商店没有的，按原价退回金币
  const OLD = { bell: 40, geta: 40, kimono: 60, ichimatsu: 20, asanoha: 20, kikko: 25, uroko: 25, seigaiha: 30, flame: 30 }
  const keep = HATS.concat(DRESSES, SHOES).map(a => a.id)
  const DIFF = { bow: 5, hairpin: 10, crown: 10 } // 这几样降价了，退差价
  ;(S.owned || []).forEach(id => { if (!keep.includes(id) && OLD[id]) S.coins += OLD[id]; if (DIFF[id]) S.coins += DIFF[id] })
  S.owned = (S.owned || []).filter(id => keep.includes(id))
  S.hat = HATS.some(h => h.id === S.acc) ? S.acc : ''
  delete S.acc; delete S.pat
  S.ver = 5
}
// 第六版之后：“全部解锁”只在家长模式里有，孩子的存档要一关一关闯
if (saved.coins !== undefined && (saved.ver || 0) < 6) { S.unlockAll = false; S.ver = 6 }
// 第七版：每关只有 1 颗星。以前的 3 星（全对）换成 1 颗星；斩鬼赢过的也换成 1 颗星；没全对的普通关不算过关
if (saved.coins !== undefined && (saved.ver || 0) < 7) {
  Object.keys(S.stars).forEach(k => { const v = S.stars[k], boss = k.endsWith('-3'); if ((boss && v > 0) || v >= 3) S.stars[k] = 1; else delete S.stars[k] })
  S.ver = 7; try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { }
}
// 第八版：徽章改成每周一重新点亮（放在 S.week 里），以前“永久徽章”的数据不用了
if (saved.coins !== undefined && (saved.ver || 0) < 8) {
  ;['badges', 'badgeRw', 'bestRun', 'run', 'figCorrect'].forEach(k => delete S[k])
  S.ver = 8; try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { }
}
// 第九版：每周一切重新开始。新规则从这一周开始算：本周按新规则从头来（错题本、测验记录保留）
if (saved.coins !== undefined && (saved.ver || 0) < 9) {
  S.week = null; S.coinDay = { date: '', n: 0 }; S.daily = { date: '', correct: 0, claimed: false }
  delete S.skillDay
  S.ver = 9; S.weekNotice = true
  // weekRestart 在后面定义，这里直接清
  S.coins = 0; S.stars = {}; S.petLv = 0; S.maxLv = 0; S.owned = []; S.hat = ''; S.dress = ''; S.shoes = ''; S.perfStreak = 0
  try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { }
}
if (DEMO) S.unlockAll = true
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { } }
const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const today = () => dayKey(new Date())
const dateCN = (d = new Date()) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${'日一二三四五六'[d.getDay()]}`
const timeStr = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const shortDate = (d = new Date()) => `${d.getMonth() + 1}月${d.getDate()}日`
function ensureDaily() { if (S.daily.date !== today()) S.daily = { date: today(), correct: 0, claimed: false } }
function checkIn() {
  if (S.lastDay === today()) return
  const y = new Date(); y.setDate(y.getDate() - 1)
  S.streak = S.lastDay === dayKey(y) ? S.streak + 1 : 1
  S.lastDay = today()
}

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
function noise(t0, dur, vol, freq) { // 刀风声
  if (!S.sound || !audio()) return
  const n = Math.floor(AC.sampleRate * dur), buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain()
  src.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(freq, AC.currentTime + t0); f.frequency.exponentialRampToValueAtTime(freq * 3, AC.currentTime + t0 + dur)
  g.gain.value = vol; src.connect(f); f.connect(g); g.connect(AC.destination); src.start(AC.currentTime + t0)
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
  slash: () => { noise(0, 0.22, 0.5, 900); tone(1568, 0.05, 0.25, 'triangle', 0.06) },
  oniHit: () => { tone(110, 0, 0.3, 'sawtooth', 0.12); noise(0, 0.25, 0.3, 200) },
  shield: () => { tone(880, 0, 0.1, 'sine', 0.1); tone(1320, 0.08, 0.3, 'sine', 0.08) },
}

// ---- 背景音乐 ----
const mf = n => 440 * Math.pow(2, (n - 69) / 12)
const rpick = a => a[Math.floor(Math.random() * a.length)]
const SONGS = {
  // 闯关：轻松舒缓（C 大调五声音阶，慢慢的琶音）
  calm: {
    bpm: 84, vol: 0.55, step(s, t, dt) {
      const ch = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]][Math.floor(s / 16) % 4], p = s % 16
      if (p === 0) ch.forEach(n => mnote(mf(n), t, dt * 16, 'sine', 0.035, 0.8))
      if (p % 8 === 0) mnote(mf(ch[0] - 12), t, dt * 4, 'triangle', 0.07, 0.02)
      const arp = [0, 1, 2, 1, 2, 1, 0, 2][p % 8]
      if (Math.random() < 0.6) mnote(mf(ch[arp] + 12), t, dt * 1.6, 'triangle', 0.03, 0.01)
      if (p % 4 === 2 && Math.random() < 0.22) mnote(mf(rpick([72, 74, 76, 79, 81]) + 12), t, dt * 4, 'sine', 0.02, 0.01)
    },
  },
  // 紧张（a 小调，快节奏低音 + 心跳鼓点）——小测验最后 5 分钟
  tense: {
    bpm: 126, vol: 0.5, step(s, t, dt) {
      const ch = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]][Math.floor(s / 8) % 4], p = s % 8
      mnote(mf(ch[0] - 24), t, dt * 0.8, 'sawtooth', p % 2 === 0 ? 0.035 : 0.02, 0.005)
      if (p === 0 || p === 3 || p === 6) ch.forEach(n => mnote(mf(n), t, dt * 0.6, 'triangle', 0.018, 0.005))
      if (p === 0 || p === 4) kick(t)
      mnote(5200, t, 0.03, 'sine', 0.005, 0.001)
    },
  },
  // 斩鬼战：和风（日本“都节”音阶 + 太鼓 + 琴 + 笛子）
  oni: {
    bpm: 112, vol: 0.6, step(s, t, dt) {
      const p = s % 16, sec = Math.floor(s / 32) % 2, root = sec ? 45 : 40
      const sc = sec ? [69, 70, 74, 76, 77, 81] : [64, 65, 69, 71, 72, 76]
      if ([0, 3, 6, 8, 10, 11, 14].includes(p)) kick(t, p === 0 || p === 8 ? 0.2 : 0.11)
      if (p === 0) { mnote(mf(root - 12), t, dt * 16, 'sawtooth', 0.018, 0.4); mnote(mf(root - 5), t, dt * 16, 'triangle', 0.02, 0.4) }
      if (p % 2 === 0 && Math.random() < 0.75) mnote(mf(rpick(sc) - 12), t, dt * 1.4, 'triangle', 0.035, 0.003)
      if (p % 8 === 4 && Math.random() < 0.7) mnote(mf(rpick(sc) + 12), t, dt * 6, 'sine', 0.028, 0.12)
      if (p === 15 && Math.random() < 0.5) mnote(mf(rpick(sc)), t, dt * 0.5, 'square', 0.012, 0.002)
    },
  },
  // 小测验：专注（很慢的柔和和弦 + 偶尔一声风铃）
  focus: {
    bpm: 60, vol: 0.6, step(s, t, dt) {
      const ch = [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 64]][Math.floor(s / 16) % 4], p = s % 16
      if (p === 0) ch.forEach(n => mnote(mf(n), t, dt * 17, 'sine', 0.028, 1.6))
      if (p % 2 === 0 && Math.random() < 0.16) mnote(mf(rpick([76, 79, 81, 84, 88])), t, dt * 5, 'sine', 0.018, 0.01)
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
function kick(t, vol = 0.12) {
  const o = AC.createOscillator(), g = AC.createGain()
  o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15)
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
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
const showA = (q, s) => (q.html ? String(s) : fmt(s)) // 图形选项（观察物体）直接显示图
const starStr = n => `<span class="${n ? '' : 'off'}">⭐</span>` // 每关只有 1 颗星：全对才拿到
const totalStars = () => Object.values(S.stars).reduce((a, b) => a + b, 0)
const lvId = (u, l) => `${u}-${l}`
const LV_NAMES = ['第1关', '第2关', '第3关', 'Boss']
const unitLabel = u => (UNITS[u] ? `${UNITS[u].label}` : '')
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

// ============================================================
//  小伙伴「小樱」：花金币升级（最高4级），会学会本领
//  本领每种每周只能用1次，用了不掉级；每周一小樱回到0级重新升
// ============================================================
const PET = [
  { face: '👧', stage: '小女孩', say: ['给我升级，我想变成公主！', '薇薇加油，我在为你打气！'] },
  { face: '🌸', stage: '樱花小姐姐', say: ['樱花瓣飘起来啦！谢谢薇薇！', '选择题太难时，我能帮你去掉一个错的选项。'] },
  { face: '⚔️', stage: '樱花小剑士', say: ['我有小宝剑啦！', '不会的题，我可以先给你一句小提示。'] },
  { face: '🧚', stage: '樱花仙子', say: ['我长出翅膀啦！', '我能给你开护盾，答错一次也不怕！'] },
  { face: '👸', stage: '樱花公主', say: ['我是樱花公主！', '斩鬼的时候，我多送你一颗心！'] },
]
const SKILLS = [
  { lv: 1, i: '💡', n: '排除法', d: '选择题去掉 1 个错的选项' },
  { lv: 2, i: '🔍', n: '小提示', d: '先看讲解的第一句话' },
  { lv: 3, i: '🛡️', n: '护盾', d: '这一题答错了可以再答一次' },
  { lv: 4, i: '❤️', n: '樱之心', d: '斩鬼战多 1 颗心（最终奖励）' },
]
const petIdx = () => S.petLv
const petNow = () => PET[S.petLv]
const petNext = () => PET[S.petLv + 1]
// 第九版：本领每种每周只能用 1 次，用了不掉级，但这周就没有了（下周小樱从 0 级重新升）
const skillUsed = lv => { ensureWeek(); return (S.week.used || []).includes(lv) }
const hasSkill = lv => S.petLv >= lv && !skillUsed(lv)
function useSkill(lv) {
  ensureWeek(); (S.week.used || (S.week.used = [])).push(lv); save()
}
function addXp(n) { S.xp += n; return null }
function levelUp() {
  if (S.petLv >= 4) return
  const c = LV_COST[S.petLv]
  if (S.coins < c) { SFX.bad(); toast(`金币不够啦，升级要 ${c} 💰`); return }
  doLevelUp()
}
function doLevelUp() {
  const c = LV_COST[S.petLv]
  if (S.petLv >= 4 || S.coins < c) return
  S.coins -= c; S.petLv++; S.maxLv = Math.max(S.maxLv, S.petLv); SFX.coin()
  const bg = checkBadges(); save(); render(); showEvolve(petNow()); badgeFx(bg, 300)
}

// ---------------- 商店：头饰 / 公主裙 / 鞋子（定义在 princess.js） ----------------
const SHOP = { hat: HATS, dress: DRESSES, shoes: SHOES }
const ALL_ITEMS = () => HATS.concat(DRESSES, SHOES)
const allOwned = () => ALL_ITEMS().every(a => S.owned.includes(a.id))
// 每天答题金币有上限
function earn(n) {
  if (S.coinDay.date !== today()) S.coinDay = { date: today(), n: 0 }
  const g = Math.max(0, Math.min(n, COIN.dayCap - S.coinDay.n))
  S.coinDay.n += g; addCoins(g)
  return g
}
const coinLeft = () => (S.coinDay.date === today() ? COIN.dayCap - S.coinDay.n : COIN.dayCap)
const dressNow = () => DRESSES.find(d => d.id === S.dress)
const patCls = () => (dressNow() ? `pat-${dressNow().pat}` : '') // 穿上公主裙，首页横幅和斩鬼战也换成同款花纹
const myPrincess = (size, extra) => princessSvg(Object.assign({ lv: S.petLv, hat: S.hat, dress: S.dress, shoes: S.shoes }, extra || {}), size)

// ---------------- 斩鬼：每个单元的 Boss 是一只鬼 ----------------
const ONI = [
  { n: '百面鬼', f: '👺', say: '我有一百张脸，你看得清我吗？' },
  { n: '乱序鬼', f: '👹', say: '先加还是先乘？我偏要乱着来！' },
  { n: '伸缩鬼', f: '👹', say: '我的手臂能伸到一千米那么长！' },
  { n: '千斤鬼', f: '👹', say: '我重得像大象，谁也称不动我！' },
  { n: '分身鬼', f: '👺', say: '我能变出好多好多分身！' },
  { n: '密码鬼', f: '👹', say: '猜不出我的密码，就别想过去！' },
  { n: '折角鬼', f: '👺', say: '我的角又尖又钝，小心被戳到！' },
  { n: '碎片鬼', f: '👹', say: '我把月亮切成了一块块碎片！' },
  { n: '鬼王', f: '👹', say: '终于来了，小剑士。这是最后的考验！' },
]
// 称号：每打败一只鬼升一级（孩子一看就懂）
const RANKS = [
  { n: '小小新手', s: '新手' }, { n: '木剑剑士', s: '木剑' }, { n: '竹剑剑士', s: '竹剑' }, { n: '铁剑剑士', s: '铁剑' }, { n: '铜剑剑士', s: '铜剑' },
  { n: '银剑剑士', s: '银剑' }, { n: '金剑剑士', s: '金剑' }, { n: '宝石剑士', s: '宝石' }, { n: '闪电剑士', s: '闪电' }, { n: '斩鬼大英雄', s: '英雄' },
]
const RANK_TOP = { n: '无敌大英雄', s: '无敌' } // 全部 36 关都拿到⭐
const BOSS_WINS = () => UNITS.filter((_, u) => (S.stars[lvId(u, 3)] || 0) > 0).length
const rankObj = () => (UNITS.every((_, u) => [0, 1, 2, 3].every(l => S.stars[lvId(u, l)])) ? RANK_TOP : RANKS[BOSS_WINS()])
const rankNow = () => rankObj().n
const SKILL_NAME = c => (c >= 10 ? '旭日斩' : c >= 7 ? '雷光一闪' : c >= 5 ? '烈焰斩' : c >= 3 ? '流水斩' : '斩！')

// ============================================================
//  每周挑战：每周一换一批任务，完成领金币，全部完成开宝箱
// ============================================================
const WEEK_POOL = [
  { id: 'correct', i: '✅', n: '答对 100 道题', goal: 100 },
  { id: 'hard', i: '💪', n: '答对 25 道难题', goal: 25 },
  { id: 'star3', i: '⭐', n: '拿到 5 次⭐（全对过关，重玩也算）', goal: 5 },
  { id: 'boss', i: '⚔️', n: '斩鬼 2 次（同一只鬼也算）', goal: 2 },
  { id: 'test80', i: '📝', n: '小测验满分 1 次', goal: 1 },
  { id: 'days', i: '📅', n: '这周有 4 天来练习', goal: 4 },
  { id: 'mastered', i: '🎯', n: '消灭 3 道错题', goal: 3 },
  { id: 'units3', i: '🗺️', n: '在 3 个不同单元拿到⭐', goal: 3 },
  { id: 'run', i: '🔥', n: '连续答对 25 题（中间不能错，跨关也算）', goal: 25 },
  { id: 'fig', i: '🖼️', n: '答对 20 道看图题', goal: 20 },
].map(t => Object.assign(t, { coin: COIN.weekTask }))
// 第八版换掉的旧任务 → 新任务（本周已经抽到的旧任务原地换掉，已领的奖励不会再领一次）
const WEEK_RENAME = { combo: 'units3', perfect: 'run', levelup: 'fig' }
const CHEST_COIN = COIN.chest
function mondayOf(d = new Date()) { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m }
function seeded(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 } }
function ensureWeek() {
  const mon = mondayOf(), id = dayKey(mon)
  if (S.week && S.week.id === id) {
    const W = S.week, fix = x => WEEK_RENAME[x] || x
    if (W.tasks.some(x => WEEK_RENAME[x])) { W.tasks = W.tasks.map(fix); W.claimed = W.claimed.map(fix) }
    return
  }
  if (S.week) {
    S.weekHist.push({ id: S.week.id, done: S.week.claimed.length, chest: S.week.chest, earned: S.week.earned || 0, left: S.coins, bg: (S.week.bg || []).length, stars: totalStars(), boss: BOSS_WINS(), wallet: S.walletLog.some(x => x.week === S.week.id) })
    if (S.weekHist.length > 20) S.weekHist.shift()
    weekRestart()
    S.weekNotice = true // 打开首页时告诉孩子：新的一周开始啦
  }
  const rnd = seeded(mon.getFullYear() * 400 + mon.getMonth() * 32 + mon.getDate())
  const ids = WEEK_POOL.map(t => t.id).map(x => [rnd(), x]).sort((a, b) => a[0] - b[0]).slice(0, 6).map(x => x[1])
  S.week = { id, tasks: ids, c: {}, days: [], claimed: [], chest: false, earned: 0 }
}
// 新的一周，一切重新开始（错题本、测验记录、设置不清）：
// 金币、关卡⭐和解锁、打败的鬼和称号、小樱等级和本领、商店装扮、每周任务、徽章，全部从头来
function weekRestart() {
  S.coins = 0
  S.stars = {}
  S.petLv = 0; S.maxLv = 0
  S.owned = []; S.hat = ''; S.dress = ''; S.shoes = ''
  S.perfStreak = 0
}
// 所有赚到的金币都走这里，顺便记下“本周一共赚了多少”
function addCoins(n) { ensureWeek(); S.coins += n; S.week.earned = (S.week.earned || 0) + n }
function wk(id, n = 1, max) {
  ensureWeek()
  const c = S.week.c
  c[id] = max ? Math.max(c[id] || 0, n) : (c[id] || 0) + n
}
function wkDay() { ensureWeek(); if (!S.week.days.includes(today())) S.week.days.push(today()); S.week.c.days = S.week.days.length }
const wkVal = id => Math.min((S.week.c[id] || 0), WEEK_POOL.find(t => t.id === id).goal)
const wkDone = id => wkVal(id) >= WEEK_POOL.find(t => t.id === id).goal
const wkReady = () => { ensureWeek(); return S.week.tasks.filter(id => wkDone(id) && !S.week.claimed.includes(id)).length }

// ---------------- 成就徽章：每周一全部重新点亮，奖励每周都能领 ----------------
// 所有数都只算“这一周”的（数据都在 S.week.c 里，新的一周自动清零）
const wc = id => (S.week && S.week.c[id]) || 0
const bestTest = () => S.tests.reduce((m, t) => Math.max(m, t.score), -1)
const BADGES = [
  { id: 'first', i: '🎉', n: '出发啦', d: '本周第一次全对过关', g: 1, v: () => wc('star3') },
  { id: 'c5', i: '🔥', n: '小火苗', d: '连续答对20题（跨关也算）', g: 20, v: () => wc('run') },
  { id: 'c10', i: '⚡', n: '闪电手', d: '连续答对50题（跨关也算）', g: 50, v: () => wc('run') },
  { id: 'h20', i: '💪', n: '难题克星', d: '本周答对20道难题', g: 20, v: () => wc('hard') },
  { id: 's5', i: '⭐', n: '摘星星', d: '本周拿到5次⭐', g: 5, v: () => wc('star3') },
  { id: 's15', i: '🏅', n: '星星达人', d: '本周拿到15次⭐', g: 15, v: () => wc('star3') },
  { id: 'u4', i: '🗺️', n: '全能小学霸', d: '本周在4个不同单元拿到⭐', g: 4, v: () => wc('units3') },
  { id: 'b1', i: '⚔️', n: '斩鬼新手', d: '本周斩鬼1次', g: 1, v: () => wc('boss') },
  { id: 'b3', i: '🛡️', n: '勇敢的剑士', d: '本周斩鬼3次', g: 3, v: () => wc('boss') },
  { id: 'b6', i: '🏆', n: '斩鬼大师', d: '本周斩鬼6次', g: 6, v: () => wc('boss') },
  { id: 't90', i: '🧠', n: '聪明的薇薇', d: '本周小测验得90分以上', g: 1, v: () => wc('tbest') >= 90 ? 1 : 0 },
  { id: 't100', i: '💎', n: '无敌的薇薇', d: '本周小测验得100分', g: 1, v: () => wc('test80') },
  { id: 'tt', i: '🥇', n: '双百勇士', d: '本周小测验连续2次满分', g: 1, v: () => S.week && S.week.streak ? 1 : 0 },
  { id: 'q100', i: '💯', n: '百题勇士', d: '本周答对100题', g: 100, v: () => wc('correct') },
  { id: 'q250', i: '🎓', n: '数学博士', d: '本周答对250题', g: 250, v: () => wc('correct') },
  { id: 'fig', i: '🖼️', n: '看图高手', d: '本周答对30道看图题', g: 30, v: () => wc('fig') },
  { id: 'fix', i: '🎯', n: '错题克星', d: '本周消灭5道错题', g: 5, v: () => wc('mastered') },
  { id: 'day5', i: '🌞', n: '每日之星', d: '本周领5次今日任务奖励', g: 5, v: () => wc('daily') },
  { id: 'd7', i: '🗓️', n: '一周不断', d: '本周7天都来练习', g: 7, v: () => wc('days') },
  { id: 'chest', i: '🎁', n: '周冠军', d: '打开本周宝箱', g: 1, v: () => S.week && S.week.chest ? 1 : 0 },
  { id: 'pet', i: '👸', n: '樱花公主', d: '本周把小樱升满4级', g: 1, v: () => S.petLv >= 4 ? 1 : 0 },
]
const wBadges = () => { ensureWeek(); return S.week.bg || (S.week.bg = []) }
function checkBadges() {
  const got = [], have = wBadges()
  for (const b of BADGES) if (!have.includes(b.id) && b.v() >= b.g) { have.push(b.id); got.push(b) }
  return got
}
// 集徽章领奖励（BADGE_RW 在最上面）：本周集到一定数量可以领金币，每周都能再领
const wBadgeRw = () => { ensureWeek(); return S.week.brw || (S.week.brw = []) }
const badgeRwReady = () => BADGE_RW.filter(r => wBadges().length >= r.n && !wBadgeRw().includes(r.n)).length
function claimBadgeRw(n) {
  const r = BADGE_RW.find(x => x.n === n), rw = wBadgeRw()
  if (!r || wBadges().length < n || rw.includes(n)) return
  rw.push(n); addCoins(r.coin); SFX.coin(); save(); renderWeek()
  celebrate('🎖️', `集齐 ${n} 个徽章！`, `奖励 ${r.coin} 💰`)
}
// 拿到新徽章的庆祝特效（几个会排队播），如果够数了再提醒去领奖励
function badgeFx(list, wait = 0) {
  if (!list.length) return
  setTimeout(() => {
    list.forEach(b => celebrate(b.i, '获得新徽章！', `${b.n}：${b.d}`))
    if (badgeRwReady()) celebrate('🎁', '徽章奖励可以领啦！', '去「每周挑战」页面下面领金币')
  }, wait)
}

// ============================================================
//  页面
// ============================================================
let tab = 'map'
function go(t) {
  stopTimer(); G = null; tab = t; setTheme(''); Music.play('calm'); render(); window.scrollTo(0, 0)
}
function render() {
  ensureDaily(); ensureWeek()
  if (G) return
  if (tab === 'map') renderMap()
  else if (tab === 'test') renderTestSetup()
  else if (tab === 'wrong') renderWrong()
  else if (tab === 'week') renderWeek()
  else if (tab === 'shop') renderShop()
}
function topbar(title) {
  const n = S.wrong.length
  return `<div class="topbar"><div class="title">${title}</div>
    <span class="chip" id="coinChip">💰 ${S.coins}</span>
    <span class="chip" title="连续天数">🔥 ${S.streak}天</span>
    <button class="chip wrongchip ${n ? 'has' : ''}" onclick="go('wrong')">📕 错题 ${n}</button>
    <button class="chip helpchip" onclick="showHelp()">📖 说明</button></div>`
}
function nav() {
  const n = S.wrong.length, r = wkReady() + badgeRwReady(), b = (t, i, name, extra = '') => `<button class="${tab === t ? 'on' : ''}" onclick="go('${t}')"><b>${i}</b>${name}${extra}</button>`
  return `<div class="nav">${b('map', '🗺️', '闯关')}${b('test', '📝', '小测验')}${b('wrong', '📕', '错题本', n ? `<span class="badge">${n}</span>` : '')}${b('week', '🏆', '每周挑战', r ? `<span class="badge">${r}</span>` : '')}</div>`
}
function soundLinks() {
  return `<div class="small" style="text-align:center;margin:18px 0">
    <a href="javascript:toggleMusic()" class="lnk">${S.music ? '🎵 音乐：开' : '🎵 音乐：关'}</a>
    <a href="javascript:toggleSound()" class="lnk">${S.sound ? '🔊 音效：开' : '🔇 音效：关'}</a>
    ${DEMO ? `<a href="javascript:toggleUnlock()" class="lnk">${S.unlockAll ? '🔓 全部解锁：开' : '🔒 全部解锁：关'}</a>` : ''}<br>${DEMO ? '<a href="./" class="lnk">← 回到正常模式</a>' : '<a href="?demo=1" class="lnk">🔒 家长模式</a>'}<br>人教版三年级上册数学（新版教材）</div>`
}

// ---------------- 首页地图 ----------------
// 每一关要全部答对（拿到⭐）才能解锁下一关
function unlocked(u, l) { return S.unlockAll || l === 0 || (S.stars[lvId(u, l - 1)] || 0) > 0 }
function toggleUnlock() { S.unlockAll = !S.unlockAll; save(); SFX.tap(); toast(S.unlockAll ? '🔓 全部关卡已解锁' : '🔒 恢复成：过一关才解锁下一关'); render() }
function petCard() {
  const p = petNow(), nx = petNext(), k = S.petLv
  const sk = SKILLS.map(s => `<span class="sk ${k >= s.lv ? (skillUsed(s.lv) ? 'used' : 'on') : ''}" title="${s.d}">${s.i}${s.n}${k >= s.lv && skillUsed(s.lv) ? '·本周用过' : ''}</span>`).join('')
  return `<div class="card pet"><div class="face pface" id="petFace" onclick="petTap()">${myPrincess(84)}</div>
      <div class="info"><div class="name">${esc(S.petName)} <span class="small">· ${p.stage} · ${k}/4 级</span></div>
        <div class="say" id="petSay">${pickSay(p)}</div><div class="lvdots">${[1, 2, 3, 4].map(i => `<i class="${i <= k ? 'on' : ''}"></i>`).join('')}</div>
        <div class="small">${nx ? `下一级学会：${SKILLS[k].i}${SKILLS[k].n}（${SKILLS[k].d}）` : '满级啦！'}<br>本领每种<b>每周只能用 1 次</b>，用了就没有了，下周小樱从 0 级重新升</div>
        <div class="lvwarn">⚠️ 小樱升满 4 级是买👛爸爸的钱包的条件之一，每周一回到 0 级</div>
        <div class="skills">${sk}</div></div>
      <div class="petbtns">${nx ? `<button class="btn gold sm" onclick="levelUp()">升级<br>${LV_COST[k]}💰</button>` : '<span class="small">已满级</span>'}<button class="btn sm shopbtn" onclick="go('shop')">🛍️商店</button></div></div>`
}
function renderMap() {
  const d = S.daily
  ensureWeek()
  if (S.weekNotice) {
    S.weekNotice = false; save()
    const L = S.weekHist[S.weekHist.length - 1]
    celebrate('🌅', '新的一周开始啦！', `关卡、小樱、装扮、徽章、金币都重新开始<br>${L ? `上周：${L.stars || 0} 颗⭐ · 斩鬼 ${L.boss || 0} 只 · 点亮 ${L.bg || 0} 个徽章${L.wallet ? ' · 拿到了👛钱包' : ''}<br>` : ''}这周也冲着👛爸爸的钱包加油！`, 5000)
  }
  let h = topbar('📘 三年级数学上')
  h += `<div class="datebar">📅 ${dateCN()}</div>`
  h += `<div class="cheer ${patCls()}" onclick="SFX.good(3)"><div class="cheer-in">💪 <span>薇薇加油！</span> 💪</div></div>`
  h += `<div class="card slayer ${patCls()}" onclick="go('week')"><div class="sl-in"><span class="sl-ic">⚔️</span><div class="info"><b>斩鬼剑士 · 薇薇</b><div class="small">称号「${rankNow()}」· 已斩鬼 ${BOSS_WINS()}/9 · 每打败一只鬼，称号升一级</div></div><span class="sl-rank">${rankObj().s}</span></div></div>`
  h += petCard()
  const done = S.week.tasks.filter(wkDone).length
  h += `<div class="card daily"><div class="ic">${d.claimed ? '✅' : '🎁'}</div>
      <div class="info"><b>今日任务：答对 ${DAILY_GOAL} 题</b>
        <div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, d.correct / DAILY_GOAL * 100)}%;background:linear-gradient(90deg,#5ce1a0,#2bb673)"></i></div>
        <div class="small">${Math.min(d.correct, DAILY_GOAL)}/${DAILY_GOAL}　完成可领 ${COIN.daily} 金币 · 今天答题还能赚 ${coinLeft()}/${COIN.dayCap} 💰</div></div>
      ${d.claimed ? '<span class="small">已领取</span>' : `<button class="btn green sm" ${d.correct >= DAILY_GOAL ? '' : 'disabled'} onclick="claimDaily()">领取</button>`}</div>`
  h += `<div class="card testcard weekcard" onclick="go('week')"><div class="ic">🏆</div><div class="info"><b>本周挑战 ${done}/6</b><div class="small">每个任务 ${COIN.weekTask}💰，6 个全完成开宝箱（${CHEST_COIN}💰）${wkReady() ? `<br><b style="color:#e8505b">有 ${wkReady()} 个奖励可以领！</b>` : ''}</div></div><span class="btn sm">去看看</span></div>`
  const bt = bestTest()
  h += `<div class="card testcard" onclick="go('test')"><div class="ic">📝</div><div class="info"><b>综合小测验</b><div class="small">${TEST_MID + TEST_HARD}题 · ${TEST_MIN}分钟 · 每天 ${TEST_PER_DAY} 次 · 连续 2 次满分奖 ${COIN.testStreak}💰${bt >= 0 ? `<br>最好成绩：${bt}分` : ''}</div></div><span class="btn sm">去测验</span></div>`
  let firstNext = null
  UNITS.forEach((U, u) => {
    const got = [0, 1, 2, 3].reduce((a, l) => a + (S.stars[lvId(u, l)] || 0), 0)
    h += `<div class="unit"><div class="head" style="background:${U.color}"><span>${U.icon}</span><span><span class="no">${U.label}</span><br>${U.name}</span><span class="prog">⭐ ${got}/4</span></div><div class="nodes">`
    for (let l = 0; l < 4; l++) {
      const st = S.stars[lvId(u, l)] || 0, open = unlocked(u, l), boss = l === 3, isNext = open && st === 0 && !firstNext
      if (isNext) firstNext = 1
      h += `<div class="node ${boss ? 'boss' : ''} ${open ? '' : 'lock'} ${isNext ? 'next' : ''}" ${isNext ? 'id="nextNode"' : ''}>
        <button class="dot" style="background:${U.color}" onclick="tapNode(${u},${l})">${boss ? `<span class="oface ${open ? '' : 'locked'}">${ONI[u].f}</span>${open ? '' : '<span class="lockb">🔒</span>'}` : open ? l + 1 : '🔒'}${open && boss ? `<span class="bchance ${bossLeft(u) ? '' : 'none'}">${bossLeft(u)}/${BOSS_PER_DAY}</span>` : ''}</button>
        <div class="lbl">${boss ? ONI[u].n : LV_NAMES[l]}</div><div class="stars">${open ? starStr(st) : ''}</div></div>`
    }
    h += '</div></div>'
  })
  $app.innerHTML = h + soundLinks() + nav()
}
function pickSay(p) { return p.say[Math.floor(Math.random() * p.say.length)] }
function petTap() {
  const f = document.getElementById('petFace'); if (!f) return
  f.classList.remove('jump'); void f.offsetWidth; f.classList.add('jump')
  document.getElementById('petSay').textContent = pickSay(petNow()); SFX.tap()
}
function claimDaily() {
  if (S.daily.claimed || S.daily.correct < DAILY_GOAL) return
  S.daily.claimed = true; addCoins(COIN.daily); wk('daily'); const bg = checkBadges(); save()
  celebrate('🎁', '今日任务完成！', `奖励 ${COIN.daily} 💰，明天继续加油！`); renderMap(); badgeFx(bg)
}
function tapNode(u, l) {
  if (!unlocked(u, l)) { SFX.bad(); toast('🔒 先通过前一关才能解锁哦'); return }
  SFX.tap()
  if (l === 3) {
    const o = ONI[u], extra = hasSkill(4), left = bossLeft(u)
    const dots = Array.from({ length: BOSS_PER_DAY }, (_, i) => `<i class="${i < left ? 'on' : ''}">⚔️</i>`).join('')
    modal(`<div class="oni-wrap"><div class="oni-intro ${patCls()}"><div class="oni-big">${o.f}</div></div>
      <div class="oni-chance ${left ? '' : 'none'}">${left ? `今天还能斩 <b>${left}</b> 次` : '今天的机会用完了'}<span>${dots}</span></div></div>
      <h3>斩鬼战：${o.n}</h3><p class="oni-say">“${o.say}”</p>
      <p>一共12题（4道难题），你只有 <b>1 颗❤️</b>${extra ? '<br>👸 樱花公主多送你 1 颗心（这周只能用 1 次）' : ''}<br>答错一题就输了，要非常仔细哦！<br>赢了金币翻倍，称号升一级！<br><b class="oni-rule">⚠️ 每只鬼每天只能斩 ${BOSS_PER_DAY} 次</b></p>
      <div class="row"><button class="btn ghost" onclick="closeModal()">再想想</button>${left ? `<button class="btn red" onclick="closeModal();startLevel(${u},3)">⚔️ 出发斩鬼！</button>` : '<button class="btn" disabled>明天再来</button>'}</div>`)
  } else startLevel(u, l)
}
function modal(html) {
  closeModal()
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal'
  bg.innerHTML = `<div class="modal">${html}</div>`; document.body.appendChild(bg)
}
function closeModal() { const m = document.getElementById('modal'); if (m) m.remove() }
function showEvolve(p) {
  const pic = princessSvg({ lv: PET.indexOf(p), hat: S.hat, dress: S.dress, shoes: S.shoes }, 140)
  celebrate(`<span class="cele-pic">${pic}</span>`, `${esc(S.petName)}升级了！`, `变成了「${p.stage}」`, 3000, () => {
    const sk = SKILLS.find(s => PET[s.lv] === p)
    modal(`<div class="evo-pic">${princessSvg({ lv: PET.indexOf(p), hat: S.hat, dress: S.dress, shoes: S.shoes }, 120)}</div><h3>${esc(S.petName)}升级了！</h3><p>变成了「${p.stage}」<br>${p.say[0]}</p>${sk ? `<div class="newbadge">学会新本领：${sk.i} ${sk.n}<br><span class="small">${sk.d}</span></div>` : ''}<button class="btn" onclick="closeModal()">太好了！</button>`)
  })
}

// ---------------- 商店 ----------------
function renderShop() {
  let h = topbar('🛍️ 商店')
  const n = ALL_ITEMS().filter(a => S.owned.includes(a.id)).length, wk0 = S.week ? S.week.id : '', boughtWk = S.walletLog.some(x => x.week === wk0)
  h += `<div class="card shop-top"><div class="pface big">${myPrincess(110)}</div><div class="small" style="font-size:13px;line-height:1.7">💡 一周最多赚 <b>${WEEK_MAX}💰</b>，正好够：买齐 12 样装扮 420 + 小樱升满 260 + 钱包 ${WALLET.p}。<br>⚠️ <b>每周一，装扮、小樱等级、金币全部清零</b>，要重新挣、重新买！</div></div>`
  const sec = [['hat', '👑 头饰', 'head'], ['dress', '👗 公主裙', ''], ['shoes', '👠 鞋子', 'feet']]
  sec.forEach(([kind, title, crop]) => {
    h += `<div class="h2">${title}</div><div class="shop">` + SHOP[kind].map(a => shopItem(a, kind, princessSvg({ lv: 0, hat: S.hat, dress: S.dress, shoes: S.shoes, [kind]: a.id }, crop ? 76 : 62, crop))).join('') + '</div>'
  })
  const earned = S.week.earned || 0, okEarn = earned >= WEEK_MAX, okPet = S.petLv >= 4, can = walletOk() && !boughtWk
  h += `<div class="h2">👛 超级大奖</div><div class="card wallet ${can ? '' : 'locked'}"><span class="wi">👛</span><div class="info"><b>${WALLET.n}</b>
    <div class="small">${boughtWk ? '这周已经买过啦，下周再来！' : '三个条件都做到才能买：'}</div>
    ${boughtWk ? '' : `<div class="wcond ${allOwned() ? 'ok' : ''}">${allOwned() ? '✅' : '⬜'} 12 样装扮全部买齐（${n}/12）</div>
    <div class="wcond ${okPet ? 'ok' : ''}">${okPet ? '✅' : '⬜'} 小樱升满 4 级（${S.petLv}/4）</div>
    <div class="wcond ${okEarn ? 'ok' : ''}">${okEarn ? '✅' : '⬜'} 本周赚满 ${WEEK_MAX}💰（${earned}/${WEEK_MAX}）<div class="small">每天拿满 + 周任务和宝箱 + 测验连续满分 + 21 个徽章奖励</div><div class="bar"><i style="width:${Math.min(100, earned / WEEK_MAX * 100)}%"></i></div></div>`}</div>
    <button class="btn sm ${can ? 'red' : ''}" ${can ? '' : 'disabled'} onclick="buyWallet()">${WALLET.p}💰</button></div>`
  if (S.walletLog.length) h += `<div class="small" style="text-align:center">已经兑换过：${S.walletLog.map(x => x.date).join('、')}</div>`
  $app.innerHTML = h + `<div style="text-align:center;margin:16px 0"><button class="btn ghost" onclick="go('map')">← 回到首页</button></div>` + nav()
}
// 买钱包的三个条件：装扮买齐 + 小樱满级 + 本周赚满 880（= 所有任务、宝箱、测验奖金、徽章奖励全拿到）
const walletOk = () => { ensureWeek(); return allOwned() && S.petLv >= 4 && (S.week.earned || 0) >= WEEK_MAX }
function buyWallet() {
  ensureWeek()
  if (!walletOk() || S.walletLog.some(x => x.week === S.week.id)) return
  if (S.coins < WALLET.p) { SFX.bad(); toast(`金币不够啦，还差 ${WALLET.p - S.coins} 💰`); return }
  const now = new Date()
  S.coins -= WALLET.p; S.walletLog.push({ week: S.week.id, date: `${dateCN(now)} ${timeStr(now)}` }); const bg = checkBadges(); save()
  renderShop(); showWallet(); badgeFx(bg, 300)
}
function showWallet() {
  const now = new Date()
  SFX.win(); confetti(100)
  modal(`<div class="ticket"><div class="t1">🎫 兑 换 券</div><div class="t2">👛 爸爸的钱包 · 20 元</div>
    <div class="t3">持券人：薇薇</div><div class="t3">${dateCN(now)} ${timeStr(now)}</div>
    <div class="t4">薇薇用一整周的努力赚到了这张券！<br>请爸爸兑现 20 元 💪</div>${DEMO ? '<div class="t5">（体验模式，不能兑换）</div>' : ''}</div>
    <p class="small">📸 截图发给爸爸吧</p><button class="btn" onclick="closeModal()">好的！</button>`)
}
function shopItem(a, kind, pic) {
  const own = S.owned.includes(a.id), on = S[kind] === a.id
  const btn = on ? `<button class="btn sm ghost" onclick="equip('${kind}','')">取下</button>` : own ? `<button class="btn sm green" onclick="equip('${kind}','${a.id}')">换上</button>` : `<button class="btn sm gold" onclick="buy('${kind}','${a.id}')">${a.p}💰</button>`
  return `<div class="item ${on ? 'on' : ''}">${pic}<div class="in">${a.n}</div>${btn}</div>`
}
function buy(kind, id) {
  const a = SHOP[kind].find(x => x.id === id)
  if (S.coins < a.p) { SFX.bad(); toast(`金币不够啦，还差 ${a.p - S.coins} 💰`); return }
  S.coins -= a.p; S.owned.push(id); S[kind] = id; SFX.coin()
  celebrate(`<span class="cele-pic">${myPrincess(130)}</span>`, `买到了「${a.n}」！`, '已经换上啦，真好看！'); badgeFx(checkBadges()); save(); renderShop()
}
function equip(kind, id) { S[kind] = id; SFX.tap(); save(); renderShop() }

// ============================================================
//  答题
// ============================================================
let G = null
function newGame(mode, qs, extra) {
  G = Object.assign({ mode, qs, i: 0, right: 0, combo: 0, maxCombo: 0, coins: 0, hearts: 0, locked: false, typed: '', rec: [], score: 0, shieldQ: -1 }, extra || {})
  renderQ()
}
// 斩鬼：每只鬼每天最多挑战 3 次（第1~3关不限）
const BOSS_PER_DAY = 3
function bossLeft(u) {
  if (!S.bossDay || S.bossDay.date !== today()) S.bossDay = { date: today(), n: {} }
  return Math.max(0, BOSS_PER_DAY - (S.bossDay.n[u] || 0))
}
function startLevel(u, l) {
  if (l === 3) {
    if (bossLeft(u) <= 0) { SFX.bad(); toast(`⚔️ ${ONI[u].n}今天已经斩过 ${BOSS_PER_DAY} 次啦<br>明天再来挑战吧！`); return }
    S.bossDay.n[u] = (S.bossDay.n[u] || 0) + 1; save()
    setTheme('boss')
    return oniIntro(u, () => beginLevel(u, l))   // 先播 5 秒开场动画
  }
  beginLevel(u, l)
}
function beginLevel(u, l) {
  const boss = l === 3
  setTheme(boss ? 'boss' : ''); Music.play(boss ? 'oni' : 'calm')
  const qs = makeLevel(u, l, new Set(S.recentQ))
  S.recentQ = S.recentQ.concat(qs.map(q => q.hid)).slice(-600); save()
  const extraHeart = boss && hasSkill(4), hearts = boss ? 1 + (extraHeart ? 1 : 0) : 0
  newGame('level', qs, { u, l, boss, hearts, maxHearts: hearts, extraHeart, hp: 100 })
}
function startWrong() {
  if (!S.wrong.length) return
  setTheme(''); Music.play('calm')
  newGame('wrong', shuffle(S.wrong).slice(0, 10).map(q => JSON.parse(JSON.stringify(q))))
}
function startDrill(h) {
  const w = S.wrong.find(x => x.hid === h)
  if (!w) return
  setTheme(''); Music.play('calm')
  const qs = similar(w, DRILL_N)
  if (qs.length < DRILL_N) { toast('这道题暂时出不了类似题'); return }
  newGame('drill', qs, { target: h })
}
function quitQuiz() {
  modal(`<div class="i">🤔</div><h3>要退出吗？</h3><p>${G && G.mode === 'test' ? '测验还没交卷，退出后这次成绩不算哦' : G && G.mode === 'drill' ? '专项训练要 5 题全做完才算哦' : '这一关的进度不会保存哦'}</p>
    <div class="row"><button class="btn ghost" onclick="closeModal();go(G && (G.mode === 'drill' || G.mode === 'wrong') ? 'wrong' : tab)">退出</button><button class="btn" onclick="closeModal()">继续答题</button></div>`)
}
const diffTag = q => {
  const hard = q.diff === 'hard'
  if (G.mode === 'test') return `<span class="tag ${hard ? 'hard' : 'mid'}">${hard ? '难题' : '中等'} · ${hard ? PT_HARD : PT_MID}分</span>`
  return `<span class="tag ${hard ? 'hard' : 'mid'}">${hard ? '💪 难题 · 金币×2' : '中等'}</span>`
}
function oniBar() {
  const o = ONI[G.u]
  return `<div class="oni-bar ${patCls()}"><span class="oni" id="oni">${o.f}</span><div class="oinfo"><b>${o.n}</b><div class="hp"><i id="hpBar" style="width:${G.hp}%"></i></div></div><span class="hearts" id="hearts">${heartsHtml()}</span></div>`
}
function renderQ() {
  const q = G.qs[G.i]
  G.locked = false; G.typed = ''
  const pct = G.i / G.qs.length * 100
  const title = G.mode === 'wrong' ? '📕 错题复习' : G.mode === 'drill' ? '🎯 专项训练' : G.mode === 'test' ? '📝 小测验' : `${UNITS[G.u].icon} ${G.boss ? '斩鬼战' : LV_NAMES[G.l]}`
  let h = `<div class="quiz-top"><button class="x" onclick="quitQuiz()">✕</button><div class="bar"><i style="width:${pct}%"></i></div>`
  if (G.mode === 'test') h += `<span class="timer" id="timer">⏱ --:--</span>`
  if (shieldReady()) h += `<span class="shieldon" title="护盾：这题答错可以再答一次">🛡️</span>`
  h += `<button class="x mus" onclick="toggleMusicQuiz()">${S.music ? '🎵' : '🔇'}</button></div>`
  if (G.boss) h += oniBar()
  h += `<div class="qmeta"><span>${title} · ${G.i + 1}/${G.qs.length}</span>${G.mode === 'test' ? `<span>${UNITS[q.unit] ? UNITS[q.unit].icon + ' ' + UNITS[q.unit].name : ''}</span>` : `<span class="combo" id="combo">${G.combo >= 2 ? `🔥${G.combo}连对` : ''}</span><span>💰 +${G.coins}</span>`}</div>`
  h += `<div class="qcard" id="qcard">${diffTag(q)}<div class="qtext ${q.q.length > 26 ? 'long' : ''}">${fmt(q.q)}</div>${q.type === 'clock' ? '' : (q.fig || '')}`
  h += BODY[q.type](q) + '</div>'
  if (G.mode === 'level') h += skillBarHtml(q)
  h += '<div id="peek"></div>'
  if (G.mode === 'test') h += `<div class="skip"><button onclick="skipQ()">这题不会，先跳过 →</button></div>`
  h += `<div class="feedback" id="fb"></div>`
  $app.innerHTML = h
  window.scrollTo(0, 0)
  if (INIT[q.type]) INIT[q.type](q)
  if (G.mode === 'test') updateTimer()
}
function useHint() {
  const q = G.qs[G.i]
  if (!hasSkill(1) || G.locked || q.type !== 'choice') return
  const bad = shuffle([...document.querySelectorAll('.opt')].filter(b => q.options[+b.dataset.k] !== q.answer && !b.disabled)).slice(0, 1)
  if (!bad.length) return
  bad.forEach(b => { b.classList.add('gone'); b.disabled = true })
  useSkill(1); SFX.shield(); toast(`${petNow().face} 去掉了 1 个错的！<br>💡 排除法这周用完啦`)
  refreshSkills()
}
function usePeek() {
  const q = G.qs[G.i]
  if (!hasSkill(2) || G.locked || !q.tip) return
  const first = String(q.tip).split(/[。；\n]/)[0]
  useSkill(2); SFX.tap()
  const p = document.getElementById('peek'); if (p) p.innerHTML = `<div class="peek">🔍 ${esc(first)}</div>`
  toast(`🔍 小提示这周用完啦`); refreshSkills()
}
function useShield() {
  if (!hasSkill(3) || G.locked) return
  G.shieldQ = G.i; useSkill(3); SFX.shield()
  toast(`🛡️ 护盾打开！这题答错可以再答一次<br>护盾这周用完啦`); refreshSkills()
}
// 用了本领后只刷新按钮（不重画题目，避免已经输入的内容丢失）
function refreshSkills() {
  save()
  const bar = document.querySelector('.skillbar'); if (bar) bar.remove()
  const pk = document.getElementById('peek')
  if (pk) pk.insertAdjacentHTML('beforebegin', skillBarHtml(G.qs[G.i]))
  const mus = document.querySelector('.quiz-top .mus')
  if (shieldReady() && !document.querySelector('.shieldon') && mus) mus.insertAdjacentHTML('beforebegin', '<span class="shieldon">🛡️</span>')
}
function skillBarHtml(q) {
  if (G.locked) return ''
  const b = []
  if (hasSkill(1) && q.type === 'choice' && q.options.length >= 3) b.push(`<button class="hintbtn" onclick="useHint()">💡 去掉1个错的</button>`)
  if (hasSkill(2) && q.tip && !document.querySelector('.peek')) b.push(`<button class="hintbtn" onclick="usePeek()">🔍 小提示</button>`)
  if (hasSkill(3) && !shieldReady()) b.push(`<button class="hintbtn" onclick="useShield()">🛡️ 开护盾</button>`)
  return b.length ? `<div class="skillbar"><div class="small">${petNow().face} 小樱的本领（每种每周只能用 1 次，要省着用）</div>${b.join('')}</div>` : ''
}
function toggleMusicQuiz() { S.music = !S.music; save(); if (S.music) { audio(); Music.play() } else Music.stop(); const b = document.querySelector('.mus'); if (b) b.textContent = S.music ? '🎵' : '🔇' }
const heartsHtml = () => Array.from({ length: G.maxHearts || 3 }, (_, i) => `<span class="${i < G.hearts ? '' : 'off'}">❤️</span>`).join('')
const padHtml = () => `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="key('${n}')">${n}</button>`).join('')}<button class="del" onclick="key('del')">⌫</button><button onclick="key('0')">0</button><button class="ok" onclick="key('ok')">✓</button></div>`

// ---------- 各种题型的界面 ----------
const BODY = {
  choice: q => `<div class="opts ${q.options.length === 3 ? 'three' : ''} ${q.wide ? 'one' : ''} ${q.html ? 'pics' : ''}">` + q.options.map((o, k) => `<button class="opt" data-k="${k}" onclick="pickOpt(${k})">${showA(q, o)}</button>`).join('') + '</div>',
  input: q => `<div class="answer-row"><div class="answer-box" id="abox">?</div>${q.suffix ? `<span class="unit">${esc(q.suffix)}</span>` : ''}</div>` + '</div>' + padHtml() + '<div>',
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
  const q = G.qs[G.i], vert = q.type === 'vertical', max = vert ? q.answer.length : Math.max(6, q.answer.length)
  SFX.tap()
  if (k === 'del') G.typed = G.typed.slice(0, -1)
  else if (k === 'ok') {
    if (!G.typed) return
    if (vert && G.typed.length < max) { toast('还有空格没填完哦'); return }
    const v = vert ? G.typed.split('').reverse().join('').replace(/^0+(?=\d)/, '') : G.typed
    submit(v === q.answer, v, vert ? null : document.getElementById('abox'))
    return
  } else if (G.typed.length < max) G.typed = (!vert && G.typed === '0' && !/^0/.test(q.answer) ? '' : G.typed) + k
  if (vert) {
    document.querySelectorAll('.vbox').forEach(b => { const r = +b.dataset.r; b.textContent = G.typed[r] || ''; b.classList.toggle('cur', r === G.typed.length) })
  } else document.getElementById('abox').textContent = G.typed || '?'
}
function pickOpt(k) {
  if (G.locked) return
  const q = G.qs[G.i], el = document.querySelector(`.opt[data-k="${k}"]`), ok = q.options[k] === q.answer
  if (G.mode === 'test') el.classList.add('chosen')
  else if (ok || !shieldReady()) document.querySelectorAll('.opt').forEach(b => {
    const o = q.options[+b.dataset.k]
    b.classList.add(o === q.answer ? 'right' : b === el ? 'wrong' : 'dim')
  })
  submit(ok, q.options[k], el)
}
function checkClock() {
  if (G.locked) return
  const q = G.qs[G.i], ok = G.cl.H % 12 === q.h % 12 && G.cl.m === q.m
  if (!ok && G.mode !== 'test' && !shieldReady()) {
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
    if (G.mode !== 'test' && !shieldReady()) q.items.forEach((x, k) => { if (x.ok && !G.popped.has(k)) document.querySelector(`[data-b="${k}"]`).classList.add('hint') })
    submit(false, `戳了「${it.t}」`, el)
  }
}
function skipQ() { if (!G.locked) submit(false, '（跳过）', null) }

// ---------- 斩鬼特效 ----------
function slashFx(combo) {
  const oni = document.getElementById('oni'), bar = document.querySelector('.oni-bar')
  if (!oni || !bar) return
  const r = bar.getBoundingClientRect()
  const s = document.createElement('div'); s.className = 'slash'
  s.style.left = r.left + 'px'; s.style.top = r.top + 'px'; s.style.width = r.width + 'px'; s.style.height = r.height + 'px'
  s.innerHTML = `<i></i><b>${SKILL_NAME(combo)}</b>`
  $fx.appendChild(s); setTimeout(() => s.remove(), 1100)
  oni.classList.remove('hurt'); void oni.offsetWidth; oni.classList.add('hurt')
  SFX.slash()
}
function oniAttack() {
  const f = document.createElement('div'); f.className = 'redflash'; $fx.appendChild(f); setTimeout(() => f.remove(), 500)
  const oni = document.getElementById('oni'); if (oni) { oni.classList.remove('atk'); void oni.offsetWidth; oni.classList.add('atk') }
  SFX.oniHit()
}

// ---------- 判分和反馈 ----------
const praiseList = c => c >= 5 ? ['太厉害了！', '停不下来！', '数学小天才！', '薇薇无敌！'] : c >= 3 ? ['真棒！', '越来越快了！', '漂亮！', '薇薇好厉害！'] : ['答对了！', '正确！', '好样的！']
const shieldReady = () => !!G && G.mode === 'level' && G.shieldQ === G.i
function submit(ok, given, el) {
  if (G.mode === 'test' && G.rec.length > G.i) return // 防止同一题交两次
  G.locked = true
  const q = G.qs[G.i], hard = q.diff === 'hard'
  ensureDaily(); checkIn(); wkDay()
  S.totalAns++
  if (ok) { S.totalCorrect++; S.daily.correct++; wk('correct'); if (hard) { S.hardCorrect++; wk('hard') } }
  // 每周任务：连续答对（跨关也算，错一题从 0 开始）、答对看图题
  S.week.run = ok ? (S.week.run || 0) + 1 : 0; wk('run', S.week.run, true)
  if (ok && (q.fig || q.type === 'clock')) wk('fig')
  // ---- 小测验：不马上告诉对错，像真正考试一样 ----
  if (G.mode === 'test') {
    G.rec.push({ q, ok, given })
    if (ok) { G.right++; G.score += hard ? PT_HARD : PT_MID; addXp(1); G.coins += earn(hard ? COIN.hard : COIN.mid) }
    SFX.tap(); save()
    setTimeout(() => { if (!G || G.mode !== 'test') return; G.i++; G.i >= G.qs.length ? finishTest('done') : renderQ() }, 350)
    return
  }
  const rect = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0 }
  if (q.type === 'input' && el) el.classList.add(ok ? 'right' : 'wrong')
  if (q.type === 'vertical') document.querySelectorAll('.vbox').forEach(b => b.classList.add(ok ? 'right' : 'wrong'))
  const fb = document.getElementById('fb')
  if (ok) {
    G.right++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo)
    S.bestCombo = Math.max(S.bestCombo, G.combo)
    let gain = earn(G.mode === 'wrong' || G.mode === 'drill' ? 1 : (hard ? COIN.hard : COIN.mid) * (G.boss ? 2 : 1))
    G.coins += gain
    const evo = addXp(1); if (evo) G.evo = evo
    SFX.good(G.combo); vibrate(15)
    if (G.boss) {
      G.hp = Math.max(0, G.hp - 100 / (G.qs.length - 2))
      slashFx(G.combo)
      const hb = document.getElementById('hpBar'); if (hb) hb.style.width = G.hp + '%'
    }
    floatText(gain ? `+${gain}💰` : '今日金币已满', rect.left + rect.width / 2, rect.top)
    const pl = praiseList(G.combo)
    fb.className = 'feedback good show'
    fb.innerHTML = `<div class="t">✅ ${G.boss ? SKILL_NAME(G.combo) + '！' : pl[Math.floor(Math.random() * pl.length)]} ${G.combo >= 2 ? `<span class="combo pop">🔥${G.combo}连对</span>` : ''}</div>`
    const c = document.getElementById('combo'); if (c) { c.textContent = G.combo >= 2 ? `🔥${G.combo}连对` : ''; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop') }
    setTimeout(next, G.combo >= 3 ? 800 : 1000)
  } else if (shieldReady()) {
    // ---- 小樱的护盾：这次不算错，再答一次 ----
    G.shieldQ = -1
    addWrong(q)
    SFX.shield(); vibrate(20)
    fb.className = 'feedback good show'
    fb.innerHTML = `<div class="t">🛡️ ${petNow().face} 护盾挡住了！不扣心、不断连对，再仔细想一想～</div>`
    setTimeout(() => { if (G && G.qs[G.i] === q) { const keep = { combo: G.combo }; renderQ(); G.combo = keep.combo } }, 1500)
  } else {
    G.combo = 0
    if (G.mode === 'level') addWrong(q)
    if (G.mode === 'wrong') bumpWrong(q)
    SFX.bad(); vibrate([40, 40, 40])
    const card = document.getElementById('qcard'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake')
    if (G.boss) { G.hearts--; if (G.extraHeart) { G.extraHeart = false; useSkill(4); setTimeout(() => toast(`👸 樱之心挡了一下！这周用完啦`), 600) } oniAttack(); const hs = document.getElementById('hearts'); hs.innerHTML = heartsHtml(); hs.classList.add('hit') }
    fb.className = 'feedback bad show'
    fb.innerHTML = `<div class="t">❌ 没关系，看看怎么做</div>
      ${given ? `<div class="yours">你的答案：${showA(q, given)}</div>` : ''}
      <div class="ans">✅ 正确答案：${showA(q, q.answerText || q.answer)}</div>
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

// ---------------- 错题本：待攻克 + 已消灭（历史记录）----------------
function addWrong(q) {
  const h = q.hid || qHash(qKey(q)), now = shortDate()
  const ex = S.wrong.find(w => w.hid === h)
  if (ex) { ex.cnt = (ex.cnt || 1) + 1; ex.last = now; return }
  S.wrongDone = S.wrongDone.filter(w => w.hid !== h) // 消灭过又错了，重新回到待攻克
  const w = JSON.parse(JSON.stringify(q)); w.hid = h; w.cnt = 1; w.first = now; w.last = now
  S.wrong.push(w)
  if (S.wrong.length > 120) S.wrong.shift()
}
function bumpWrong(q) { const w = S.wrong.find(x => x.hid === q.hid); if (w) { w.cnt = (w.cnt || 1) + 1; w.last = shortDate() } }
function masterWrong(h) {
  const w = S.wrong.find(x => x.hid === h)
  if (!w) return
  S.wrong = S.wrong.filter(x => x.hid !== h)
  w.done = shortDate(); S.wrongDone.push(w)
  if (S.wrongDone.length > 200) S.wrongDone.shift()
  S.fixed++; wk('mastered')
}

// ---------------- 闯关结算 ----------------
function finishLevel() {
  const n = G.qs.length, rate = G.right / n, now = new Date()
  let stars = 0, title, sub, rankUp = null
  const nl = G.mode !== 'level' ? null : G.l < 3 ? [G.u, G.l + 1] : G.u < UNITS.length - 1 ? [G.u + 1, 0] : null
  const wasOpen = nl ? unlocked(...nl) : true
  if (G.mode === 'level') {
    stars = G.boss ? (G.hearts > 0 ? 1 : 0) : rate === 1 ? 1 : 0 // 每关 1 颗星：全对（斩鬼赢了）才拿到
    const id = lvId(G.u, G.l), old = S.stars[id] || 0, r0 = rankNow()
    if (stars > old) S.stars[id] = stars
    if (stars) {
      wk('star3')
      const us = S.week.us || (S.week.us = []) // 这周在哪些单元拿过⭐
      if (!us.includes(G.u)) us.push(G.u)
      wk('units3', us.length, true)
    }
    if (G.boss && stars > 0) { wk('boss'); S.bossKills++ }
    if (rankNow() !== r0) rankUp = rankNow()
  }
  let drillOk = false
  if (G.mode === 'drill') { drillOk = G.right === n; if (drillOk) masterWrong(G.target) }
  const badges = checkBadges(); save()
  const pass = G.mode === 'wrong' || G.mode === 'drill' ? true : G.boss ? stars > 0 : G.right === n, perfect = G.mode === 'level' && G.right === n
  if (G.mode === 'wrong') { title = '复习完成！'; sub = `答对 ${G.right}/${n} 题<br><span class="small">想把错题消灭掉，要用 🎯 专项训练：类似的 ${DRILL_N} 题全对才算真正学会</span>` }
  else if (G.mode === 'drill') { title = drillOk ? '🎯 错题消灭！' : '还差一点点！'; sub = drillOk ? `${DRILL_N} 题全对，这道错题已经移到“已消灭”` : `答对 ${G.right}/${n} 题，要 ${DRILL_N} 题全对才能消灭它，再练一次吧！` }
  else if (!pass) { title = G.boss ? `${ONI[G.u].n}太强了…` : '差一点点！'; sub = G.boss ? '心用完了，再挑战一次吧！' : `答对 ${G.right}/${n} 题。<br>要<b>全部答对</b>，才能解锁下一关哦！再来一次吧！` }
  else { title = G.boss ? `斩鬼成功！${ONI[G.u].n}被打败了` : '完美通关！'; sub = `答对 ${G.right}/${n} 题` }
  if (perfect) { title = G.boss ? '斩鬼成功！全部答对！' : '薇薇真棒！'; sub = G.boss ? `${ONI[G.u].n}被打败了，${n} 题全对 🎉` : `满分！${n} 题全部答对 🎉` }
  setTheme(''); Music.play('calm')
  const bossWin = G.mode === 'level' && G.boss && pass, newOpen = !wasOpen && nl && unlocked(...nl), U0 = G.u
  // 结算页上的音效、烟花、惊喜特效（斩鬼胜利要等胜利动画播完再放）
  const effects = () => {
    pass && (G0.mode !== 'drill' || drillOk) ? (SFX.win(), confetti(stars || drillOk ? 110 : 60)) : SFX.lose()
    if (perfect && !bossWin) setTimeout(() => fireworks('薇薇真棒！', `满分！${n}题全对${newOpen && nl[1] < 3 && nl[0] === U0 ? ` · 🔓 第${nl[1] + 1}关解锁啦` : ''}`), 400)
    document.querySelectorAll('.bigstars span').forEach((s, i) => setTimeout(() => { s.classList.add('in'); if (i < stars) tone(784 + i * 200, 0, 0.15, 'triangle') }, 300 + i * 350))
    if (newOpen && nl[1] === 3) celebrate(`<span class="cele-oni">${ONI[U0].f}</span>`, '斩鬼关开启！', `${ONI[U0].n}出现了，你敢挑战吗？`)
    if (newOpen && nl[1] === 0) celebrate(UNITS[nl[0]].icon, '新单元解锁！', `${UNITS[nl[0]].label} ${UNITS[nl[0]].name}`)
    if (drillOk) celebrate('🎯', '错题消灭！', '又学会了一个本领，真厉害！')
    badgeFx(badges)
    if (evo) whenFree(() => showEvolve(evo), 600)
  }
  const G0 = G
  let h = `<div class="result"><div style="font-size:64px">${G.mode === 'drill' ? (drillOk ? '🎯' : '💪') : pass ? (G.boss ? '⚔️' : '🎉') : '💪'}</div><div class="big">${title}</div><div style="color:var(--sub)">${sub}</div>`
  h += `<div class="res-date">📅 ${dateCN(now)} ${timeStr(now)}</div>`
  if (G.mode === 'level') h += `<div class="bigstars"><span class="${stars ? '' : 'off'}">⭐</span></div>${stars ? '' : '<div class="small">全部答对才能拿到这颗⭐</div>'}`
  if (rankUp) h += `<div class="newbadge rankup">⚔️ 称号升级！你现在是「${rankUp}」</div>`
  h += `<div class="stats"><span class="chip">💰 +${G.coins}${coinLeft() ? '' : '（今日已满）'}</span><span class="chip">🔥 最高${G.maxCombo}连对</span></div>`
  badges.forEach(b => { h += `<div class="newbadge">🎖️ 获得新徽章：${b.i} ${b.n}（${b.d}）</div>` })
  if (wkReady()) h += `<div class="newbadge" onclick="go('week')" style="cursor:pointer">🏆 有每周挑战的奖励可以领啦！点这里去领</div>`
  h += '<div class="acts">'
  if (G.mode === 'level') {
    if (pass && nl && unlocked(...nl)) h += `<button class="btn green" onclick="startLevel(${nl[0]},${nl[1]})">下一关 →</button>`
    if (G.boss && bossLeft(G.u) <= 0) h += `<div class="small" style="width:100%;text-align:center">⚔️ 今天斩这只鬼的 ${BOSS_PER_DAY} 次机会用完了，明天再来！</div>`
    else h += `<button class="btn ${pass ? 'ghost' : ''}" onclick="startLevel(${G.u},${G.l})">${pass ? '再玩一次' : '再挑战一次'}${G.boss ? `（今天还剩 ${bossLeft(G.u)} 次）` : ''}</button>`
  } else if (G.mode === 'drill' && !drillOk) h += `<button class="btn" onclick="startDrill('${G.target}')">🎯 再练一次</button>`
  if (G.mode !== 'level') h += `<button class="btn ghost" onclick="go('wrong')">回到错题本</button>`
  h += `<button class="btn ghost" onclick="go('map')">回到首页</button></div></div>`
  const evo = G.evo
  G = null
  $app.innerHTML = h; window.scrollTo(0, 0)
  bossWin ? oniDefeat(U0, rankUp, effects) : effects()
}

// ============================================================
//  小测验
// ============================================================
function renderTestSetup() {
  const open = testOpen(), sel = testSel()
  let h = topbar('📝 小测验')
  h += `<div class="datebar">📅 ${dateCN()}</div>`
  h += `<div class="card"><b>📋 测验说明</b><div class="small" style="font-size:14px;line-height:1.7;margin-top:4px">
    · 一共 <b>${TEST_MID + TEST_HARD}</b> 题，限时 <b>${TEST_MIN} 分钟</b>，满分 <b>100 分</b><br>
    · 中等题 ${TEST_MID} 道，每道 ${PT_MID} 分；难题 ${TEST_HARD} 道，每道 ${PT_HARD} 分<br>
    · 像真正考试一样：做完才公布成绩，然后可以看每道错题的讲解<br>
    · 时间到了会自动交卷<br>
    · 每天最多测 <b>${TEST_PER_DAY} 次</b>；<b>连续 2 次满分</b>奖励 <b>${COIN.testStreak}💰</b>（每周能拿 1 次）</div></div>`
  ensureWeek()
  const left = testLeft()
  h += `<div class="card statrow"><div><b>${left}/${TEST_PER_DAY}</b><span>今天还能测</span></div><div><b>${S.perfStreak}/2</b><span>连续满分</span></div><div><b>${S.week.streak ? '已拿 ✔' : COIN.testStreak + '💰'}</b><span>本周满分奖金</span></div></div>`
  const need = testNeed(), many = open.length >= 3
  const tip = !open.length ? `🔒 小测验还没开放！<br>先去地图上<b>打败至少 1 只鬼</b>，打败了哪个单元的鬼，那个单元的题才能放进测验。`
    : !many ? `⚔️ 你已经打败了 <b>${open.length}</b> 只鬼，测验会考这 ${open.length} 个单元。<br>打败 3 只鬼以后，就可以自己挑单元啦（最少选 3 个）。`
    : `⚔️ 你已经打败了 <b>${open.length}</b> 只鬼。请选择要考的单元，<b>最少选 3 个</b>。<br>🔒 的单元要先打败那里的鬼。`
  h += `<div class="h2">要考的单元</div><div class="test-tip">${tip}</div>`
  if (many) h += `<div class="selbtns"><button class="btn sm ghost" onclick="selAll(true)">全选</button><button class="btn sm ghost" onclick="selAll(false)">全不选</button></div>`
  h += `<div class="ugrid">${UNITS.map((U, u) => { const ok = open.includes(u), on = sel.includes(u); return `<button class="usel ${on ? 'on' : ''} ${ok ? '' : 'lock'}" style="--c:${U.color}" onclick="selUnit(${u})"><span class="ck">${ok ? (on ? '✔' : '') : '🔒'}</span><span class="ui">${U.icon}</span><span class="un">${U.label}<br><b>${U.name}</b></span></button>` }).join('')}</div>`
  h += left <= 0 ? `<button class="btn big-start" disabled>今天已经测了 ${TEST_PER_DAY} 次，明天再来吧 🌙</button>`
    : !open.length ? `<button class="btn big-start" disabled>🔒 先打败 1 只鬼才能测验</button>`
    : sel.length < need ? `<button class="btn big-start" disabled>还要再选 ${need - sel.length} 个单元（最少 ${need} 个）</button>`
    : `<button class="btn big-start" onclick="startTest()">🚀 开始测验（${sel.length} 个单元）</button>`
  if (S.tests.length) {
    h += `<div class="h2">📜 历史成绩</div><div class="card hist">` + S.tests.slice().reverse().slice(0, 15).map(t =>
      `<div class="hrow"><span class="hd">${t.date}</span><span class="hs ${rating(t.score).cls}">${t.score}分</span><span class="ht">${rating(t.score).name}</span></div>`).join('') + '</div>'
  }
  $app.innerHTML = h + nav()
}
// 小测验只能考“已经打败了鬼”的单元；不到 3 个就全考，3 个以上自己选、最少 3 个
const testOpen = () => UNITS.map((_, u) => u).filter(u => (S.stars[lvId(u, 3)] || 0) > 0)
const testNeed = () => Math.min(3, testOpen().length)
function testSel() {
  const open = testOpen()
  if (open.length < 3) return open
  return (S.testUnits || []).filter(u => open.includes(u))
}
function selUnit(u) {
  const open = testOpen()
  if (!open.includes(u)) { SFX.bad(); toast(`🔒 先打败「${ONI[u].n}」<br>这个单元才能放进测验`); return }
  if (open.length < 3) { SFX.tap(); toast('打败 3 只鬼以后，才能自己挑单元哦'); return }
  const s = testSel(); s.includes(u) ? s.splice(s.indexOf(u), 1) : s.push(u); s.sort((a, b) => a - b); S.testUnits = s; save(); SFX.tap(); renderTestSetup()
}
function selAll(on) { S.testUnits = on ? testOpen() : []; save(); SFX.tap(); renderTestSetup() }
function rating(s) {
  if (s >= 100) return { name: '无敌的薇薇', icon: '👑', cls: 'r4', say: '满分！你就是数学小天才，谁也挡不住！' }
  if (s >= 90) return { name: '聪明的薇薇', icon: '🌟', cls: 'r3', say: '太棒了！离满分只差一点点，下次冲击无敌！' }
  if (s >= 60) return { name: '普通的薇薇', icon: '🙂', cls: 'r2', say: '及格啦！把错题弄懂，就能变成聪明的薇薇！' }
  return { name: '笨笨的薇薇', icon: '🐢', cls: 'r1', say: '没关系！认真看看错题讲解，下次一定会更好！' }
}
let timerId = null
function stopTimer() { clearInterval(timerId); timerId = null }
function testLeft() {
  const d = today()
  if (S.testDay.date !== d) S.testDay = { date: d, n: 0 }
  return Math.max(0, TEST_PER_DAY - S.testDay.n)
}
function startTest() {
  const units = testSel()
  if (!units.length || units.length < testNeed() || testLeft() <= 0) return
  S.testDay.n++
  setTheme('test'); Music.play('focus')
  const qs = makeSet(units, TEST_MID, TEST_HARD, { avoid: new Set(S.recentQ) })
  S.recentQ = S.recentQ.concat(qs.map(q => q.hid)).slice(-600); save()
  newGame('test', qs, { units: units.slice(), t0: Date.now(), deadline: Date.now() + TEST_MIN * 60000 })
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
  for (let i = g.rec.length; i < g.qs.length; i++) g.rec.push({ q: g.qs[i], ok: false, given: '（没来得及做）' })
  const used = Math.min(TEST_MIN * 60, Math.round((Date.now() - g.t0) / 1000))
  const rt = rating(g.score), now = new Date()
  const unitsTxt = g.units.length === UNITS.length ? '全部单元' : g.units.map(u => UNITS[u].name).join('、')
  S.tests.push({ date: `${now.getMonth() + 1}月${now.getDate()}日 ${timeStr(now)}`, score: g.score, units: g.units, used })
  if (S.tests.length > 50) S.tests.shift()
  g.rec.forEach(r => { if (!r.ok) addWrong(r.q) })
  if (g.score >= 100) wk('test80') // 每周任务：小测验满分 1 次
  wk('tbest', g.score, true) // 徽章：本周小测验最高分
  // 连续 2 次满分：每周奖 1 次
  let streakMsg = ''
  ensureWeek()
  if (g.score >= 100) {
    S.perfStreak++
    if (S.perfStreak >= 2) {
      S.perfStreak = 0
      if (!S.week.streak) { S.week.streak = true; addCoins(COIN.testStreak); streakMsg = `🔥 连续 2 次满分！奖励 ${COIN.testStreak}💰` }
      else streakMsg = '🔥 又连续 2 次满分！（这周的奖金已经拿过啦，下周再来）'
    } else streakMsg = `🔥 连续满分 ${S.perfStreak}/2，再满分 ${2 - S.perfStreak} 次有大奖！`
  } else S.perfStreak = 0
  const badges = checkBadges(); save()
  G = null; setTheme(''); Music.play('calm')
  const wrongs = g.rec.filter(r => !r.ok)
  let h = `<div class="result">${why === 'time' ? '<div class="small" style="margin-bottom:8px">⏰ 时间到，已自动交卷</div>' : ''}
    <div class="cert ${rt.cls}" id="cert">
      <div class="cert-date">📅 ${dateCN(now)} ${timeStr(now)}</div>
      <div class="cert-head">数学小测验 · 成绩单</div>
      <div class="cert-icon">${rt.icon}</div>
      <div class="cert-title">${rt.name}</div>
      <div class="cert-score"><b>${g.score}</b> 分</div>
      <div class="cert-info">考试范围：${unitsTxt}<br>答对 ${g.right}/${g.qs.length} 题 · 用时 ${Math.floor(used / 60)}分${used % 60}秒</div>
      <div class="cert-say">${rt.say}</div>
    </div>
    <div class="small">📸 可以截图保存这张成绩单哦　·　答对得 💰 ${g.coins} 金币</div>`
  if (streakMsg) h += `<div class="newbadge">${streakMsg}</div>`
  badges.forEach(b => { h += `<div class="newbadge">🎖️ 获得新徽章：${b.i} ${b.n}（${b.d}）</div>` })
  if (wrongs.length) {
    h += `<div class="h2" style="text-align:left">🔍 错题讲解（${wrongs.length} 道，已放进错题本）</div>`
    h += wrongs.map(r => `<div class="card review"><div class="rq"><span class="tag ${r.q.diff === 'hard' ? 'hard' : 'mid'}">${r.q.diff === 'hard' ? '难题' : '中等'}</span> ${fmt(r.q.q)}</div>
      ${r.q.fig && r.q.type !== 'clock' ? r.q.fig : r.q.type === 'clock' ? clockSvg(r.q.h, r.q.m) : ''}
      <div class="yours">你的答案：${showA(r.q, r.given || '—')}</div><div class="ans">✅ 正确答案：${showA(r.q, r.q.answerText || r.q.answer)}</div><div class="tip">${fmt(r.q.tip)}</div></div>`).join('')
  }
  h += `<div class="acts"><button class="btn green" onclick="go('test')">再测一次</button><button class="btn ghost" onclick="go('map')">回到首页</button></div></div>`
  $app.innerHTML = h; window.scrollTo(0, 0)
  if (g.score >= 100) { Music.stop(); setTimeout(() => thunderShow('无敌的薇薇', '⚡ 雷光一闪 · 小测验满分 100 分！', () => { if (S.music) Music.play('calm'); confetti(120) }), 300) }
  else if (g.score >= 90) { SFX.win(); confetti(110) }
  else if (g.score >= 60) { SFX.win(); confetti(50) }
  else SFX.lose()
  badgeFx(badges, 700) // 满分的雷光动画播完才会放
}

// ---------------- 错题本页面 ----------------
const TYPE_NAME = { choice: '选择', input: '填空', vertical: '竖式', clock: '拨钟', shade: '涂色', order: '排序', match: '连线', pop: '戳气球' }
let wrongTab = 'todo'
function setWrongTab(t) { wrongTab = t; SFX.tap(); renderWrong() }
function wItem(w, done) {
  const fig = w.type === 'clock' ? clockSvg(w.h, w.m) : ''
  return `<details class="w"><summary><span class="u">${UNITS[w.unit] ? UNITS[w.unit].icon : ''}</span><span>${fmt(w.q)}</span><span class="tt">${TYPE_NAME[w.type] || ''}</span></summary>
    <div class="wmeta">${done ? `✅ ${w.done} 消灭 · ` : ''}错过 ${w.cnt || 1} 次 · 第一次错在 ${w.first || '—'}${w.last && w.last !== w.first ? ` · 最近一次 ${w.last}` : ''}</div>
    ${w.fig && w.type !== 'clock' ? `<div class="wfig">${w.fig}</div>` : fig}
    <div class="ans">✅ 正确答案：${showA(w, w.answerText || w.answer)}</div><div class="tip">${fmt(w.tip || '')}</div>
    ${done ? '' : `<button class="btn sm drillbtn" onclick="startDrill('${w.hid}')">🎯 专项训练：类似的 ${DRILL_N} 题，全对就消灭它</button>`}</details>`
}
function renderWrong() {
  const todo = S.wrong, done = S.wrongDone
  let h = topbar('📕 错题本')
  h += `<div class="wtabs"><button class="${wrongTab === 'todo' ? 'on' : ''}" onclick="setWrongTab('todo')">😤 待攻克 ${todo.length}</button><button class="${wrongTab === 'done' ? 'on' : ''}" onclick="setWrongTab('done')">✅ 已消灭 ${done.length}</button></div>`
  if (wrongTab === 'todo') {
    if (!todo.length) h += `<div class="card empty"><div class="i">🌈</div>没有待攻克的错题，太棒了！<br>闯关和测验中答错的题会自动收到这里。</div>`
    else {
      h += `<div class="card" style="text-align:center"><div style="font-size:15px;margin-bottom:10px">有 <b style="color:var(--bad);font-size:22px">${todo.length}</b> 道题等薇薇来消灭<br><span class="small">点开一道题，用 🎯 专项训练：类似的 ${DRILL_N} 题全对，才算真正学会，它就会移到“已消灭”</span></div>
        <button class="btn ghost" style="width:100%;padding:12px;font-size:16px" onclick="startWrong()">📖 随便复习几道（不会消灭错题）</button></div><div class="card wlist">` +
        todo.slice().reverse().map(w => wItem(w, false)).join('') + '</div>'
    }
  } else {
    if (!done.length) h += `<div class="card empty"><div class="i">🎯</div>还没有消灭过错题。<br>在“待攻克”里点开错题，做专项训练吧！</div>`
    else h += `<div class="card small" style="text-align:center">一共消灭了 <b style="color:var(--good);font-size:20px">${done.length}</b> 道错题，这些都是薇薇学会的本领！</div><div class="card wlist">` + done.slice().reverse().map(w => wItem(w, true)).join('') + '</div>'
  }
  $app.innerHTML = h + nav()
}

// ---------------- 每周挑战 + 成就 ----------------
function renderWeek() {
  ensureWeek()
  const W = S.week, mon = mondayOf(), sun = new Date(mon); sun.setDate(sun.getDate() + 6)
  const left = Math.ceil((sun.getTime() + 86400000 - Date.now()) / 86400000)
  const done = W.tasks.filter(wkDone).length, allClaimed = W.claimed.length === W.tasks.length
  let h = topbar('🏆 每周挑战')
  h += `<div class="card weekhead"><b>${shortDate(mon)} ～ ${shortDate(sun)}</b><span class="small">还剩 ${left} 天 · 每周换新任务</span></div>`
  h += '<div class="card wtasks">' + W.tasks.map(id => {
    const t = WEEK_POOL.find(x => x.id === id), v = wkVal(id), ok = v >= t.goal, got = W.claimed.includes(id)
    return `<div class="wt ${got ? 'got' : ''}"><span class="wi">${t.i}</span><div class="info"><b>${t.n}</b><div class="bar"><i style="width:${v / t.goal * 100}%"></i></div><span class="small">${v}/${t.goal}</span></div>
      ${got ? '<span class="small">已领 ✔</span>' : `<button class="btn sm ${ok ? 'gold' : ''}" ${ok ? '' : 'disabled'} onclick="claimWeek('${id}')">${t.coin}💰</button>`}</div>`
  }).join('') + '</div>'
  h += `<div class="card chest ${W.chest ? 'opened' : allClaimed ? 'ready' : ''}"><div class="ci">${W.chest ? '🎊' : '🎁'}</div><div class="info"><b>本周宝箱</b><div class="small">${W.chest ? '这周的宝箱已经打开啦！下周还有新的' : `6 个任务奖励全部领完就能打开：${CHEST_COIN}💰（${W.claimed.length}/6）`}</div></div>
    ${W.chest ? '' : `<button class="btn ${allClaimed ? 'red' : ''}" ${allClaimed ? '' : 'disabled'} onclick="openChest()">开箱</button>`}</div>`
  const last = S.weekHist[S.weekHist.length - 1]
  if (last) h += `<div class="small" style="text-align:center;margin:-4px 0 8px">上周完成了 ${last.done}/6 个任务${last.chest ? '，打开了宝箱 🎊' : ''}${last.bg !== undefined ? `，点亮了 ${last.bg} 个徽章` : ''}</div>`
  const acc = S.totalAns ? Math.round(S.totalCorrect / S.totalAns * 100) : 0, bt = bestTest()
  h += `<div class="h2">📊 我的数据</div><div class="card statrow"><div><b>${S.totalCorrect}</b><span>答对题数</span></div><div><b>${acc}%</b><span>正确率</span></div><div><b>${S.bestCombo}</b><span>最高连对</span></div>
    <div><b>${totalStars()}</b><span>本周⭐ / 36</span></div><div><b>${BOSS_WINS()}</b><span>本周斩鬼 / 9</span></div><div><b>${bt >= 0 ? bt : '-'}</b><span>测验最高分</span></div></div>`
  const have = wBadges(), rw = wBadgeRw()
  h += `<div class="h2">🎖️ 本周徽章 ${have.length}/${BADGES.length}</div>`
  h += '<div class="card wtasks"><div class="small" style="margin-bottom:4px">徽章<b>每周一全部熄灭</b>，要重新点亮！本周集到下面的数量就能领金币，每周都能领。</div>' + BADGE_RW.map(r => {
    const v = Math.min(have.length, r.n), ok = v >= r.n, got = rw.includes(r.n)
    return `<div class="wt ${got ? 'got' : ''}"><span class="wi">🎖️</span><div class="info"><b>集到 ${r.n} 个徽章</b><div class="bar"><i style="width:${v / r.n * 100}%"></i></div><span class="small">${v}/${r.n}</span></div>
      ${got ? '<span class="small">已领 ✔</span>' : `<button class="btn sm ${ok ? 'gold' : ''}" ${ok ? '' : 'disabled'} onclick="claimBadgeRw(${r.n})">${r.coin}💰</button>`}</div>`
  }).join('') + '</div><div class="grid">' +
    BADGES.map(b => {
      const lit = have.includes(b.id), v = Math.min(b.v(), b.g)
      return `<div class="bd ${lit ? '' : 'lock'}"><div class="i">${b.i}</div><div class="n">${b.n}</div><div class="d">${b.d}</div>${!lit && b.g > 1 ? `<div class="d" style="color:#e8505b">${v}/${b.g}</div>` : ''}</div>`
    }).join('') + '</div>'
  $app.innerHTML = h + soundLinks() + nav()
}
function claimWeek(id) {
  const t = WEEK_POOL.find(x => x.id === id)
  if (!wkDone(id) || S.week.claimed.includes(id)) return
  S.week.claimed.push(id); addCoins(t.coin); SFX.coin()
  celebrate(t.i, '挑战任务完成！', `奖励 ${t.coin} 💰`); save(); renderWeek()
}
function openChest() {
  if (S.week.chest || S.week.claimed.length < S.week.tasks.length) return
  S.week.chest = true; addCoins(CHEST_COIN)
  const bg = checkBadges(); save(); SFX.win(); setTimeout(() => fireworks('宝箱打开啦！', `获得 ${CHEST_COIN} 金币`, 4000), 200); badgeFx(bg, 600)
  renderWeek()
}

// ---------------- 满分烟花 ----------------
// ---------------- 测验满分大招：原创 10 秒「雷光一闪」动画（程序画的，不用视频文件） ----------------
function thunderShow(title, sub, done) {
  const wrap = document.createElement('div'); wrap.className = 'fw thunder'
  wrap.innerHTML = `<canvas></canvas><div class="th-cap" id="thCap"></div><div class="th-text" id="thText"><b>${esc(title)}</b><small>${esc(sub || '')}</small><small class="fw-date">${dateCN()} ${timeStr()}</small></div><div class="fw-tip" id="thTip" style="opacity:0">点一下继续</div>`
  document.body.appendChild(wrap)
  const cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d'), cap = wrap.querySelector('#thCap')
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight
  cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr)
  const t0 = performance.now(), cy = H * 0.42, U = Math.min(W, H)
  const bolts = [], sparks = [], rain = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 9 + Math.random() * 8 }))
  let closed = false, flash = 0, shakeT = 0, fired = {}
  // 闪电：中点随机偏移
  function zig(x1, y1, x2, y2, d) {
    if (d < 6) return [[x1, y1], [x2, y2]]
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * d, my = (y1 + y2) / 2 + (Math.random() - 0.5) * d
    return zig(x1, y1, mx, my, d / 2).concat(zig(mx, my, x2, y2, d / 2).slice(1))
  }
  const addBolt = (x1, y1, x2, y2, w = 1, life = 500) => bolts.push({ p: zig(x1, y1, x2, y2, Math.hypot(x2 - x1, y2 - y1) * 0.25), w, born: performance.now(), life })
  const crack = (big) => { noise(0, 0.12, 0.9, 2600); noise(0.02, big ? 1.6 : 0.5, big ? 0.9 : 0.5, big ? 70 : 260); tone(big ? 55 : 90, 0, big ? 1.2 : 0.4, 'sawtooth', big ? 0.12 : 0.06) }
  const at = (ms, f) => { if (!fired[ms] && performance.now() - t0 >= ms) { fired[ms] = 1; f() } }
  // 冲刺路线：在屏幕上来回折线冲 6 次
  const dashPts = [[W * 0.12, cy + U * 0.1]]
  for (let i = 0; i < 6; i++) dashPts.push([W * (i % 2 ? 0.1 + Math.random() * 0.25 : 0.65 + Math.random() * 0.25), H * (0.18 + Math.random() * 0.5)])
  dashPts.push([W * 0.85, cy + U * 0.1])
  let hero = dashPts[0], cut = 0
  function close() {
    if (closed) return; closed = true; wrap.style.opacity = '0'; setTimeout(() => wrap.remove(), 600); if (done) done()
  }
  wrap.onclick = () => { if (performance.now() - t0 > 6200) close() }
  tone(40, 0, 1.6, 'sine', 0.15)
  function drawBolt(b, now) {
    const a = 1 - (now - b.born) / b.life; if (a <= 0) return false
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.beginPath(); b.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 30
    ctx.strokeStyle = `rgba(255,200,40,${0.45 * a})`; ctx.lineWidth = 16 * b.w; ctx.stroke()
    ctx.strokeStyle = `rgba(255,240,150,${0.9 * a})`; ctx.lineWidth = 6 * b.w; ctx.stroke()
    ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2.2 * b.w; ctx.stroke()
    ctx.restore(); return true
  }
  function emoji(ch, x, y, size, glow) {
    ctx.save(); ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 25 }
    ctx.fillText(ch, x, y); ctx.restore()
  }
  function frame(now) {
    if (closed) return
    const el = now - t0
    // ---- 时间线 ----
    at(500, () => { flash = 0.35; addBolt(W * 0.7, 0, W * 0.6, H * 0.35, 0.7, 300); crack(false) })
    at(300, () => { cap.textContent = '⚡ 屏住呼吸……'; cap.className = 'th-cap show' })
    at(1300, () => { cap.textContent = '⚡ 雷光一闪 ⚡'; cap.className = 'th-cap show big' })
    at(2400, () => { cap.className = 'th-cap' })
    for (let i = 0; i < dashPts.length - 1; i++) at(2500 + i * 330, () => {
      const [a, b] = [dashPts[i], dashPts[i + 1]]; addBolt(a[0], a[1], b[0], b[1], i === 0 ? 1.6 : 1.1, 1400); hero = b
      flash = i === 0 ? 1 : 0.45; shakeT = now + 250; crack(i === 0)
      for (let k = 0; k < 14; k++) sparks.push({ x: b[0], y: b[1], vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, l: 1 })
    })
    at(5100, () => { cut = now; flash = 1; shakeT = now + 600; crack(true); addBolt(W * 0.2, cy - U * 0.3, W * 0.8, cy + U * 0.25, 2, 1500) })
    at(6200, () => { document.getElementById('thText').classList.add('show'); SFX.win(); document.getElementById('thTip').style.opacity = 1 })
    if (el > 6400 && Math.random() < 0.06) { const x = Math.random() < 0.5 ? Math.random() * W * 0.2 : W * (0.8 + Math.random() * 0.2); addBolt(x, 0, x + (Math.random() - 0.5) * 80, H * (0.2 + Math.random() * 0.5), 0.6, 350); if (Math.random() < 0.4) tone(1800, 0, 0.05, 'square', 0.02) }
    if (el > 10000) return close()
    // ---- 画面 ----
    ctx.save()
    if (now < shakeT) ctx.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14)
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(8,10,30,0.35)'; ctx.fillRect(-20, -20, W + 40, H + 40)
    ctx.strokeStyle = 'rgba(160,180,255,0.35)'; ctx.lineWidth = 1
    rain.forEach(r => { r.y += r.v; r.x -= 2; if (r.y > H) { r.y = -20; r.x = Math.random() * W * 1.2 } ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 4, r.y - 16); ctx.stroke() })
    // 鬼：被斩之后裂成两半飞开
    if (el > 1300) {
      const ox = W * 0.5, oy = cy, sz = U * 0.42
      if (!cut) emoji('👹', ox + Math.sin(el / 90) * 2, oy, sz, '#ff3355')
      else {
        const k = Math.min(1, (now - cut) / 900), fade = Math.max(0, 1 - (now - cut) / 1400)
        ctx.save(); ctx.globalAlpha = fade
        ;[1, -1].forEach(s => {
          ctx.save(); ctx.beginPath()
          // 斜线一刀：上半 / 下半
          if (s > 0) { ctx.moveTo(-W, -H); ctx.lineTo(W * 2, -H); ctx.lineTo(W * 2, oy + sz * 0.1 + (W * 2 - ox) * 0.45); ctx.lineTo(-W, oy + sz * 0.1 - (ox + W) * 0.45) }
          else { ctx.moveTo(-W, H * 2); ctx.lineTo(W * 2, H * 2); ctx.lineTo(W * 2, oy + sz * 0.1 + (W * 2 - ox) * 0.45); ctx.lineTo(-W, oy + sz * 0.1 - (ox + W) * 0.45) }
          ctx.clip(); emoji('👹', ox - s * k * 60, oy - s * k * 50 + k * k * 120, sz, null); ctx.restore()
        })
        ctx.restore()
      }
    }
    ctx.globalCompositeOperation = 'lighter'
    for (let i = bolts.length - 1; i >= 0; i--) if (!drawBolt(bolts[i], now)) bolts.splice(i, 1)
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.l -= 0.03
      if (p.l <= 0) { sparks.splice(i, 1); continue }
      ctx.fillStyle = `rgba(255,230,120,${p.l})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 7); ctx.fill()
    }
    // 小剑士：蓄力时身边噼啪冒电
    if (el > 1300 && el < 6200) {
      if (el < 2500 && Math.random() < 0.5) { const [x, y] = hero, a = Math.random() * 7; addBolt(x, y, x + Math.cos(a) * U * 0.12, y + Math.sin(a) * U * 0.12, 0.35, 120); if (Math.random() < 0.3) tone(2400 + Math.random() * 800, 0, 0.03, 'square', 0.015) }
      ctx.globalCompositeOperation = 'source-over'
      emoji('🧒', hero[0], hero[1], U * 0.13, '#ffd84d'); emoji('🗡️', hero[0] + U * 0.07, hero[1] + U * 0.02, U * 0.08, '#fff')
    }
    ctx.restore()
    if (flash > 0) { ctx.fillStyle = `rgba(255,250,220,${flash})`; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - 0.08) }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
function fireworks(text, sub, ms = 5000) {
  const wrap = document.createElement('div'); wrap.className = 'fw'
  wrap.innerHTML = `<canvas></canvas><div class="fw-text">${esc(text)}<small>${esc(sub || '')}</small><small class="fw-date">${dateCN()} ${timeStr()}</small></div><div class="fw-tip">点一下继续</div>`
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

// ---------------- 游戏说明（给薇薇看的） ----------------
function showHelp() {
  SFX.tap()
  modal(`<h3>📖 游戏说明</h3><div class="help">
    <p class="warn">🌅 <b>每周一，一切重新开始！</b>关卡⭐、打败的鬼和称号、小樱等级、装扮、徽章、金币全部清零，从第 1 关重新闯（错题本不清）。</p>
    <p><b>🗺️ 闯关</b>：每个单元 3 关 + 1 只鬼。<b>每一关都要全部答对</b>，才能拿到 1 颗⭐、打开下一关！</p>
    <p><b>⚔️ 斩鬼</b>：只有 <b>1 颗❤️</b>，错一题就输！赢了金币翻倍。<b>每只鬼每天只能斩 ${BOSS_PER_DAY} 次</b>（第1~3关随便玩）。</p>
    <p><b>💰 金币</b>：答对 1 题 1 个，难题 2 个。每天最多赚 ${COIN.dayCap} 个。<b>每到新的一周，金币清零！</b></p>
    <p><b>🎁 每天</b>：答对 ${DAILY_GOAL} 题，领 ${COIN.daily}💰。</p>
    <p><b>📝 小测验</b>：打败了哪个单元的鬼，才能考哪个单元；打败 3 只鬼以后自己选，最少选 3 个。每天最多 ${TEST_PER_DAY} 次。<b>连续 2 次满分</b>，领 ${COIN.testStreak}💰（每周 1 次）。</p>
    <p><b>🏆 每周</b>：每周有 6 个新任务，每个 ${COIN.weekTask}💰；全做完开宝箱 ${CHEST_COIN}💰。</p>
    <p><b>🎖️ 徽章</b>：一共 ${BADGES.length} 个，<b>每周一全部熄灭，要重新点亮</b>。本周集到 ${BADGE_RW.map(r => `${r.n} 个领 ${r.coin}💰`).join('、')}（在每周挑战页下面领，每周都能领）。</p>
    <p><b>👸 小樱</b>：花金币升级，最高 4 级，每升 1 级学会 1 个本领。<br>本领每种<b>每周只能用 1 次</b>，用了不掉级，但这周就没有了，要省着用！</p>
    <p><b>🛍️ 商店</b>：给小樱买头饰、公主裙、鞋子，一共 12 样。</p>
    <p class="hl">👛 <b>爸爸的钱包</b>（每周 1 次）要同时做到：<br>① 12 样装扮全部买齐<br>② 小樱升满 4 级<br>③ 本周赚满 ${WEEK_MAX}💰：每天答题和今日任务都拿满、6 个周任务和宝箱、测验连续 2 次满分、21 个徽章全部点亮领完奖励<br>金币是算好的：全部拿满，买齐装扮、升满小樱，剩下的<b>正好 ${WALLET.p}💰</b>买钱包，少一样都不够！</p></div>
    <button class="btn" onclick="closeModal()">知道啦！</button>`)
}

// ---------------- 家长体验模式（网址后面加 ?demo=1，单独存档，不影响薇薇） ----------------
function demoBar() {
  if (!DEMO) return
  const b = document.createElement('div'); b.className = 'demo-banner'; b.innerHTML = '🧪 体验模式（不影响薇薇的存档）· 点右下角 🧪 看所有结局'; document.body.prepend(b)
  const f = document.createElement('button'); f.className = 'demo-fab'; f.textContent = '🧪'; f.onclick = demoPanel; document.body.appendChild(f)
}
function demoPanel() {
  const B = (fn, t) => `<button class="btn sm ghost" onclick="closeModal();${fn}">${t}</button>`
  modal(`<h3>🧪 家长体验面板</h3><div class="demo-grid">
    <div class="dg">💰 金币和小樱</div>${B('demo.coins()', '+1000 金币')}${B('demo.pet(4)', '小樱升满 4 级')}${B('demo.pet(0)', '小樱回到 0 级')}${B('demo.evolve()', '看升级动画')}${B('demo.resetDay()', '重置今天的限制')}
    <div class="dg">🛍️ 商店和钱包</div>${B('demo.ownAll()', '买齐全部装扮')}${B('showWallet()', '看兑换券')}${B("go('shop')", '去商店')}
    <div class="dg">🏆 每周挑战</div>${B('demo.weekAll()', '完成全部周任务')}${B('demo.newWeek()', '模拟新的一周（金币清零）')}${B('demo.chest()', '看开宝箱')}
    <div class="dg">⚔️ 闯关结局</div>${B('demo.boss(true)', '斩鬼胜利')}${B('demo.boss(false)', '斩鬼失败')}${B('demo.perfect()', '满分·薇薇真棒')}${B('demo.allBoss()', '9 只鬼全打败')}${B("oniIntro(1, () => go('map'))", '👹 斩鬼开场动画')}${B("celebrate('🎁', '今日任务完成！', '奖励 20 💰')", '🎉 惊喜特效')}${B("badgeFx([BADGES[19]])", '🎖️ 新徽章特效')}
    <div class="dg">📝 小测验结局</div>${B('demo.test(100)', '100 分')}${B('demo.test(94)', '90+ 分')}${B('demo.test(70)', '60+ 分')}${B('demo.test(40)', '不及格')}${B('demo.streak()', '连续 2 次满分')}${B("thunderShow('无敌的薇薇', '⚡ 雷光一闪 · 小测验满分 100 分！')", '⚡ 雷光一闪动画')}
    <div class="dg">其他</div>${B('showHelp()', '看游戏说明')}${B('demo.clear()', '清空体验存档')}
  </div><p class="small"><a class="lnk" href="./">← 回到薇薇的正常模式</a></p><button class="btn" onclick="closeModal()">关闭</button>`)
}
const demo = {
  coins() { S.coins += 1000; save(); render(); toast('+1000 金币') },
  pet(n) { S.petLv = n; S.maxLv = Math.max(S.maxLv, n); checkBadges(); save(); render(); toast(`小樱现在 ${n} 级`) },
  evolve() { if (S.petLv < 4) { S.petLv++; S.maxLv = Math.max(S.maxLv, S.petLv); save() } render(); showEvolve(petNow()) },
  resetDay() { S.bossDay = { date: '', n: {} }; S.testDay = { date: '', n: 0 }; ensureWeek(); S.week.used = []; S.coinDay = { date: '', n: 0 }; S.daily.claimed = false; save(); render(); toast('今天的测验、斩鬼次数、本领、金币上限都重置了') },
  ownAll() { S.owned = ALL_ITEMS().map(a => a.id); S.coins = Math.max(S.coins, WALLET.p); ensureWeek(); S.week.earned = Math.max(S.week.earned || 0, WEEK_MAX); checkBadges(); save(); go('shop') },
  weekAll() { ensureWeek(); S.week.tasks.forEach(id => { S.week.c[id] = WEEK_POOL.find(t => t.id === id).goal }); save(); go('week') },
  newWeek() { S.week.id = 'old'; ensureWeek(); S.walletLog = S.walletLog.filter(x => x.week !== S.week.id); save(); go('map'); toast('新的一周开始了：金币清零，换了新任务') },
  chest() { ensureWeek(); S.week.claimed = S.week.tasks.slice(); S.week.chest = false; go('week'); openChest() },
  fake(o) { G = Object.assign({ mode: 'level', u: 0, l: 3, boss: true, qs: Array(12).fill({}), right: 12, hearts: 1, maxHearts: 1, coins: 32, maxCombo: 12, combo: 0, rec: [] }, o) },
  boss(win) { this.fake(win ? {} : { right: 7, hearts: 0, coins: 14, maxCombo: 5 }); setTheme('boss'); finishLevel() },
  perfect() { this.fake({ l: 0, boss: false, qs: Array(10).fill({}), right: 10, hearts: 0, coins: 13, maxCombo: 10 }); finishLevel() },
  allBoss() { UNITS.forEach((_, u) => { for (let l = 0; l < 4; l++) S.stars[lvId(u, l)] = 1 }); S.bossKills = Math.max(S.bossKills, 9); checkBadges(); save(); go('map'); toast('全部关卡都拿到⭐，称号：无敌大英雄') },
  test(score) {
    const qs = makeSet(UNITS.map((_, i) => i), TEST_MID, TEST_HARD, {})
    G = { mode: 'test', qs, rec: [], right: 0, score: 0, coins: 0, units: UNITS.map((_, i) => i), t0: Date.now() - 18 * 60000 }
    // 从最后往前扣分，凑出想看的分数
    const ok = qs.map(() => true); let s = 100
    for (let i = qs.length - 1; i >= 0 && s > score; i--) { ok[i] = false; s -= qs[i].diff === 'hard' ? PT_HARD : PT_MID }
    qs.forEach((q, i) => { G.rec.push({ q, ok: ok[i], given: ok[i] ? q.answer : '?' }); if (ok[i]) { G.right++; G.coins += q.diff === 'hard' ? COIN.hard : COIN.mid } })
    G.score = s; finishTest('done')
  },
  streak() { ensureWeek(); S.week.streak = false; S.perfStreak = 1; this.test(100) },
  clear() { if (!confirm('清空体验存档，从头开始？')) return; localStorage.removeItem(KEY); location.reload() },
}

// ---------------- 家长体验模式要输入密码才能进（免得孩子打开） ----------------
const pwHash = s => { let h = 5381; for (const ch of s) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h.toString(36) }
const DEMO_PW = 'wrnnl6'
function demoLock() {
  $app.innerHTML = `<div class="card demo-lock"><div style="font-size:48px">🔒</div><h3>家长体验模式</h3><p class="small">请输入家长密码</p>
    <input id="demoPw" type="password" autocomplete="off" placeholder="密码"><div id="demoErr" class="small"></div>
    <button class="btn" onclick="demoTry()">进入</button><p class="small"><a class="lnk" href="./">← 回到游戏</a></p></div>`
  const i = document.getElementById('demoPw'); i.focus(); i.onkeydown = e => { if (e.key === 'Enter') demoTry() }
}
function demoTry() {
  const v = document.getElementById('demoPw').value.trim().toLowerCase()
  if (pwHash(v) === DEMO_PW) { try { sessionStorage.setItem('demo_ok', '1') } catch (e) { } boot() }
  else { SFX.bad(); document.getElementById('demoErr').textContent = '密码不对哦' }
}
function boot() {
  ensureDaily(); ensureWeek(); save()
  render(); demoBar()
  const nn = document.getElementById('nextNode')
  if (nn && totalStars() > 0) setTimeout(() => nn.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
}
let demoOk = false
try { demoOk = sessionStorage.getItem('demo_ok') === '1' } catch (e) { }
if (DEMO && !demoOk) demoLock(); else boot()
