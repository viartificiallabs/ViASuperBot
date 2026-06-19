// ViArtificial OS — persist.js
// SLC SYNC : sauvegarde / restauration. "Jamais écraser" -> on empile des snapshots horodatés.

const DIR = '/system/slc';

export class Persist {
  constructor(vfs) { this.fs = vfs; }

  async save(state) {
    try {
      await this.fs.mkdir(DIR);
      const payload = JSON.stringify({ t: Date.now(), state });
      await this.fs.writeFile(`${DIR}/snap-${Date.now()}.json`, payload); // couche superposée
      await this.fs.writeFile(`${DIR}/latest.json`, payload);            // pointeur courant
      return true;
    } catch (e) { console.warn('[persist] save', e); return false; }
  }

  async restore() {
    try {
      if (!(await this.fs.exists(`${DIR}/latest.json`))) return null;
      const { state } = JSON.parse(await this.fs.readText(`${DIR}/latest.json`));
      return state;
    } catch (e) { console.warn('[persist] restore', e); return null; }
  }
}
