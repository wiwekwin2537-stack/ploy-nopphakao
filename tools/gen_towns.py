# สร้างเมืองประจำบท 2-4 (รันไฟล์นี้ไฟล์เดียว: จะเรียก gen_subzones.py ต่อให้เองเสมอ ลำดับถูกเสมอ)
# (แบบเมืองของแต่ละ Act ใน PoE) ลงใน data/zones.json — รันซ้ำได้ (เขียนทับเฉพาะ 3 เมืองนี้ + ทางออกที่เกี่ยวข้อง)
import json
Z = json.load(open('data/zones.json'))

from zonelib import town, npc

new = {
  "camp_hunter": town("camp_hunter", "ค่ายพรานไพร", "forest", "town", "field", (68.6, 29), "himmapan", (2.6, 20.5),
      [npc("phran", "พรานบุญ", "guard", 20, 8.2), npc("mae_kaew", "แม่ค้าแก้ว", "merchant", 16, 16.4, True), npc("lam", "ลูกหาบล่ำ", "elder", 28.5, 8.4)],
      [{"type": "hut", "x": 2, "y": 2, "w": 4, "h": 3}, {"type": "hut", "x": 24, "y": 15.5, "w": 4, "h": 3}, {"type": "haystack", "x": 8, "y": 16, "w": 1.6, "h": 1}, {"type": "crate", "x": 11, "y": 15.5, "w": 1, "h": 1}, {"type": "tree_banana", "x": 29, "y": 3, "w": 0.4, "h": 0.3}, {"type": "tree_palm", "x": 3, "y": 17.5, "w": 0.4, "h": 0.3}],
      [{"type": "tree_big", "count": 18, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}, {"type": "bush", "count": 16, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}], 41),
  "hermitage": town("hermitage", "อาศรมฤๅษีเชิงเขา", "snow", "town", "himmapan", (66.4, 34.5), "kailash", (2.6, 24.5),
      [npc("ruesi", "ฤๅษีโคดม", "elder", 20, 8.2), npc("nang_on", "นางอ่อน", "merchant", 16, 16.4, True), npc("sit", "ศิษย์ฤๅษี", "granny", 28.5, 8.4)],
      [{"type": "hut", "x": 2, "y": 2, "w": 4, "h": 3}, {"type": "shrine", "x": 25, "y": 16, "w": 2, "h": 1.5, "label": "ศาลเจ้าเขา"}, {"type": "well", "x": 8, "y": 16, "w": 2, "h": 1.5}],
      [{"type": "snow_pine", "count": 20, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}, {"type": "ice_crystal", "count": 8, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}], 57),
  "sky_sala": town("sky_sala", "ศาลาท่าสวรรค์", "cloud", "heaven", "kailash", (56.4, 5.5), "tavatimsa", (2.6, 20.5),
      [npc("thep_su", "เทพบุตรสุริยา", "guard", 20, 8.2), npc("nang_fah", "นางฟ้าพิมพ์", "merchant", 16, 16.4, True), npc("khon_fao", "คนธรรพ์เฝ้าประตู", "elder", 28.5, 8.4)],
      [{"type": "heaven_pillar", "x": 3, "y": 3, "w": 1, "h": 0.8}, {"type": "heaven_pillar", "x": 27, "y": 3, "w": 1, "h": 0.8}, {"type": "heaven_pillar", "x": 3, "y": 17, "w": 1, "h": 0.8}, {"type": "heaven_pillar", "x": 27, "y": 17, "w": 1, "h": 0.8}],
      [{"type": "cloud_puff", "count": 24, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}, {"type": "flower", "count": 18, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}], 73),
}
# จัดลำดับ: เมืองใหม่ต่อจากพื้นที่ก่อนหน้า (ลำดับใน zones.json = ลำดับในหน้าวาร์ป)
order = []
for k in Z:
    if k in new: continue
    order.append(k)
    if k == 'dungeon3': order.append('camp_hunter')
    if k == 'himmapan': order.append('hermitage')
    if k == 'kailash': order.append('sky_sala')
Z2 = {k: (new[k] if k in new else Z[k]) for k in order}

def reroute(zone, to_old, to_new, tx, ty):
    for e in Z2[zone]['exits']:
        if e['to'] == to_old or e['to'] == to_new: e['to'], e['tx'], e['ty'] = to_new, tx, ty
reroute('field', 'himmapan', 'camp_hunter', 2.6, 11)
reroute('himmapan', 'field', 'camp_hunter', 29.4, 11)
reroute('himmapan', 'kailash', 'hermitage', 2.6, 11)
reroute('kailash', 'himmapan', 'hermitage', 29.4, 11)
reroute('kailash', 'tavatimsa', 'sky_sala', 2.6, 11)
reroute('tavatimsa', 'kailash', 'sky_sala', 29.4, 11)

# มอนชื่อเฉพาะของเควสรอง (หายากสีเหลือง ไม่เกิดใหม่หลังล้ม)
named = {
  'field': {"type": "krasue", "count": 1, "level": [6, 6], "area": {"x": 6, "y": 4, "w": 20, "h": 18}, "named": {"name": "กระสือนางเรือนทอง", "flag": "q1_side_kill"}, "afterFlag": "tutorialDone"},
  'himmapan': {"type": "hatsadi", "count": 1, "level": [11, 11], "area": {"x": 40, "y": 4, "w": 22, "h": 14}, "named": {"name": "หัสดีลิงค์ตาเดียว", "flag": "q2_side_kill"}},
  'kailash': {"type": "kinnorn", "count": 1, "level": [18, 18], "area": {"x": 30, "y": 30, "w": 24, "h": 14}, "named": {"name": "กินนรดำแห่งหุบหิมะ", "flag": "q3_side_kill"}},
  'tavatimsa': {"type": "deva_warrior", "count": 1, "level": [20, 20], "area": {"x": 36, "y": 4, "w": 16, "h": 12}, "named": {"name": "เทวบุตรหลงสวรรค์", "flag": "q4_side_kill"}},
}
for zk, s in named.items():
    Z2[zk]['spawns'] = [x for x in Z2[zk]['spawns'] if not x.get('named')] + [s]
# โต๊ะช่างในเวียงด่านหิน (เมืองหลัก วาดมือ ไม่ได้สร้างจาก town())
T0 = Z2['town']
T0['objects'] = [o for o in T0['objects'] if o['type'] != 'craft_bench'] + [{"type": "craft_bench", "x": 35.2, "y": 16.8, "w": 1.6, "h": 0.8, "label": "โต๊ะช่าง"}]
json.dump(Z2, open('data/zones.json', 'w'), ensure_ascii=False, indent=1)
print('ok', list(Z2.keys()))

# ต่อด้วยพื้นที่ย่อยของบท (ต้องรันหลังเมืองทุกครั้ง ไม่งั้นทางออกของเมืองจะชี้ข้ามพื้นที่ย่อย)
import runpy, os
runpy.run_path(os.path.join(os.path.dirname(__file__), 'gen_subzones.py'))
