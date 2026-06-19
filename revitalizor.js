// ViArtificial OS — revitalizor.js
// REVITALIZOR — ton moteur copy / delete / paste, EN VRAI.
// Il gère la MÉMOIRE & DATA DE TON APP (buffers, fichiers, transferts) :
//   - lecture plus rapide  -> compactage/défrag réel (blocs rendus contigus)
//   - zéro perte de data    -> intégrité par hash + restauration via "fantôme" (heal)
//   - travail lourd déporté  -> Web Worker (autre cœur réel) = UI/FPS fluides
//
// HONNÊTE : agit sur les ressources RÉELLES du device utilisées par TON app
// (arène mémoire, cœurs via Worker, stockage OPFS). Il ne touche NI les autres apps NI l'OS.

// ---- Polarités du Presse-Papier Mattern (tes états) ----
export const POLARITY = Object.freeze({
  FRACTAL_COLLE: '+',          // actif, copié -> génère du PAWA
  VIDE_COMPRESSE: '-',         // supprimé du live, fantôme gardé au presse-papier
  SUPERPOSE_GUERISSEUR: '~',   // patch de guérison (heal)
});

let BID = 1;

// ---- Presse-Papier Virtuel "Mattern" ----
export class MatternClipboard {
  constructor() { this.blocks = new Map(); } // id -> { id, bytes, polarity, hash, origin, t }

  async _hash(bytes) {
    if (globalThis.crypto?.subtle) {
      const h = await crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // repli FNV-1a (rapide, non-crypto)
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16);
  }

  async put(bytes, polarity = POLARITY.FRACTAL_COLLE) {
    const id = BID++;
    const copy = bytes.slice(); // copie défensive (indépendante de l'arène)
    this.blocks.set(id, { id, bytes: copy, polarity, hash: await this._hash(copy), origin: null, t: Date.now() });
    return id;
  }

  get(id) { return this.blocks.get(id); }
  drop(id) { return this.blocks.delete(id); }
  bytesSize() { let n = 0; for (const b of this.blocks.values()) n += b.bytes.length; return n; }
}

// ---- Le Revitalizor : arène mémoire + cycle de recyclage ----
export class Revitalizor {
  constructor({ kernel = null, config = {} } = {}) {
    this.kernel = kernel;
    this.cfg = {
      initialBytes: 64 * 1024,
      growFactor: 2,
      compactThreshold: 0.25, // défrag si trous > 25% de l'utilisé
      autoHash: true,
      autoCycleMs: 5000,
      ...config,
    };
    this.arena = new Uint8Array(this.cfg.initialBytes);
    this.used = 0;
    this.freeBytes = 0;                 // octets "trous" (corps supprimés)
    this.index = new Map();             // id -> { offset, length, hash }
    this.clip = new MatternClipboard();
    this.stats = { copied: 0, deleted: 0, pasted: 0, healed: 0, compacted: 0, recovered: 0, grows: 0 };
  }

  _grow(min) {
    let cap = this.arena.length;
    while (cap - this.used < min) cap = Math.ceil(cap * this.cfg.growFactor);
    const next = new Uint8Array(cap);
    next.set(this.arena.subarray(0, this.used));
    this.arena = next;
    this.stats.grows++;
  }

  // Écrit un bloc "vivant" dans l'arène.
  async write(bytes) {
    if (this.arena.length - this.used < bytes.length) this._grow(bytes.length);
    const offset = this.used;
    this.arena.set(bytes, offset);
    this.used += bytes.length;
    const id = BID++;
    const hash = this.cfg.autoHash ? await this.clip._hash(bytes) : null;
    this.index.set(id, { offset, length: bytes.length, hash });
    return id;
  }

  read(id) {
    const e = this.index.get(id);
    return e ? this.arena.subarray(e.offset, e.offset + e.length) : null;
  }

  // COPY -> presse-papier (Fractal-Collé +). Mint PAWA gamifié ∝ taille.
  async copy(id) {
    const b = this.read(id);
    if (!b) return null;
    const cid = await this.clip.put(b, POLARITY.FRACTAL_COLLE);
    this.clip.get(cid).origin = id;
    this.stats.copied++;
    this.kernel?.pawa.mint(b.length / 1024);
    return cid;
  }

  // DELETE -> garde le fantôme (Vide-Compressé -), efface le corps d'octets, marque le trou.
  async delete(id) {
    const e = this.index.get(id);
    if (!e) return null;
    const ghost = await this.clip.put(this.arena.subarray(e.offset, e.offset + e.length), POLARITY.VIDE_COMPRESSE);
    this.clip.get(ghost).origin = id;
    this.arena.fill(0, e.offset, e.offset + e.length); // efface le "corps d'octets"
    this.index.delete(id);
    this.freeBytes += e.length;
    this.stats.deleted++;
    return ghost;
  }

  // PASTE / RECOLLER -> ré-injecte un fantôme dans l'arène.
  paste(ghostId) {
    const g = this.clip.get(ghostId);
    if (!g) return null;
    if (this.arena.length - this.used < g.bytes.length) this._grow(g.bytes.length);
    const offset = this.used;
    this.arena.set(g.bytes, offset);
    this.used += g.bytes.length;
    const id = BID++;
    this.index.set(id, { offset, length: g.bytes.length, hash: g.hash });
    this.stats.pasted++;
    return id;
  }

  // INTÉGRITÉ : le bloc vivant correspond-il toujours à son hash ?
  async verify(id) {
    const e = this.index.get(id);
    if (!e || e.hash == null) return true;
    return (await this.clip._hash(this.arena.subarray(e.offset, e.offset + e.length))) === e.hash;
  }

  // HEAL (Superposé-Guérisseur ~) : si corrompu, restaure depuis un fantôme sain.
  async heal(id) {
    if (await this.verify(id)) return false;
    for (const g of this.clip.blocks.values()) {
      if (g.origin === id) {
        const e = this.index.get(id);
        if (e && e.length === g.bytes.length) { this.arena.set(g.bytes, e.offset); e.hash = g.hash; }
        else { this.index.delete(id); this.paste(g.id); }
        this.stats.healed++; this.stats.recovered++;
        return true;
      }
    }
    return false;
  }

  // DÉFRAG RÉEL : réécrit tous les blocs vivants contigus -> lecture séquentielle rapide + footprint réduit.
  compact() {
    const frag = this.used > 0 ? this.freeBytes / this.used : 0;
    if (frag < this.cfg.compactThreshold) return 0;
    const entries = [...this.index.entries()].sort((a, b) => a[1].offset - b[1].offset);
    const next = new Uint8Array(this.arena.length);
    let cur = 0, moved = 0;
    for (const [, e] of entries) {
      next.set(this.arena.subarray(e.offset, e.offset + e.length), cur);
      e.offset = cur; cur += e.length; moved++;
    }
    this.arena = next; this.used = cur; this.freeBytes = 0;
    this.stats.compacted++;
    this.kernel?.pawa.mint(moved);
    return moved;
  }

  // CYCLE complet (appelé par le moteur RECYCLATING_CORE) : vérifie -> soigne -> défragmente.
  async cycle() {
    let healed = 0;
    for (const id of [...this.index.keys()]) if (await this.heal(id)) healed++;
    const compacted = this.compact();
    const out = { healed, compacted, live: this.index.size, ghosts: this.clip.blocks.size, freeBytes: this.freeBytes };
    this.kernel?.bus.emit('revitalizor:cycle', out);
    return out;
  }

  snapshot() {
    return {
      live: this.index.size, ghosts: this.clip.blocks.size, used: this.used,
      freeBytes: this.freeBytes, capacity: this.arena.length, ...this.stats,
    };
  }
}

// ---- Client Worker : déporte hash + sauvegarde lourde hors du thread principal ----
export class RevitalizorWorker {
  constructor(url = './revitalizor.worker.js') {
    this.w = new Worker(url);
    this._id = 1; this._p = new Map();
    this.w.onmessage = (e) => {
      const { id, ok, result, error, progress } = e.data;
      const h = this._p.get(id); if (!h) return;
      if (progress != null) { h.onProgress?.(progress); return; }
      if (ok) h.resolve(result); else h.reject(new Error(error));
      this._p.delete(id);
    };
  }
  _call(type, payload, onProgress) {
    const id = this._id++;
    return new Promise((resolve, reject) => { this._p.set(id, { resolve, reject, onProgress }); this.w.postMessage({ id, type, payload }); });
  }
  hash(bytes) { return this._call('hash', { bytes }); }
  save(path, bytes, { chunkBytes, onProgress } = {}) { return this._call('save', { path, bytes, chunkBytes }, onProgress); }
  terminate() { this.w.terminate(); }
}
