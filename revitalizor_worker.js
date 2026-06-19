// ViArtificial OS — revitalizor.worker.js
// Web Worker : déporte le travail LOURD hors du thread principal -> UI/FPS fluides.
// HONNÊTE : tourne sur un autre cœur RÉEL du device. Sandbox respectée (OPFS uniquement).
// Messages : { id, type:'hash'|'save', payload }

self.onmessage = async (e) => {
  const { id, type, payload } = e.data;
  try {
    if (type === 'hash') {
      const h = await crypto.subtle.digest('SHA-256', payload.bytes);
      const hex = [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
      self.postMessage({ id, ok: true, result: hex });

    } else if (type === 'save') {
      const root = await navigator.storage.getDirectory();
      const parts = payload.path.replace(/^\/+/, '').split('/').filter(Boolean);
      const name = parts.pop();
      let dir = root;
      for (const p of parts) dir = await dir.getDirectoryHandle(p, { create: true });
      const fh = await dir.getFileHandle(name, { create: true });
      const w = await fh.createWritable();

      const bytes = payload.bytes;
      const chunk = payload.chunkBytes || (1 << 20); // 1 Mo : sauvegarde chunkée (pas de gel UI)
      for (let off = 0; off < bytes.length; off += chunk) {
        await w.write(bytes.subarray(off, Math.min(off + chunk, bytes.length)));
        self.postMessage({ id, progress: Math.min(1, (off + chunk) / bytes.length) });
      }
      await w.close();
      self.postMessage({ id, ok: true, result: { saved: payload.path, bytes: bytes.length } });

    } else {
      self.postMessage({ id, ok: false, error: `type inconnu: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err) });
  }
};
