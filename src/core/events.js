// ช่องทางเดียวที่ระบบต่างๆ ใช้คุยกัน — ห้ามห่อฟังก์ชันของระบบอื่น ให้ฟัง event แทน
export function createEvents() {
  const handlers = new Map();
  return {
    on(name, fn) {
      if (!handlers.has(name)) handlers.set(name, []);
      handlers.get(name).push(fn);
      return () => {
        const list = handlers.get(name);
        const i = list.indexOf(fn);
        if (i >= 0) list.splice(i, 1);
      };
    },
    emit(name, payload) {
      const list = handlers.get(name);
      if (!list) return;
      for (const fn of list.slice()) fn(payload);
    },
    clear() { handlers.clear(); },
  };
}
