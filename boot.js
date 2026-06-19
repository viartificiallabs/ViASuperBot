// ViArtificial OS — boot.js
// POINT D'ENTRÉE. L'interface (HTML/CSS) viendra SÉPARÉMENT et importera juste ceci.
//
//   import { bootViArtificialOS } from './boot.js';
//   const ViA = await bootViArtificialOS();
//   ViA.launch('golemotor');
//
// À servir en https (GitHub Pages) ou localhost : les modules + OPFS l'exigent.

import { ViArtificialOS } from './kernel.js';
import { coreMotors } from './motors.js';

export async function bootViArtificialOS(opts = {}) {
  const os = new ViArtificialOS(opts);
  for (const m of coreMotors()) os.registerMotor(m);
  await os.boot();
  if (typeof globalThis !== 'undefined') globalThis.ViA = os; // accès console
  return os;
}

export { ViArtificialOS };
export default bootViArtificialOS;
