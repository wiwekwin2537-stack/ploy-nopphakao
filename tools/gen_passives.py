# สร้าง data/passives.json (ต้นพาสซีฟ) — แก้ค่าที่นี่แล้วรันใหม่: python3 tools/gen_passives.py
import json, math

nodes = {}
def add(id, x, y, kind, name, stats, cls=None):
    nodes[id] = {"x": round(x), "y": round(y), "kind": kind, "name": name, "stats": stats, "links": []}
    if cls: nodes[id]["class"] = cls
def link(a, b):
    if b not in nodes[a]["links"]: nodes[a]["links"].append(b)
    if a not in nodes[b]["links"]: nodes[b]["links"].append(a)
def polar(r, deg): a = math.radians(deg); return r * math.cos(a), r * math.sin(a)

CLASSES = {
    "warrior": {"deg": -90, "name": "นักรบ", "desc": "ดาบหนัก เลือดเยอะ",
        "small": [("กำลังแขน", {"dmgMelee": 8}), ("กายแกร่ง", {"hpFlat": 14}), ("ฟันหนัก", {"dmgMelee": 8})],
        "smallB": [("หนังเหนียว", {"hpInc": 5}), ("เลือดร้อน", {"lifeOnHit": 1}), ("กายแกร่ง", {"hpFlat": 14})],
        "notA": ("แขนพระยาช้าง", {"dmgMelee": 25, "atkSpeedInc": 5}),
        "notB": ("ผิวดั่งเกราะเพชร", {"hpInc": 15, "lifeOnHit": 2}),
        "key": ("จิตคชสาร", {"ks": "elephant"}, "ดาเมจดาบ ×1.5 แต่ดาเมจพลอย ×0.7")},
    "ranger": {"deg": 150, "name": "พราน", "desc": "เร็ว คริติคอลแรง",
        "small": [("ฝีเท้าเบา", {"moveInc": 4}), ("ตาไว", {"crit": 2}), ("มือไว", {"atkSpeedInc": 5})],
        "smallB": [("หลบหลีก", {"dashCdInc": -8}), ("ฝีเท้าเบา", {"moveInc": 4}), ("ตาไว", {"crit": 2})],
        "notA": ("สายตาพญาเหยี่ยว", {"crit": 6, "critMult": 30}),
        "notB": ("ฝีเท้าลมกรด", {"moveInc": 10, "dashCdInc": -25}),
        "key": ("เพชฌฆาตเงา", {"ks": "shadow"}, "โอกาสคริติคอล ×2 แต่เลือดสูงสุด ×0.8")},
    "shaman": {"deg": 30, "name": "หมอผี", "desc": "พลังพลอยและมานา",
        "small": [("มนต์แรง", {"dmgSpell": 8}), ("ใจสงบ", {"mpFlat": 10}), ("มนต์แรง", {"dmgSpell": 8})],
        "smallB": [("ลมหายใจฤๅษี", {"mpRegenInc": 12}), ("ร่ายไว", {"castSpeedInc": 4}), ("ใจสงบ", {"mpFlat": 10})],
        "notA": ("ยันต์เก้ายอด", {"dmgSpell": 25, "areaInc": 15}),
        "notB": ("สมาธิฤๅษี", {"mpRegenInc": 30, "mpInc": 15, "castSpeedInc": 8}),
        "key": ("มนต์เลือดแลก", {"ks": "blood"}, "สกิลพลอยใช้เลือดแทนมานา")},
}
R_START = 300
for cid, c in CLASSES.items():
    d = c["deg"]
    sx, sy = polar(R_START, d)
    add(cid, sx, sy, "start", c["name"], {}, cid)
    # สองแขนงข้างจุดเริ่ม (ออกด้านนอกเฉียงซ้าย/ขวา) จบที่โน้ตเด่น
    for tag, side, smalls, nt in (("a", -1, c["small"], c["notA"]), ("b", 1, c["smallB"], c["notB"])):
        prev = cid
        for i, (nm, st) in enumerate(smalls):
            x, y = polar(R_START + 40 + i * 42, d + side * (16 + i * 9))
            nid = f"{cid}_{tag}{i}"; add(nid, x, y, "small", nm, st); link(prev, nid); prev = nid
        x, y = polar(R_START + 175, d + side * 44)
        nid = f"{cid}_{tag}N"; add(nid, x, y, "notable", nt[0], nt[1]); link(prev, nid)
    # แขนงตรงออกนอกสุด → คีย์สโตน (ผ่าน 2 โหนด)
    prev = cid
    for i in range(2):
        x, y = polar(R_START + 70 + i * 60, d)
        nid = f"{cid}_k{i}"; add(nid, x, y, "small", "พลังดั้งเดิม", {"dmgAll": 4}); link(prev, nid); prev = nid
    link(f"{cid}_k0", f"{cid}_a0"); link(f"{cid}_k0", f"{cid}_b0")   # แขนงคีย์สโตนเข้าได้จากแขนงข้าง
    kx, ky = polar(R_START + 210, d)
    k = c["key"]; add(f"{cid}_K", kx, ky, "keystone", k[0], k[1]); nodes[f"{cid}_K"]["desc"] = k[2]; link(prev, f"{cid}_K")
    # ทางเข้าวงใน
    ix, iy = polar(R_START - 85, d)
    add(f"{cid}_in", ix, iy, "small", "ทางสู่ใจกลาง", {"hpFlat": 6, "mpFlat": 4}); link(cid, f"{cid}_in")

# วงใน 6 โหนด เชื่อมทุกสาย (เดินข้ามสายได้แบบ PoE)
ring = []
for i in range(6):
    deg = -90 + i * 60
    x, y = polar(130, deg)
    nid = f"core{i}"
    stats = [{"dmgAll": 5}, {"hpInc": 4, "mpInc": 4}, {"dmgAll": 5}, {"crit": 1.5}, {"dmgAll": 5}, {"castSpeedInc": 3, "atkSpeedInc": 3}][i]
    add(nid, x, y, "small", ["แก่นพลัง", "สมดุล", "แก่นพลัง", "ไหวพริบ", "แก่นพลัง", "จังหวะ"][i], stats); ring.append(nid)
for i in range(6): link(ring[i], ring[(i + 1) % 6])
link("warrior_in", "core0"); link("shaman_in", "core2"); link("ranger_in", "core4")
add("heart", 0, 0, "notable", "หัวใจหิมพานต์", {"dmgAll": 10, "hpInc": 6, "mpInc": 6})
for r in (1, 3, 5): link("heart", ring[r])

# ทางเชื่อมระหว่างสายด้านนอก (สายผสม)
HYB = [("warrior", "ranger", "นักดาบเงา", {"atkSpeedInc": 10, "dmgMelee": 10}, {"atkSpeedInc": 4}),
       ("ranger", "shaman", "พลอยพุ่งไว", {"projSpeedInc": 20, "dmgSpell": 12}, {"projSpeedInc": 8}),
       ("shaman", "warrior", "ร่างอมตะ", {"hpInc": 10, "mpInc": 10, "lifeOnHit": 2}, {"hpFlat": 8, "mpFlat": 6})]
for a, b, nm, nst, sst in HYB:
    da, db = CLASSES[a]["deg"], CLASSES[b]["deg"]
    delta = ((db - da + 540) % 360) - 180          # ทางสั้น (120°) ไม่อ้อมผ่านสายที่สาม
    pts = []
    for i, t in enumerate((0.3, 0.5, 0.7)):
        x, y = polar(R_START - 10, da + delta * t)
        nid = f"hyb_{a}_{b}{i}"
        add(nid, x, y, "notable" if i == 1 else "small", nm if i == 1 else "สายผสม", nst if i == 1 else sst); pts.append(nid)
    link(a, pts[0]); link(pts[0], pts[1]); link(pts[1], pts[2]); link(pts[2], b)
    # ทางเข้าแขนงข้างของแต่ละสายจากทางผสม (สายอื่นเดินเข้ามาได้โดยไม่ต้องผ่านจุดเริ่ม)
    sa = "b" if delta > 0 else "a"; sb = "a" if delta > 0 else "b"
    link(pts[0], f"{a}_{sa}0"); link(pts[2], f"{b}_{sb}0")

data = {"pointsPerLevel": 1, "nodes": nodes,
        "classes": {k: {"name": v["name"], "desc": v["desc"]} for k, v in CLASSES.items()},
        "statNames": {"dmgMelee": "ดาเมจดาบ +{}%", "dmgSpell": "ดาเมจพลอย +{}%", "dmgAll": "ดาเมจทั้งหมด +{}%", "hpFlat": "เลือด +{}", "hpInc": "เลือดสูงสุด +{}%",
                      "mpFlat": "มานา +{}", "mpInc": "มานาสูงสุด +{}%", "mpRegenInc": "ฟื้นมานา +{}%", "moveInc": "ความเร็วเดิน +{}%", "atkSpeedInc": "ความเร็วฟัน +{}%",
                      "castSpeedInc": "ความเร็วร่าย +{}%", "crit": "โอกาสคริติคอล +{}%", "critMult": "แรงคริติคอล +{}%", "lifeOnHit": "ฟันโดนฟื้นเลือด {}",
                      "dashCdInc": "คูลดาวน์หลบ {}%", "areaInc": "วงระเบิด +{}%", "projSpeedInc": "ความเร็วกระสุน +{}%"}}
json.dump(data, open("data/passives.json", "w"), ensure_ascii=False, indent=1)
print(len(nodes), "nodes")
