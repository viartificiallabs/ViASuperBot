// ViArtificial OS — boot.js
// POINT D'ENTRÉE. L'interface (HTML/CSS ou canvas/WebGPU) viendra SÉPARÉMENT et importera ceci.
//
//   import { bootViArtificialOS } from './boot.js';
//   const ViA = await bootViArtificialOS();
//   ViA.launch('golemotor');
//   ViA.revitalizor                 // -> l'instance du Revitalizor
//
// À servir en https (GitHub Pages) ou localhost : modules + OPFS + fetch JSON l'exigent.

import { ViArtificialOS } from './kernel.js';
import { loadMotors } from './motors-loader.js';
import { Revitalizor } from './revitalizor.js';

export async function bootViArtificialOS(opts = {}) {
  const os = new ViArtificialOS(opts);

  // Revitalizor branché dans le moteur RECYCLATING_CORE (#15)
  const revitalizor = new Revitalizor({ kernel: os, config: opts.revitalizor || {} });
  os.revitalizor = revitalizor;

  // Enregistre les 26 moteurs (depuis les 26 JSON) AVANT le boot, pour qu'ils soient bootés/tickés.
  await loadMotors(os, { base: opts.motorsBase || './motors', revitalizor });

  // Calibre SUPERSAM A -> OPFS -> SLC SYNC -> boot ordonné des 26 -> démarre l'horloge.
  await os.boot();

  if (typeof globalThis !== 'undefined') globalThis.ViA = os; // accès console
  return os;
}

export { ViArtificialOS };
export default bootViArtificialOS;
