// เนื้อเรื่องแบบบท (Act) ของ PoE — ข้อมูลทั้งหมดใน data/quests.json
// เควส: เปิด (open) → ทำสำเร็จ (ready: ธง done ตั้งแล้ว) → รับรางวัลกับ NPC (claimed: ธง q_<id>)
// รางวัล: gems = เลือกพลอย 1 จาก 3 (หน้าต่างรางวัล) · passive = แต้มพาสซีฟเพิ่ม (p.questPoints)

export function questState(game, q) {
  if (game.flags['q_' + q.id]) return 'claimed';
  return game.flags[q.done] ? 'ready' : 'open';
}

// บทปัจจุบัน = บทแรกที่ยังไม่ได้ล้มบอสท้ายบท (ล้มครบ = หลังจบเรื่อง)
export function currentAct(game) {
  const Q = game.data.quests;
  for (const a of Q.acts) {
    const main = Q.list.find((q) => q.act === a.n && q.kind === 'main');
    if (main && !game.flags[main.done]) return a;
  }
  return Q.acts[Q.acts.length - 1];
}

// รายการบนจอ (มุมซ้ายบน): รับรางวัลที่ค้าง → เควสหลักบทนี้ → เควสรองบทนี้ (สูงสุด 3) · ระหว่างบทนำไม่แสดง
export function questTracker(game) {
  if (!game.flags.tutorialDone || !game.data.quests) return [];
  const Q = game.data.quests, act = currentAct(game), zone = game.world.zone && game.world.zone.id, out = [];
  const townName = (q) => { const a = Q.acts.find((x) => x.n === q.act); const z = a && game.data.zones[a.town]; return z ? z.name : ''; };
  for (const q of Q.list) if (questState(game, q) === 'ready') out.push({ q, kind: 'ready', title: 'รับรางวัล: ' + q.title, text: `กลับไปหา${q.giverName}ที่${townName(q)}` });
  for (const q of Q.list) {
    if (q.act !== act.n || questState(game, q) !== 'open') continue;
    out.push({ q, kind: q.kind, title: q.title, text: q.text, here: (act.zones || []).includes(zone) });
  }
  if (!out.length) out.push({ q: null, kind: 'main', title: Q.endgame.title, text: Q.endgame.text, here: zone === 'map' });
  return out.slice(0, 3).map((x) => ({ ...x, act: act.name }));
}

// เครื่องหมายบนหัว NPC (แบบ PoE): 'reward' = มีรางวัลรอ (เขียว) · 'new' = มีเรื่องเล่า/เควสของบทนี้ที่ยังไม่ได้คุย (ทอง)
export function npcMark(game, npcId) {
  if (!game.flags.tutorialDone) return npcId === 'chan' && !game.flags.metChan ? 'new' : null;
  if (readyQuestFor(game, npcId)) return 'reward';
  const act = currentAct(game);
  const q = game.data.quests.list.find((x) => x.giver === npcId && x.act === act.n && questState(game, x) === 'open');
  return q && !game.flags['met_' + npcId] ? 'new' : null;
}

// เข้าเมืองของบทครั้งแรก = ป้ายชื่อบทใหญ่กลางจอ (แบบ PoE)
export function setupActs(game) {
  game.events.on('zoneChanged', ({ zone }) => {
    if (!game.flags.tutorialDone) return;
    const a = game.data.quests.acts.find((x) => x.town === zone && x.n > 1 && x.n <= 4);
    if (!a || game.flags['act_' + a.n]) return;
    game.flags['act_' + a.n] = true;
    game.actCard = { text: a.name, t: 4.5 };
  });
}

// เควสที่ NPC คนนี้พร้อมให้รางวัล
export function readyQuestFor(game, npcId) {
  return game.data.quests.list.find((q) => q.giver === npcId && questState(game, q) === 'ready') || null;
}

// รับรางวัล: แต้มพาสซีฟให้ทันที · พลอย = ตั้งค่า game.reward ให้หน้าต่างเลือก (ยังไม่นับว่ารับจนกว่าจะเลือก)
export function claimQuest(game, q, gem) {
  if (questState(game, q) !== 'ready') return false;
  const p = game.player, R = q.reward;
  if (R.gems) {
    if (!R.gems.includes(gem)) return false;
    p.bag.push(gem);
  }
  if (R.passive) p.questPoints = (p.questPoints || 0) + R.passive;
  game.flags['q_' + q.id] = true;
  if (q.alsoFlag) game.flags[q.alsoFlag] = true;
  game.events.emit('questClaimed', { id: q.id });
  return true;
}
