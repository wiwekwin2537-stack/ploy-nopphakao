// ใช้ศิลากับของ 1 ชิ้น (ที่เดียวในเกม): ศิลาเปลี่ยนค่า (craft: true ใน items.json) → craftItem · ศิลาช่องพลอย → useCurrency
// คืน { ok, text } — ok = false ไม่เสียศิลา พร้อมข้อความบอกเหตุผลที่ตรงกับกติกาจริง
import { craftItem, useCurrency, itemName } from './items.js';

export const SOCKET_CURRENCY = ['jeweller', 'fusing', 'chroma'];
export const CRAFT_CURRENCY = ['gild', 'alch', 'kali', 'exalt'];

const NEED = {
  gild: 'ทองคำเปลวใช้ได้กับของสีขาว (ทั่วไป) เท่านั้น',
  alch: 'ปรอทเล่นแร่ใช้ได้กับของสีขาว (ทั่วไป) เท่านั้น',
  kali: 'เถ้ากาลีใช้ได้กับของสีม่วงหรือแดงเท่านั้น',
  exalt: 'มณีโชติใช้ได้กับของสีเขียวที่มีค่าเดียว หรือของสีม่วง',
  jeweller: 'ศิลาเจาะใช้ได้กับอาวุธหรือเสื้อที่เลเวลพอให้มีช่องได้ 2 ช่องขึ้นไป',
  fusing: 'ด้ายสายสิญจน์ใช้ได้กับของที่มีช่องพลอย 2 ช่องขึ้นไป',
  chroma: 'หินเจ็ดสีใช้ได้กับของที่มีช่องพลอย',
};

export function applyCurrency(game, kind, it) {
  const I = game.data.items, p = game.player, C = I.currency[kind];
  if (!C) return { ok: false, text: 'ศิลานี้ใช้กับของไม่ได้' };
  if (!it) return { ok: false, text: 'วางของที่จะคราฟต์ก่อน (แตะของ 1 ครั้ง)' };
  if (!((p.currency && p.currency[kind]) > 0)) return { ok: false, text: `ไม่มี${C.name} — หาได้จากมอน บอส หรือร้านแม่ค้า` };
  if (it.rarity === 'unique' && !SOCKET_CURRENCY.includes(kind)) return { ok: false, text: 'ของยูนีคเปลี่ยนค่าไม่ได้ (ใช้ได้แค่ศิลาช่องพลอย)' };
  let r = null;
  if (C.craft) r = craftItem(I, game.rng, p, kind, it);
  else if (SOCKET_CURRENCY.includes(kind)) r = useCurrency(I, game.rng, p, kind, it, game.data.gems);
  else return { ok: false, text: kind === 'regret' ? 'ใบลานล้างกรรมใช้ในหน้าต้นพาสซีฟ' : `${C.name}ใช้ที่อื่น (ดูคำอธิบาย)` };
  if (!r) return { ok: false, text: NEED[kind] || `ใช้${C.name}กับ${itemName(I, it)}ไม่ได้` };
  game.events.emit('currencyUsed', { kind });
  game.events.emit(SOCKET_CURRENCY.includes(kind) ? 'gemsChanged' : 'gearChanged', {});
  return { ok: true, text: C.craft ? 'ได้: ' + r : `${C.name}: ${r}` };
}
