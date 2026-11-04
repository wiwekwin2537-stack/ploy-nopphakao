// เสียงทั้งหมดสร้างด้วยโค้ด (Web Audio) ไม่มีไฟล์เสียง
// บันไดเสียงไทย: แบ่งช่วงทบเป็น 7 ส่วนเท่ากัน ใช้ 5 เสียง (ทาง เพนทาโทนิก)
const STEP = Math.pow(2, 1 / 7);
const PENTA = [0, 1, 2, 4, 5];
const BASE = 293.66; // ราว D4

export function thaiFreq(degree, octave = 0) {
  const n = PENTA.length;
  const o = Math.floor(degree / n) + octave;
  const d = ((degree % n) + n) % n;
  return BASE * Math.pow(STEP, PENTA[d]) * Math.pow(2, o);
}

// ทำนองวนเป็นวลี (เลขคือขั้นเสียง, null = เงียบ) แต่ละช่อง = 1 จังหวะย่อย
const SONGS = {
  town: {
    bpm: 76, sub: 2,
    lead: [4, null, 5, 4, 2, null, 1, 2, 4, null, null, null, 2, 4, 5, 7, 6, null, 5, 4, 2, null, null, null,
      1, 2, 4, 2, 1, null, 0, 1, 2, null, 4, null, 2, 1, 0, null, null, null, null, null, null, null, null, null],
    voice: 'khlui', bass: [0, null, null, null, 3, null, null, null], ching: 4, drum: false,
  },
  field: {
    bpm: 112, sub: 2,
    lead: [0, 2, 4, 5, 4, 2, 4, null, 5, 7, 5, 4, 2, 4, 2, null, 0, 2, 4, 2, 0, -1, 0, null, 2, 4, 5, 4, 2, 0, 2, null],
    voice: 'ranat', bass: [0, null, 0, null, -2, null, -1, null], ching: 2, drum: true,
  },
  road: {
    bpm: 96, sub: 2,
    lead: [2, null, 4, 2, 1, null, 0, null, 1, 2, 4, null, 2, 1, 0, null, -1, 0, 1, null, 2, null, 1, 0, 0, null, null, null, null, null, null, null],
    voice: 'ranat', bass: [0, null, null, null, -1, null, null, null], ching: 4, drum: true,
  },
  forest: {                                        // ป่าหิมพานต์: ระนาดพลิ้ว ลึกลับแต่สดใส
    bpm: 88, sub: 2,
    lead: [4, null, 5, 7, 5, null, 4, 2, 4, null, null, 5, 4, 2, 1, null, 2, 4, 2, 1, 0, null, 1, 2, -1, null, 0, null, null, null, null, null],
    voice: 'ranat', bass: [0, null, null, 2, -1, null, null, null], ching: 4, drum: false,
  },
  dungeon: {                                       // วัดร้าง: ขลุ่ยต่ำช้า ฆ้องห่าง ๆ วังเวง
    bpm: 58, sub: 2,
    lead: [0, null, null, -1, 0, null, null, null, 2, null, 1, null, 0, null, null, null,
      -1, null, -2, null, -1, null, 0, null, null, null, null, null, null, null, null, null],
    voice: 'khlui', bass: [-2, null, null, null, null, null, -3, null], ching: 8, drum: false,
  },
}

export function createAudio() {
  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let muted = false;
  let song = null, songName = null, nextTime = 0, stepIdx = 0;
  try { muted = localStorage.getItem('ploy.muted') === '1'; } catch { /* ไม่มีที่เก็บก็ไม่เป็นไร */ }

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.35; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function osc(type, f, t, dur, peak, bus, a = 0.005) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    env(g, t, a, peak, dur); o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + a + dur + 0.05);
    return o;
  }
  function noise(t, dur, peak, bus, filterType, f0, f1) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = filterType; fl.Q.value = 1.2;
    fl.frequency.setValueAtTime(f0, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, 0.004, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(bus);
    s.start(t); s.stop(t + dur + 0.05);
  }

  // เครื่องดนตรี
  const inst = {
    ranat(f, t, v = 1, bus = musicBus) {        // ระนาด: ไม้ตีเสียงสั้น มีฮาร์มอนิกแหลม
      osc('triangle', f, t, 0.28, 0.32 * v, bus);
      osc('sine', f * 3.9, t, 0.07, 0.09 * v, bus);
    },
    khlui(f, t, v = 1, bus = musicBus, len = 0.5) { // ขลุ่ย: ลมหายใจ + สั่นเสียง
      const o = ctx.createOscillator(); const g = ctx.createGain(); const lfo = ctx.createOscillator(); const lg = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f * 0.98, t); o.frequency.linearRampToValueAtTime(f, t + 0.06);
      lfo.frequency.value = 5.5; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22 * v, t + 0.06);
      g.gain.setValueAtTime(0.2 * v, t + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(bus); o.start(t); lfo.start(t); o.stop(t + len + 0.05); lfo.stop(t + len + 0.05);
      noise(t, 0.08, 0.02 * v, bus, 'bandpass', f * 2);
    },
    khong(f, t, v = 1, bus = musicBus) {        // ฆ้อง: เสียงทุ้มกังวาน
      const o = osc('sine', f, t, 1.6, 0.28 * v, bus, 0.01);
      o.frequency.exponentialRampToValueAtTime(f * 0.985, t + 1.2);
      osc('sine', f * 2.01, t, 0.6, 0.06 * v, bus, 0.01);
    },
    ching(t, closed, v = 1) {                   // ฉิ่ง (ฉิ่ง=เปิด, ฉับ=ปิด)
      const len = closed ? 0.06 : 0.5;
      osc('sine', 2637, t, len, 0.05 * v, musicBus);
      osc('sine', 3729, t, len * 0.8, 0.035 * v, musicBus);
    },
    taphon(t, v = 1) {                          // ตะโพน: กลองทุ้ม
      const o = osc('sine', 110, t, 0.18, 0.4 * v, musicBus);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    },
  };

  function scheduleMusic() {
    if (!ctx || !song) return;
    const spb = 60 / song.bpm / song.sub;
    while (nextTime < ctx.currentTime + 0.25) {
      const L = song.lead.length;
      const i = stepIdx % L;
      const n = song.lead[i];
      if (n !== null && n !== undefined) {
        if (song.voice === 'khlui') inst.khlui(thaiFreq(n, 1), nextTime, 0.9, musicBus, spb * 1.9);
        else inst.ranat(thaiFreq(n, 1), nextTime, 0.8);
      }
      if (song.voice === 'khlui' && i % 2 === 0 && n !== null) inst.ranat(thaiFreq(n, 0), nextTime, 0.35);
      const bi = Math.floor(stepIdx / 2) % song.bass.length;
      if (stepIdx % 2 === 0 && song.bass[bi] !== null) inst.khong(thaiFreq(song.bass[bi], -1), nextTime, 0.7);
      if (stepIdx % song.ching === 0) inst.ching(nextTime, (stepIdx / song.ching) % 2 === 1, 0.9);
      if (song.drum && stepIdx % 4 === 0) inst.taphon(nextTime, 0.7);
      if (song.drum && stepIdx % 8 === 6) inst.taphon(nextTime, 0.4);
      nextTime += spb; stepIdx++;
    }
  }

  const SFX = {
    swing(t) { noise(t, 0.12, 0.25, sfxBus, 'bandpass', 2500, 700); },
    hit(t) { const o = osc('sine', 180, t, 0.1, 0.5, sfxBus); o.frequency.exponentialRampToValueAtTime(70, t + 0.1); noise(t, 0.06, 0.25, sfxBus, 'lowpass', 2000); },
    hurt(t) { const o = osc('square', 220, t, 0.18, 0.12, sfxBus); o.frequency.exponentialRampToValueAtTime(110, t + 0.18); },
    dash(t) { noise(t, 0.2, 0.2, sfxBus, 'highpass', 800, 3000); },
    coin(t) { inst.ranat(thaiFreq(7, 1), t, 0.7, sfxBus); inst.ranat(thaiFreq(9, 1), t + 0.07, 0.7, sfxBus); },
    gem(t) { [0, 2, 4, 5, 7, 9].forEach((d, i) => inst.ranat(thaiFreq(d, 1), t + i * 0.06, 0.8, sfxBus)); inst.khong(thaiFreq(0, -1), t, 0.6, sfxBus); },
    level(t) { inst.khong(thaiFreq(0, -1), t, 1, sfxBus); [0, 2, 4, 7, 9, 12].forEach((d, i) => inst.ranat(thaiFreq(d, 1), t + 0.1 + i * 0.08, 0.9, sfxBus)); },
    cast(t) { noise(t, 0.25, 0.2, sfxBus, 'bandpass', 400, 1800); osc('sawtooth', 160, t, 0.2, 0.06, sfxBus); },
    boom(t) { const o = osc('sine', 120, t, 0.35, 0.5, sfxBus); o.frequency.exponentialRampToValueAtTime(40, t + 0.3); noise(t, 0.3, 0.3, sfxBus, 'lowpass', 1200, 200); },
    ice(t) { noise(t, 0.18, 0.18, sfxBus, 'highpass', 3000, 6000); [9, 12].forEach((d, i) => inst.ranat(thaiFreq(d, 1), t + i * 0.04, 0.5, sfxBus)); },
    poison(t) { const o = osc('sine', 260, t, 0.25, 0.18, sfxBus); o.frequency.exponentialRampToValueAtTime(130, t + 0.25); noise(t, 0.2, 0.12, sfxBus, 'lowpass', 800); },
    die(t) { inst.khong(thaiFreq(-3, -1), t, 1, sfxBus); inst.khong(thaiFreq(-5, -1), t + 0.4, 1, sfxBus); },
    mobdie(t) { const o = osc('triangle', 300, t, 0.2, 0.15, sfxBus); o.frequency.exponentialRampToValueAtTime(90, t + 0.2); },
    talk(t) { inst.ranat(thaiFreq(4, 1), t, 0.4, sfxBus); },
    warn(t) { osc('sawtooth', 90, t, 0.3, 0.08, sfxBus, 0.05); },
    click(t) { inst.ranat(thaiFreq(2, 2), t, 0.4, sfxBus); },
  };

  return {
    unlock() { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); },
    play(name) { if (!ctx || muted || !SFX[name]) return; SFX[name](ctx.currentTime + 0.01); },
    music(name) {
      if (name === songName) return;
      songName = name; song = SONGS[name] || null; stepIdx = 0;
      if (ctx) nextTime = ctx.currentTime + 0.1;
    },
    update() { if (ctx && !muted) scheduleMusic(); else if (ctx) nextTime = ctx.currentTime + 0.1; },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('ploy.muted', muted ? '1' : '0'); } catch { /* ข้าม */ }
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
  };
}
