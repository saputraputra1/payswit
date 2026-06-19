import { useState, useEffect, useRef, useCallback } from 'react'

export default function Robot({ status = 'idle', onPoke, speak = '' }) {
  const canvasRef = useRef(null)
  const audioCtxRef = useRef(null)
  const animRef = useRef(null)
  const synthRef = useRef(null)
  const s = useRef({ t:0, eyeY:0, bodyY:0, shakeX:0, shakeY:0, blink:0, mouth:1, particles:[], wave:0, poke:0, talking:0 })

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return audioCtxRef.current
  }, [])

  function playTone(freq, dur = 0.15, delay = 0, type = 'sine', vol = 0.08) {
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
      g.gain.setValueAtTime(vol, ctx.currentTime + delay)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + dur)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + dur)
    } catch(e) {}
  }

  function speakText(text) {
    try {
      if (!('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'id-ID'
      u.rate = 1.1
      u.pitch = 1.3
      u.volume = 0.9

      const voices = window.speechSynthesis.getVoices()
      const idVoice = voices.find(v => v.lang.startsWith('id'))
      if (idVoice) u.voice = idVoice

      u.onstart = () => { s.current.talking = 1 }
      u.onend = () => { s.current.talking = 0 }
      window.speechSynthesis.speak(u)
    } catch(e) {}
  }

  useEffect(() => {
    if (speak) speakText(speak)
  }, [speak])

  useEffect(() => {
    if (status === 'error') {
      playTone(400, 0.12, 0, 'sawtooth', 0.08)
      playTone(250, 0.2, 0.1, 'sawtooth', 0.06)
    } else if (status === 'success') {
      playTone(523, 0.1, 0, 'sine', 0.08)
      playTone(659, 0.1, 0.08, 'sine', 0.08)
      playTone(784, 0.2, 0.16, 'sine', 0.07)
    } else if (status === 'hello') {
      playTone(440, 0.1, 0, 'sine', 0.06)
      playTone(554, 0.1, 0.08, 'sine', 0.06)
      playTone(659, 0.15, 0.16, 'sine', 0.05)
    } else if (status === 'poke') {
      playTone(800, 0.06, 0, 'sine', 0.06)
      playTone(1000, 0.06, 0.04, 'sine', 0.04)
    }
  }, [status])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 220, H = 280
    canvas.width = W; canvas.height = H

    function draw() {
      const st = s.current
      st.t += 0.025
      st.blink++

      if (st.blink > 100 + Math.random() * 60) st.blink = 0
      const isBlink = st.blink < 6

      if (status === 'error') {
        st.shakeX = Math.sin(st.t * 25) * 4
        st.shakeY = Math.cos(st.t * 18) * 3
        st.mouth = Math.max(st.mouth - 0.05, -1)
        if (Math.random() < 0.03) st.particles.push({ x: W/2+(Math.random()-0.5)*60, y: 100, vx: (Math.random()-0.5)*2, vy: -Math.random()*2, life: 1, type: 'x' })
      } else if (status === 'success') {
        st.shakeX *= 0.9; st.shakeY *= 0.9
        st.mouth = Math.min(st.mouth + 0.05, 1)
        if (Math.random() < 0.05) st.particles.push({ x: W/2+(Math.random()-0.5)*80, y: 80, vx: (Math.random()-0.5)*3, vy: -Math.random()*3, life: 1, type: 'star' })
      } else if (status === 'hello') {
        st.wave = Math.sin(st.t * 4) * 0.3 + 0.7
        st.mouth = 1
      } else {
        st.shakeX *= 0.95; st.shakeY *= 0.95
        st.mouth = Math.min(st.mouth + 0.02, 1)
        st.wave *= 0.95
      }

      st.bodyY = Math.sin(st.t * 0.8) * 4
      st.eyeY = Math.sin(st.t * 1.2) * 2

      st.particles = st.particles.filter(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=0.015; return p.life>0 })

      ctx.clearRect(0, 0, W, H)
      const cx = W/2 + st.shakeX
      const by = 70 + st.bodyY + st.shakeY

      ctx.shadowColor = status==='error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#0f172a'
      ctx.strokeStyle = status==='error' ? '#ef4444' : '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, by+55, 42, 0, Math.PI*2); ctx.fill(); ctx.stroke()
      ctx.shadowBlur = 0

      ctx.fillStyle = '#0a0f1a'
      ctx.beginPath(); ctx.roundRect(cx-38, by+12, 76, 85, 12); ctx.fill(); ctx.stroke()

      ctx.fillStyle = status==='error' ? '#7f1d1d' : '#1e3a5f'
      ctx.fillRect(cx-4, by+85, 8, 28)
      ctx.fillRect(cx-22, by+85, 44, 6)

      const armR = status==='hello' && st.wave>0.5 ? -1.5+st.wave : 0.2
      ctx.save()
      ctx.translate(cx-38, by+35); ctx.rotate(status==='hello' && st.wave>0.5 ? -0.8 : 0.2)
      ctx.fillStyle='#0f172a'; ctx.beginPath(); ctx.roundRect(-5,0,14,50,5); ctx.fill(); ctx.stroke()
      ctx.restore()
      ctx.save()
      ctx.translate(cx+38, by+35); ctx.rotate(armR)
      ctx.fillStyle='#0f172a'; ctx.beginPath(); ctx.roundRect(-9,0,14,50,5); ctx.fill(); ctx.stroke()
      ctx.restore()

      ctx.fillStyle='#0a0f1a'; ctx.beginPath(); ctx.roundRect(cx-12,by+118,10,22,3); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.roundRect(cx+2,by+118,10,22,3); ctx.fill(); ctx.stroke()

      ctx.fillStyle='#1e293b'; ctx.beginPath(); ctx.arc(cx,by+42,26,Math.PI,0); ctx.fill()

      ctx.fillStyle='#0a0f1a'; ctx.beginPath(); ctx.roundRect(cx-20,by+28,40,32,10); ctx.fill()

      const eyeCol = status==='error' ? '#ef4444' : '#60a5fa'
      const eyeGlow = status==='error' ? '#ef4444' : '#3b82f6'
      ctx.shadowColor = eyeGlow; ctx.shadowBlur = 12
      ctx.fillStyle = eyeCol

      if (isBlink) {
        ctx.shadowBlur=0
        ctx.fillRect(cx-15,by+40,12,2); ctx.fillRect(cx+3,by+40,12,2)
      } else {
        ctx.beginPath(); ctx.arc(cx-9, by+40+st.eyeY, 6, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc(cx+9, by+40+st.eyeY, 6, 0, Math.PI*2); ctx.fill()
        ctx.shadowBlur=0; ctx.fillStyle='#fff'
        ctx.beginPath(); ctx.arc(cx-7,by+38+st.eyeY,2.5,0,Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc(cx+11,by+38+st.eyeY,2.5,0,Math.PI*2); ctx.fill()
      }
      ctx.shadowBlur=0

      ctx.strokeStyle = status==='error' ? '#ef4444' : '#60a5fa'
      ctx.lineWidth = 2.5; ctx.lineCap = 'round'
      ctx.beginPath()
      if (st.mouth > 0) {
        const mw = st.talking ? 10 + Math.sin(st.t*20)*4 : 10*st.mouth
        ctx.arc(cx, by+55, mw, 0.1*Math.PI, 0.9*Math.PI)
      } else {
        ctx.arc(cx, by+65, 10*Math.abs(st.mouth), 1.1*Math.PI, 1.9*Math.PI)
      }
      ctx.stroke()

      if (st.talking) {
        ctx.fillStyle = status==='error' ? '#ef4444' : '#60a5fa'
        ctx.globalAlpha = 0.3 + Math.sin(st.t*15)*0.2
        ctx.beginPath(); ctx.arc(cx, by+55, 15+Math.sin(st.t*10)*3, 0, Math.PI*2); ctx.fill()
        ctx.globalAlpha = 1
      }

      ctx.fillStyle = status==='error' ? '#ef4444' : '#3b82f6'
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6
      ctx.beginPath(); ctx.arc(cx-25,by+38,4,0,Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx+25,by+38,4,0,Math.PI*2); ctx.fill()
      ctx.shadowBlur=0

      ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2
      ctx.beginPath(); ctx.moveTo(cx-10,by+15); ctx.lineTo(cx-15,by-5); ctx.stroke()
      ctx.fillStyle='#60a5fa'; ctx.beginPath(); ctx.arc(cx-15,by-5,4,0,Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.moveTo(cx+10,by+15); ctx.lineTo(cx+15,by-5); ctx.stroke()
      ctx.fillStyle='#60a5fa'; ctx.beginPath(); ctx.arc(cx+15,by-5,4,0,Math.PI*2); ctx.fill()

      st.particles.forEach(p => {
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.type==='x' ? '#ef4444' : '#fbbf24'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(p.type==='x' ? '✗' : '✦', p.x, p.y)
      })
      ctx.globalAlpha = 1

      ctx.fillStyle='#0f172a'
      ctx.beginPath(); ctx.roundRect(cx-14,by+90,8,3,2); ctx.fill()
      ctx.beginPath(); ctx.roundRect(cx+6,by+90,8,3,2); ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [status])

  function handleClick() { if (onPoke) onPoke() }

  return (
    <div className="flex justify-center cursor-pointer select-none" onClick={handleClick}>
      <canvas ref={canvasRef} width={220} height={280} className="w-[200px] h-[260px]" />
    </div>
  )
}
