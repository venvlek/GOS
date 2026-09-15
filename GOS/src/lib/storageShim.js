// Minimal localStorage-backed stand-in for window.storage, so this app
// can run outside the Claude Artifact sandbox. Loaded once from main.jsx.
if (typeof window !== 'undefined' && !window.storage) {
  const read = () => {
    try { return JSON.parse(localStorage.getItem('gos-storage') || '{}'); }
    catch { return {}; }
  };
  const write = (db) => localStorage.setItem('gos-storage', JSON.stringify(db));

  window.storage = {
    async get(key) {
      const db = read();
      return key in db ? { key, value: db[key] } : null;
    },
    async set(key, value) {
      const db = read();
      db[key] = value;
      write(db);
      return { key, value };
    },
    async delete(key) {
      const db = read();
      const existed = key in db;
      delete db[key];
      write(db);
      return { key, deleted: existed };
    },
    async list(prefix = '') {
      const db = read();
      return { keys: Object.keys(db).filter((k) => k.startsWith(prefix)) };
    },
  };
}
