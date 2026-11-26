/* 로컬 저장소 (서버 없음)
 * 기기 내부 저장소(localStorage)를 사용합니다. Capacitor 로 APK를 만들어도 그대로 동작합니다.
 * 나중에 SQLite 등으로 바꾸고 싶다면 이 파일의 get/set/remove 만 교체하면 됩니다.
 */
(function () {
  const PREFIX = 'lifecalc.';
  const memory = {}; // localStorage 를 쓸 수 없는 환경(일부 사생활 보호 모드)용 대체 저장소

  function raw() {
    try { const t = '__t'; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; }
    catch (e) { return null; }
  }
  const ls = raw();

  const store = {
    get(key, fallback) {
      try {
        const v = ls ? ls.getItem(PREFIX + key) : memory[key];
        if (v === null || v === undefined) return clone(fallback);
        return JSON.parse(v);
      } catch (e) { return clone(fallback); }
    },
    set(key, value) {
      const v = JSON.stringify(value);
      try { if (ls) ls.setItem(PREFIX + key, v); else memory[key] = v; } catch (e) { memory[key] = v; }
    },
    remove(key) {
      try { if (ls) ls.removeItem(PREFIX + key); } catch (e) {}
      delete memory[key];
    },
    // 특정 접두어로 시작하는 저장값 모두 삭제 (keep 은 남김)
    removePrefix(prefix, keep) {
      if (ls) Object.keys(ls).filter(k => k.startsWith(PREFIX + prefix) && k !== PREFIX + keep).forEach(k => ls.removeItem(k));
      Object.keys(memory).filter(k => k.startsWith(prefix) && k !== keep).forEach(k => delete memory[k]);
    },
    clearAll() {
      if (ls) Object.keys(ls).filter(k => k.startsWith(PREFIX)).forEach(k => ls.removeItem(k));
      Object.keys(memory).forEach(k => delete memory[k]);
    },

    /* 간단한 컬렉션(테이블) 헬퍼 — D-day 목록, 계산 기록 등에 사용 */
    collection(name) {
      return {
        all() { return store.get('col.' + name, []); },
        save(list) { store.set('col.' + name, list); },
        add(item) {
          const list = this.all();
          item.id = item.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
          item.createdAt = item.createdAt || Date.now();
          list.push(item); this.save(list); return item;
        },
        update(id, patch) {
          const list = this.all().map(it => it.id === id ? Object.assign({}, it, patch, { updatedAt: Date.now() }) : it);
          this.save(list);
        },
        remove(id) { this.save(this.all().filter(it => it.id !== id)); },
        clear() { this.save([]); }
      };
    }
  };

  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  LC.store = store;
})();
