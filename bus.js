// ViArtificial OS — bus.js
// Réseau Maillé : bus d'événements pub/sub. La colonne de communication entre moteurs.

export class Bus {
  constructor() { this._m = new Map(); }

  // on(type, fn) -> retourne une fonction d'unsubscribe
  on(type, fn) {
    if (!this._m.has(type)) this._m.set(type, new Set());
    this._m.get(type).add(fn);
    return () => this.off(type, fn);
  }

  once(type, fn) {
    const off = this.on(type, (p, t) => { off(); fn(p, t); });
    return off;
  }

  off(type, fn) { this._m.get(type)?.delete(fn); }

  emit(type, payload) {
    const subs = this._m.get(type);
    if (subs) for (const fn of [...subs]) {
      try { fn(payload, type); } catch (e) { console.error(`[bus] ${type}`, e); }
    }
    // abonnés "wildcard"
    const wild = this._m.get('*');
    if (wild) for (const fn of [...wild]) {
      try { fn(payload, type); } catch (e) { console.error('[bus *]', e); }
    }
  }

  clear() { this._m.clear(); }
}
