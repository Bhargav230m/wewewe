const SESSION_KEY = "baithak_session";

const session = {
  save(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  },

  load() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  update(patch) {
    const current = session.load() || {};
    session.save(Object.assign(current, patch));
  },

  clear() {
    localStorage.removeItem(SESSION_KEY);
  },

  requireOrRedirect() {
    const s = session.load();
    if (!s || !s.villageId || !s.username) {
      window.location.href = "/index.html";
      return null;
    }
    return s;
  },
};
