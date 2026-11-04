// เป้าหมายเนื้อเรื่อง: ข้อแรกใน data/quests.json ที่ธงยังไม่ถูกตั้ง (ระหว่างบทนำไม่แสดง — บทนำมีคำใบ้ของตัวเอง)
export function currentQuest(game) {
  if (!game.flags.tutorialDone || !game.data.quests) return null;
  const list = game.data.quests.list;
  const i = list.findIndex((q) => !q.until || !game.flags[q.until]);
  if (i < 0) return null;
  const q = list[i];
  return { ...q, step: i + 1, total: list.length, here: !!game.world.zone && (q.zones || []).includes(game.world.zone.id) };
}
