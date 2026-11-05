# ตัวช่วยสร้างพื้นที่ที่ใช้ร่วมกันของ gen_towns.py / gen_subzones.py / gen_acts56.py (ไม่อ่าน/เขียนไฟล์เอง)
# เมืองของบท 32x22 (ศาลวาร์ป หีบเก็บของ ศาลา ร้าน) · พื้นที่ย่อย 64x36 (ทางคดเคี้ยว ศาลวาร์ปกลางทาง)
W, H = 64, 36

def town(tid, name, ground, music, prev, prev_t, nxt, nxt_t, npcs, deco, scatter, seed):
    W, H = 32, 22
    objs = [
        {"type": "waypoint", "x": 8, "y": 7.6, "w": 1, "h": 0.7, "solid": False, "label": "ศาลวาร์ป"},
        {"type": "stash", "x": 11, "y": 7.7, "w": 1.2, "h": 0.7, "label": "หีบเก็บของ"},
        {"type": "sala", "x": 17, "y": 3.6, "w": 6, "h": 3, "label": "ศาลา" + npcs[0]["name"]},
        {"type": "stall", "x": 14, "y": 13.6, "w": 4, "h": 2, "label": "ร้าน" + npcs[1]["name"]},
        {"type": "craft_bench", "x": 21.5, "y": 13.8, "w": 1.6, "h": 0.8, "label": "โต๊ะช่าง"},
    ] + [{"type": "lantern", "x": x, "y": y, "w": 0.4, "h": 0.4} for x, y in [(5, 8.2), (26, 8.2), (5, 13.2), (26, 13.2)]] + deco
    return {
        "name": name, "w": W, "h": H, "ground": ground, "music": music, "safe": True, "seed": seed,
        "roads": [{"x": 0, "y": 9.5, "w": W, "h": 3}, {"x": 13.5, "y": 6.5, "w": 12, "h": 9}],
        "water": [], "objects": objs, "scatter": scatter,
        "exits": [
            {"x": 0, "y": 9.5, "w": 0.6, "h": 3, "to": prev, "tx": prev_t[0], "ty": prev_t[1]},
            {"x": W - 0.6, "y": 9.5, "w": 0.6, "h": 3, "to": nxt, "tx": nxt_t[0], "ty": nxt_t[1]},
        ],
        "npcs": npcs, "spawns": [], "start": {"x": 2.6, "y": 11},
    }

def npc(i, name, look, x, y, shop=False):
    d = {"id": i, "name": name, "look": look, "x": x, "y": y}
    if shop: d["shop"] = True
    return d

def sub(name, ground, music, seed, prev, nxt, spawns, scatter, nxt_start):
    roads = [{"x": 0, "y": 16, "w": 21, "h": 3}, {"x": 18, "y": 6, "w": 3, "h": 13}, {"x": 18, "y": 6, "w": 24, "h": 3},
             {"x": 39, "y": 6, "w": 3, "h": 22}, {"x": 39, "y": 25, "w": 25, "h": 3}]
    full = {"x": 0, "y": 0, "w": W, "h": H}
    return {
        "name": name, "w": W, "h": H, "ground": ground, "music": music, "safe": False, "seed": seed, "water": [], "roads": roads,
        "objects": [{"type": "waypoint", "x": 29, "y": 9.4, "w": 1, "h": 0.7, "solid": False, "label": "ศาลวาร์ป"}],
        "scatter": [{**s, "area": full} for s in scatter],
        "exits": [{"x": 0, "y": 16, "w": 0.6, "h": 3, "to": prev, "tx": 29.4, "ty": 11},
                  {"x": W - 0.6, "y": 25, "w": 0.6, "h": 3, "to": nxt, "tx": nxt_start["x"], "ty": nxt_start["y"]}],
        "npcs": [], "spawns": spawns, "start": {"x": 2.6, "y": 17.5},
    }

def grp(t, n, lv, x, y, w, h): return {"type": t, "count": n, "level": lv, "area": {"x": x, "y": y, "w": w, "h": h}}

