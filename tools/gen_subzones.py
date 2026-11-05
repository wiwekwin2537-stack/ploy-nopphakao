# พื้นที่ย่อยของแต่ละบท (แบบ PoE: บทละหลายพื้นที่ มีศาลวาร์ประหว่างทาง) — เมืองของบท → พื้นที่ย่อยใหม่ → พื้นที่บอสเดิม
# รันซ้ำได้ (gen_towns.py เรียกไฟล์นี้ต่อให้เอง): เขียนทับเฉพาะพื้นที่ในรายการนี้ + ทางออกที่เกี่ยวข้อง
import json
Z = json.load(open('data/zones.json'))
W, H = 64, 36

def sub(name, ground, music, seed, prev, nxt, spawns, scatter):
    roads = [{"x": 0, "y": 16, "w": 21, "h": 3}, {"x": 18, "y": 6, "w": 3, "h": 13}, {"x": 18, "y": 6, "w": 24, "h": 3},
             {"x": 39, "y": 6, "w": 3, "h": 22}, {"x": 39, "y": 25, "w": 25, "h": 3}]
    full = {"x": 0, "y": 0, "w": W, "h": H}
    return {
        "name": name, "w": W, "h": H, "ground": ground, "music": music, "safe": False, "seed": seed, "water": [], "roads": roads,
        "objects": [{"type": "waypoint", "x": 29, "y": 9.4, "w": 1, "h": 0.7, "solid": False, "label": "ศาลวาร์ป"}],
        "scatter": [{**s, "area": full} for s in scatter],
        "exits": [{"x": 0, "y": 16, "w": 0.6, "h": 3, "to": prev, "tx": 29.4, "ty": 11},
                  {"x": W - 0.6, "y": 25, "w": 0.6, "h": 3, "to": nxt, "tx": Z[nxt]["start"]["x"], "ty": Z[nxt]["start"]["y"]}],
        "npcs": [], "spawns": spawns, "start": {"x": 2.6, "y": 17.5},
    }

def grp(t, n, lv, x, y, w, h): return {"type": t, "count": n, "level": lv, "area": {"x": x, "y": y, "w": w, "h": h}}

new = {
  "himmapan_edge": ("camp_hunter", "himmapan", sub("ชายป่าหิมพานต์", "forest", "forest", 61, "camp_hunter", "himmapan",
      [grp("monkey", 6, [6, 7], 4, 2, 14, 30), grp("naga_noi", 5, [7, 8], 22, 10, 16, 24), grp("khotchasi", 5, [7, 8], 22, 0, 30, 6),
       grp("hatsadi", 3, [8, 9], 44, 8, 18, 16), grp("monkey", 4, [8, 9], 44, 28, 18, 8)],
      [{"type": "tree_big", "count": 60}, {"type": "tree_banana", "count": 18}, {"type": "bush", "count": 36}, {"type": "flower", "count": 26}, {"type": "rock", "count": 10}])),
  "snow_valley": ("hermitage", "kailash", sub("หุบหิมะเชิงไกรลาส", "snow", "mountain", 67, "hermitage", "kailash",
      [grp("kumbhan", 6, [12, 13], 4, 2, 14, 30), grp("kinnorn", 5, [12, 14], 22, 10, 16, 24), grp("garuda_chick", 5, [13, 14], 22, 0, 30, 6),
       grp("kumbhan", 4, [13, 14], 44, 8, 18, 16), grp("kinnorn", 3, [14, 14], 44, 28, 18, 8)],
      [{"type": "snow_pine", "count": 54}, {"type": "ice_crystal", "count": 20}, {"type": "rock", "count": 18}])),
  "nandana": ("sky_sala", "tavatimsa", sub("สวนนันทวัน", "cloud", "heaven", 79, "sky_sala", "tavatimsa",
      [grp("apsara", 6, [16, 17], 4, 2, 14, 30), grp("deva_warrior", 5, [16, 17], 22, 10, 16, 24), grp("erawan_calf", 4, [17, 18], 22, 0, 30, 6),
       grp("apsara", 4, [17, 18], 44, 8, 18, 16), grp("deva_warrior", 3, [17, 18], 44, 28, 18, 8)],
      [{"type": "cloud_puff", "count": 44}, {"type": "flower", "count": 40}])),
}
order = []
for k in Z:
    if k in new: continue
    order.append(k)
    for nid, (town, _, _) in new.items():
        if k == town: order.append(nid)
Z2 = {k: (new[k][2] if k in new else Z[k]) for k in order}
for nid, (town, nxt, z) in new.items():
    for e in Z2[town]['exits']:                                       # เมือง → พื้นที่ย่อย
        if e['to'] in (nxt, nid): e['to'], e['tx'], e['ty'] = nid, 2.6, 17.5
    for e in Z2[nxt]['exits']:                                        # พื้นที่บอส → ย้อนกลับมาพื้นที่ย่อย
        if e['to'] in (town, nid): e['to'], e['tx'], e['ty'] = nid, W - 2.6, 26.5
json.dump(Z2, open('data/zones.json', 'w'), ensure_ascii=False, indent=1)
print('ok', list(Z2))
