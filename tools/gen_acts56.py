# บท 5 เมืองบาดาล และบท 6 กรุงลงกา (แบบ PoE: เมืองของบท → พื้นที่ย่อยมีศาลวาร์ป → พื้นที่บอส)
# ทางเข้า: ดาวดึงส์ฝั่งตะวันออก (บันไดนาค เปิดเมื่อล้มท้าวเวสสุวรรณ) → ท่าน้ำนาคินทร์ → ถ้ำธารบาดาล → นครบาดาล
#          นครบาดาลฝั่งตะวันออก (ประตูน้ำวน เปิดเมื่อล้มพญานาคราช) → ค่ายพลับพลาริมสมุทร → ชายฝั่งลงกา → กรุงลงกา
# รันซ้ำได้ (gen_subzones.py เรียกไฟล์นี้ต่อให้เอง): เขียนทับเฉพาะพื้นที่ในไฟล์นี้ + ทางออกฝั่งตะวันออกของดาวดึงส์
import json
from zonelib import town, npc, sub, grp

Z = json.load(open('data/zones.json'))
BW, BH = 56, 42                                    # พื้นที่บอสขนาดเท่าดาวดึงส์

def boss_zone(name, ground, music, seed, prev, prev_t, deco, spawns, scatter, gate=None):
    roads = [{"x": 0, "y": 19, "w": 14, "h": 3}, {"x": 12, "y": 8, "w": 20, "h": 26}, {"x": 32, "y": 19, "w": 9, "h": 3}, {"x": 40, "y": 5, "w": 14, "h": 32}]
    objs = [{"type": "waypoint", "x": 6, "y": 17.4, "w": 1, "h": 0.7, "solid": False, "label": "ศาลวาร์ป"}] + deco
    objs += [{"type": "thicket", "x": 0, "y": 0, "w": BW, "h": 1.2}, {"type": "thicket", "x": 0, "y": BH - 1.2, "w": BW, "h": 1.2}]   # ขอบล่องหน (แบบดาวดึงส์)
    objs += ([{"type": "thicket", "x": 54.8, "y": 0, "w": 1.2, "h": 18.6}, {"type": "thicket", "x": 54.8, "y": 22.4, "w": 1.2, "h": 19.6}] if gate
             else [{"type": "thicket", "x": 54.8, "y": 0, "w": 1.2, "h": BH}])
    exits = [{"x": 0, "y": 19, "w": 0.6, "h": 3, "to": prev, "tx": prev_t[0], "ty": prev_t[1]}]
    if gate:                                       # ทางไปบทถัดไป: ประตูทึบจนกว่าจะล้มบอส (แบบประตูสวรรค์บนไกรลาส)
        roads.append({"x": 53, "y": 19, "w": 3, "h": 3})
        objs.append({"type": gate["type"], "x": 53.4, "y": 18.8, "w": 1.2, "h": 3.6, "untilFlag": gate["flag"], "label": gate["label"]})
        exits.append({"x": BW - 0.6, "y": 19, "w": 0.6, "h": 3, "to": gate["to"], "tx": 2.6, "ty": 11})
    full = {"x": 0, "y": 0, "w": BW, "h": BH}
    return {"name": name, "w": BW, "h": BH, "ground": ground, "music": music, "safe": False, "seed": seed, "roads": roads,
            "water": [{"x": 16, "y": 11, "w": 6, "h": 4}, {"x": 24, "y": 27, "w": 6, "h": 4}], "objects": objs,
            "scatter": [{**s, "area": full} for s in scatter], "exits": exits, "npcs": [], "spawns": spawns, "start": {"x": 2.6, "y": 20.5}}

def pillars(t): return [{"type": t, "x": x, "y": y, "w": 0.8, "h": 0.6} for x, y in [(13, 9), (30, 9), (13, 32), (30, 32), (41, 12), (52, 12), (41, 30), (52, 30)]]

TOWN_START = {"x": 2.6, "y": 17.5}
new = {
  # ---------- บท 5 · เมืองบาดาล ----------
  "naga_pier": town("naga_pier", "ท่าน้ำนาคินทร์", "abyss", "abyss", "tavatimsa", (52.6, 20.5), "badan_cave", (2.6, 17.5),
      [npc("nak_kham", "นาคคำ", "guard", 20, 8.2), npc("nang_mat", "นางมัจฉา", "merchant", 16, 16.4, True), npc("pu_tao", "ปู่เต่าเฒ่า", "elder", 28.5, 8.4)],
      [{"type": "pearl_lamp", "x": 3, "y": 3, "w": 0.6, "h": 0.4}, {"type": "pearl_lamp", "x": 28, "y": 3, "w": 0.6, "h": 0.4},
       {"type": "pearl_lamp", "x": 3, "y": 18, "w": 0.6, "h": 0.4}, {"type": "pearl_lamp", "x": 28, "y": 18, "w": 0.6, "h": 0.4}],
      [{"type": "sea_weed", "count": 20, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}, {"type": "coral", "count": 12, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}], 83),
  "badan_cave": sub("ถ้ำธารบาดาล", "abyss", "abyss", 89, "naga_pier", "badan",
      [grp("naga_soldier", 6, [21, 22], 4, 2, 14, 30), grp("mermaid", 5, [21, 23], 22, 10, 16, 24), grp("sea_crab", 5, [22, 23], 22, 0, 30, 6),
       grp("naga_soldier", 4, [22, 23], 44, 8, 18, 16), grp("mermaid", 3, [23, 23], 44, 28, 18, 8),
       {"type": "mermaid", "count": 1, "level": [24, 24], "area": {"x": 40, "y": 2, "w": 22, "h": 10}, "named": {"name": "นางเงือกน้ำวน", "flag": "q5_side_kill"}}],
      [{"type": "sea_weed", "count": 54}, {"type": "coral", "count": 30}, {"type": "rock", "count": 14}], {"x": 2.6, "y": 20.5}),
  "badan": boss_zone("นครบาดาล", "abyss", "abyss", 131, "badan_cave", (61.4, 26.5),
      [{"type": "temple", "x": 41, "y": 1.6, "w": 12, "h": 3.4, "label": "วังพญานาค"}] + pillars("pearl_lamp"),
      [grp("naga_soldier", 7, [24, 25], 13, 9, 18, 24), grp("mermaid", 6, [24, 25], 13, 9, 18, 24), grp("sea_crab", 5, [25, 26], 41, 20, 12, 14),
       grp("naga_soldier", 4, [25, 26], 41, 20, 12, 14), grp("naga_king", 1, [26, 26], 45, 8, 4, 3)],
      [{"type": "sea_weed", "count": 50}, {"type": "coral", "count": 34}],
      gate={"type": "sea_gate", "flag": "naga_kingSlain", "to": "lanka_camp", "label": "ประตูน้ำวนสู่ลงกา (ล้มพญานาคราชก่อน)"}),
  # ---------- บท 6 · กรุงลงกา ----------
  "lanka_camp": town("lanka_camp", "ค่ายพลับพลาริมสมุทร", "lanka", "town", "badan", (52.6, 20.5), "lanka_shore", (2.6, 17.5),
      [npc("phiphek", "พิเภก", "elder", 20, 8.2), npc("benyakai", "นางเบญกาย", "merchant", 16, 16.4, True), npc("hanuman", "หนุมาน", "guard", 28.5, 8.4)],
      [{"type": "hut", "x": 2, "y": 2, "w": 4, "h": 3}, {"type": "hut", "x": 24, "y": 15.5, "w": 4, "h": 3},
       {"type": "brazier", "x": 9, "y": 3, "w": 0.6, "h": 0.4}, {"type": "brazier", "x": 9, "y": 18, "w": 0.6, "h": 0.4}],
      [{"type": "tree_palm", "count": 12, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}, {"type": "rock", "count": 8, "area": {"x": 0, "y": 0, "w": 32, "h": 22}}], 101),
  "lanka_shore": sub("ชายฝั่งลงกา", "lanka", "lanka", 97, "lanka_camp", "lanka",
      [grp("lanka_yak", 6, [26, 27], 4, 2, 14, 30), grp("rakshasi", 5, [26, 28], 22, 10, 16, 24), grp("war_elephant", 5, [27, 28], 22, 0, 30, 6),
       grp("lanka_yak", 4, [27, 28], 44, 8, 18, 16), grp("rakshasi", 3, [28, 28], 44, 28, 18, 8),
       {"type": "war_elephant", "count": 1, "level": [29, 29], "area": {"x": 40, "y": 2, "w": 22, "h": 10}, "named": {"name": "ช้างศึกเอกทันต์", "flag": "q6_side_kill"}}],
      [{"type": "dead_tree", "count": 44}, {"type": "bone_pile", "count": 24}, {"type": "rock", "count": 16}], {"x": 2.6, "y": 20.5}),
  "lanka": boss_zone("กรุงลงกา", "lanka", "lanka", 149, "lanka_shore", (61.4, 26.5),
      [{"type": "temple", "x": 41, "y": 1.6, "w": 12, "h": 3.4, "label": "ปราสาทกรุงลงกา"}] + pillars("brazier"),
      [grp("lanka_yak", 7, [29, 30], 13, 9, 18, 24), grp("rakshasi", 6, [29, 30], 13, 9, 18, 24), grp("war_elephant", 5, [30, 31], 41, 20, 12, 14),
       grp("lanka_yak", 4, [30, 31], 41, 20, 12, 14), grp("thotsakan", 1, [31, 31], 45, 8, 4, 3)],
      [{"type": "dead_tree", "count": 40}, {"type": "bone_pile", "count": 26}, {"type": "rock", "count": 12}]),
}
for k, v in new.items(): Z[k] = v                 # ต่อท้ายลำดับเดิม (ลำดับใน zones.json = ลำดับในหน้าวาร์ป)

# ดาวดึงส์: เปิดช่องกำแพงพุ่มไม้ฝั่งตะวันออก + บันไดนาค (ทึบจนล้มท้าวเวสสุวรรณ) + ทางออกไปท่าน้ำนาคินทร์
tv = Z["tavatimsa"]
tv["objects"] = [o for o in tv["objects"] if not (o["type"] == "thicket" and o["x"] == 54.8) and o["type"] != "naga_stair"]
tv["objects"] += [{"type": "thicket", "x": 54.8, "y": 0, "w": 1.2, "h": 18.6}, {"type": "thicket", "x": 54.8, "y": 22.4, "w": 1.2, "h": 19.6},
                  {"type": "naga_stair", "x": 53.4, "y": 18.8, "w": 1.2, "h": 3.6, "untilFlag": "vessavanaSlain", "label": "บันไดนาคลงบาดาล (ล้มท้าวเวสสุวรรณก่อน)"}]
tv["roads"] = [r for r in tv["roads"] if not (r["x"] == 53 and r["y"] == 19)] + [{"x": 53, "y": 19, "w": 3, "h": 3}]
tv["exits"] = [e for e in tv["exits"] if e["to"] != "naga_pier"] + [{"x": BW - 0.6, "y": 19, "w": 0.6, "h": 3, "to": "naga_pier", "tx": 2.6, "ty": 11}]

json.dump(Z, open('data/zones.json', 'w'), ensure_ascii=False, indent=1)
print('ok acts 5-6', list(new))
