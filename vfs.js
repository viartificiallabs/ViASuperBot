// ViArtificial OS — vfs.js
// Système de fichiers virtuel sur OPFS (sandbox du navigateur). Marche sur iOS Safari récent.
// HONNÊTE : c'est le stockage PRIVÉ de l'app, PAS le disque système ni les autres apps.
// Repli mémoire si OPFS indispo.

export class VFS {
  constructor() {
    this.root = null;
    this.mode = 'memory';
    this._mem = new Map(); // chemin -> Uint8Array (repli)
  }

  async init() {
    try {
      if (navigator?.storage?.getDirectory) {
        this.root = await navigator.storage.getDirectory();
        this.mode = 'opfs';
      }
    } catch { this.mode = 'memory'; }
    return this.mode;
  }

  _split(path) { return path.replace(/^\/+/, '').split('/').filter(Boolean); }

  async _dir(parts, create) {
    let dir = this.root;
    for (const p of parts) dir = await dir.getDirectoryHandle(p, { create });
    return dir;
  }

  async mkdir(path) {
    if (this.mode !== 'opfs') return true;
    await this._dir(this._split(path), true);
    return true;
  }

  async writeFile(path, data) {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    if (this.mode !== 'opfs') { this._mem.set(this._split(path).join('/'), bytes); return true; }
    const parts = this._split(path);
    const name = parts.pop();
    const dir = await this._dir(parts, true);
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(bytes);
    await w.close();
    return true;
  }

  async readFile(path) {
    const key = this._split(path).join('/');
    if (this.mode !== 'opfs') {
      if (!this._mem.has(key)) throw new Error(`VFS: introuvable ${path}`);
      return this._mem.get(key);
    }
    const parts = this._split(path);
    const name = parts.pop();
    const dir = await this._dir(parts, false);
    const fh = await dir.getFileHandle(name, { create: false });
    const file = await fh.getFile();
    return new Uint8Array(await file.arrayBuffer());
  }

  async readText(path) { return new TextDecoder().decode(await this.readFile(path)); }

  async exists(path) {
    try { await this.readFile(path); return true; } catch { return false; }
  }

  async remove(path) {
    const key = this._split(path).join('/');
    if (this.mode !== 'opfs') return this._mem.delete(key);
    const parts = this._split(path);
    const name = parts.pop();
    const dir = await this._dir(parts, false);
    await dir.removeEntry(name, { recursive: true });
    return true;
  }

  async list(path = '/') {
    if (this.mode !== 'opfs') {
      const pref = this._split(path).join('/');
      return [...this._mem.keys()].filter(k => k.startsWith(pref)).map(name => ({ name, kind: 'file' }));
    }
    const dir = await this._dir(this._split(path), false);
    const out = [];
    for await (const [name, handle] of dir.entries()) out.push({ name, kind: handle.kind });
    return out;
  }
}
