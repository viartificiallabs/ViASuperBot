// ViArtificial OS — store.js
// État partagé réactif + SLC SYNC : "jamais écraser, toujours superposer".

export class Store {
  constructor(initial = {}, { maxLayers = 100 } = {}) {
    this._state = { ...initial };
    this._subs = new Set();
    this._layers = [];        // historique (superposition SLC SYNC)
    this._maxLayers = maxLayers;
  }

  get() { return this._state; }
  select(fn) { return fn(this._state); }

  patch(partial) {
    this._state = { ...this._state, ...partial };
    this._notify();
    return this._state;
  }

  subscribe(fn) { this._subs.add(fn); return () => this._subs.delete(fn); }

  // SLC SYNC : pousse une couche (snapshot) sans rien détruire.
  superpose(label = '') {
    this._layers.push({ t: Date.now(), label, snapshot: { ...this._state } });
    if (this._layers.length > this._maxLayers) this._layers.shift();
  }

  layers() { return this._layers; }

  // Remonter le temps énergétique : restaure une couche (depuis la fin).
  rewind(back = 1) {
    const i = this._layers.length - back;
    if (i < 0) return null;
    this._state = { ...this._layers[i].snapshot };
    this._notify();
    return this._state;
  }

  _notify() {
    for (const fn of [...this._subs]) {
      try { fn(this._state); } catch (e) { console.error('[store]', e); }
    }
  }
}
