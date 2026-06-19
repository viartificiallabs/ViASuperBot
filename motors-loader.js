// ViArtificial OS — motors-loader.js
// Charge les 26 moteurs depuis 26 fichiers JSON et leur attache un comportement RÉEL
// quand il existe. Sinon : "symbolic" = état seulement, AUCUNE fausse promesse hardware.

import { Motor } from './motors.js';
import { Revitalizor } from './revitalizor.js';
import { STATES } from './config.js';

// Moteur piloté par une spec JSON + des hooks { boot?, tick? }.
class DataMotor extends Motor {
  constructor(spec, hooks = {}) {
    super(spec.id, { node: spec.node, priority: spec.priority });
    this.spec = spec; this._hooks = hooks;
  }
  async boot(kernel) { await super.boot(kernel); if (this._hooks.boot) await this._hooks.boot.call(this, kernel); }
  tick(ctx) { if (this._hooks.tick) this._hooks.tick.call(this, ctx); }
}

// Comportements réels par type d'implémentation.
function behaviorFor(impl, ctx) {
  switch (impl) {
    case 'metadata': return { tick() {
      const k = this.kernel;
      k.store.patch({ passports: k.processes.list().map(p => ({
        pid: p.pid, app: p.appId, state: p.state, ageMs: Date.now() - p.lastActive,
      })) });
    }};

    case 'mining': return { boot() { this._a = 0; }, tick(c) {
      this._a += c.dt; if (this._a < 1000) return; this._a = 0;
      const d = this.kernel.processes.list().filter(p => p.state === STATES.DORMANT).length;
      if (d) this.kernel.pawa.mineCooperative(d * 2);
    }};

    case 'revitalizor': return {
      async boot(k) { this.rev = ctx.revitalizor || k.revitalizor || new Revitalizor({ kernel: k }); k.revitalizor = this.rev; this._a = 0; },
      tick(c) { this._a += c.dt; if (this._a < (this.rev.cfg.autoCycleMs || 5000)) return; this._a = 0; this.rev.cycle(); },
    };

    // telemetry / fps / clock / pawa / persist / lifecycle : déjà gérés par le kernel.
    // symbolic + tout le reste : pas de no-op trompeur, juste un tick vide.
    default: return { tick() {} };
  }
}

export async function loadMotors(kernel, { base = './motors', revitalizor = null } = {}) {
  const index = await (await fetch(`${base}/index.json`)).json();
  const specs = await Promise.all(index.motors.map(f => fetch(`${base}/${f}`).then(r => r.json())));
  specs.sort((a, b) => a.priority - b.priority);
  for (const spec of specs) {
    kernel.registerMotor(new DataMotor(spec, behaviorFor(spec.impl, { revitalizor })));
  }
  kernel.store.patch({ motorsLoaded: specs.length });
  kernel.bus.emit('motors:loaded', { count: specs.length });
  return specs.length;
}
