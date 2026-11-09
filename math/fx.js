// ============================================================
//  第七版特效：斩鬼开场动画 / 斩鬼胜利动画 / 各种惊喜庆祝
//  （全部是程序画的原创效果，不用任何动漫图片和视频）
// ============================================================
const FX_SEL = '.fw,.oni-fx,.cele'
// 等前一个特效播完再播下一个，免得叠在一起
function whenFree(f, wait = 0) {
  setTimeout(function chk() { document.querySelector(FX_SEL) ? setTimeout(chk, 300) : f() }, wait)
}
const fxDrum = (t, big) => { tone(big ? 62 : 92, t, big ? 0.6 : 0.28, 'sine', big ? 0.4 : 0.26); noise(t, 0.09, big ? 0.45 : 0.22, 140) }
// 一组定时器，跳过时一起清掉
function fxTimeline(list) { const ids = list.map(([ms, f]) => setTimeout(f, ms)); return () => ids.forEach(clearTimeout) }

// ---------------- 斩鬼开场：约 5 秒，紧张刺激 ----------------
function oniIntro(u, done) {
  const o = ONI[u], w = document.createElement('div')
  w.className = 'oni-fx intro'
  w.innerHTML = `<div class="ofx-bg"></div><div class="ofx-red"></div>
    <div class="ofx-warn">⚠️ 警 告 ⚠️<small>恶鬼出现了！</small></div>
    <div class="ofx-oni">${o.f}</div>
    <div class="ofx-name">${esc(o.n)}</div>
    <div class="ofx-say">“${esc(o.say)}”</div>
    <div class="ofx-count"></div><div class="ofx-cut"></div>
    <div class="fw-tip ofx-skip">点一下跳过</div>`
  document.body.appendChild(w)
  Music.stop()
  const cnt = w.querySelector('.ofx-count'), add = c => () => w.classList.add(c)
  const count = (t, big) => () => { cnt.textContent = t; cnt.classList.remove('pop'); void cnt.offsetWidth; cnt.classList.add('pop'); big ? (SFX.slash(), fxDrum(0, true)) : (tone(880, 0, 0.12, 'square', 0.07), fxDrum(0)) }
  // 心跳一样越来越快的鼓声
  ;[0, 0.55, 1.05, 1.5, 1.9, 2.25, 2.55].forEach((t, i) => fxDrum(t, i % 2 === 0))
  let ended = false
  const end = () => { if (ended) return; ended = true; cancel(); w.classList.add('out'); setTimeout(() => w.remove(), 350); done() }
  const cancel = fxTimeline([
    [80, add('s1')],                                                    // 红光闪 + 警告
    [1200, () => { w.classList.add('s2'); tone(70, 0, 0.9, 'sawtooth', 0.14); noise(0, 0.8, 0.35, 90) }], // 鬼冲出来
    [2000, () => { w.classList.add('s3'); fxDrum(0, true) }],          // 名字砸下来
    [2600, add('s4')],                                                  // 鬼说话
    [3200, count('3')], [3800, count('2')], [4400, count('1')],
    [5000, () => { count('斩！', true)(); w.classList.add('s5') }],     // 一刀白光
    [5600, end],
  ])
  const t0 = Date.now()
  w.onclick = () => { if (Date.now() - t0 > 1500) end() }
}

// ---------------- 斩鬼胜利：约 5 秒 ----------------
function oniDefeat(u, rankUp, done) {
  const o = ONI[u], w = document.createElement('div')
  w.className = 'oni-fx win'
  w.innerHTML = `<div class="ofx-bg"></div><div class="ofx-rays"></div>
    <div class="ofx-oni whole">${o.f}</div>
    <div class="ofx-oni half a">${o.f}</div><div class="ofx-oni half b">${o.f}</div>
    <div class="ofx-slash"></div><div class="ofx-flash"></div>
    <div class="ofx-win">斩鬼成功！<small>${esc(o.n)}被打败了</small>${rankUp ? `<div class="ofx-rank">⬆️ 称号升级：「${esc(rankUp)}」</div>` : ''}</div>
    <div class="fw-tip ofx-skip">点一下继续</div>`
  document.body.appendChild(w)
  let ended = false
  const end = () => { if (ended) return; ended = true; cancel(); w.classList.add('out'); setTimeout(() => { w.remove(); done && done() }, 350) }
  const cancel = fxTimeline([
    [60, () => { w.classList.add('s1'); SFX.oniHit() }],                // 鬼被打得发抖
    [700, () => { w.classList.add('s2'); SFX.slash(); noise(0.05, 0.4, 0.6, 1600) }], // 一刀划过
    [950, () => { w.classList.add('s3'); fxDrum(0, true); noise(0, 1.2, 0.5, 80) }],  // 白光、鬼裂成两半
    [1900, () => { w.classList.add('s4'); SFX.win(); confetti(140) }],               // 金色大字
    [2500, () => { if (rankUp) { w.classList.add('s5');[784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.1, 0.35, 'triangle', 0.12)) } }],
    [3300, () => confetti(80)],
    [5200, end],
  ])
  const t0 = Date.now()
  w.onclick = () => { if (Date.now() - t0 > 2000) end() }
}

// ---------------- 惊喜庆祝：完成任务、升级、买东西、拿徽章…… ----------------
function celebrate(icon, title, sub, ms = 2800, after) {
  whenFree(() => {
    const w = document.createElement('div')
    w.className = 'cele'
    const stars = Array.from({ length: 18 }, (_, i) => {
      const a = i / 18 * Math.PI * 2, r = 110 + Math.random() * 70
      return `<i style="--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;--d:${Math.random() * 0.25}s">${['⭐', '✨', '🌟', '💫'][i % 4]}</i>`
    }).join('')
    w.innerHTML = `<div class="cele-box"><div class="cele-rays"></div><div class="cele-stars">${stars}</div>
      <div class="cele-icon">${icon}</div><div class="cele-t">${title}</div>${sub ? `<div class="cele-s">${sub}</div>` : ''}</div>`
    document.body.appendChild(w)
    ;[523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle', 0.1)); tone(2093, 0.45, 0.4, 'sine', 0.05)
    confetti(50)
    let ended = false
    const end = () => { if (ended) return; ended = true; w.classList.add('out'); setTimeout(() => { w.remove(); after && after() }, 350) }
    const id = setTimeout(end, ms), t0 = Date.now()
    w.onclick = () => { if (Date.now() - t0 > 600) { clearTimeout(id); end() } }
  })
}
