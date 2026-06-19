// ViArtificial OS — motors.js
// Cadre des "moteurs" GoleMotor : classe de base + hôte (orchestration) + quelques moteurs RÉELS.
// Tu ajoutes tes 26 moteurs comme des modules qui étendent Motor. L'orchestrateur les relie.

import { STATES } from './config.js';

export class Motor {
  constructor(id, { node = 'ALL', priority = 100 } = {}) {
    this.id = id; this.node = node; this.priority = priority; this.kernel = null;
  }
  async boot(kernel) { this.kernel = kernel; } // override
  tick(_ctx) {}                                 // override (chaque frame)
  onMessage(_msg) {}                            // override
}

export class MotorHost {
  constructor(bus) { this.bus = bus; this.motors = new Map(); }

  register(motor) {
    this.motors.set(motor.id, motor);
    this.bus.emit('motor:registered', { id: motor.id });
    return motor;
  }

  // Boot ordonné : priorité basse = démarre en premier (SUPERSAM A = 0).
  async bootAll(kernel) {
    const ordered = [...this.motors.values()].sort((a, b) => a.priority - b.priority);
    for (const m of ordered) await m.boot(kernel);
    this.bus.emit('motor:booted', { count: ordered.length });
  }

  tickAll(ctx) {
    for (const m of this.motors.values()) {
      try { m.tick(ctx); } catch (e) { console.error(`[motor ${m.id}]`, e); }
    }
  }
}

/* ---------- Quelques moteurs réels, branchés sur le vrai système ---------- */

// #02 SUPERSAM A — l'os : la télémétrie. Démarre en premier (priority 0).
export class SupersamA extends Motor {
  constructor() { super('SUPERSAM_A', { node: 'CPU', priority: 0 }); }
  async boot(kernel) { await super.boot(kernel); this.tel = kernel.telemetry; }
  tick() { /* lecture seule : la télémétrie est samplée par le kernel à chaque frame */ }
}

// #07 METADATA MOTOR — tague chaque process avec son "passeport énergétique".
export class MetadataMotor extends Motor {
  constructor() { super('METADATA_MOTOR', { node: 'CPU', priority: 10 }); }
  tick() {
    const procs = this.kernel.processes.list();
    this.kernel.store.patch({
      passports: procs.map(p => ({
        pid: p.pid, app: p.appId, state: p.state,
        ageMs: Date.now() - p.lastActive, z: p.z,
      })),
    });
  }
}

// #15 RECYCLATING CORE — recycle les zombies (reap) et "mint" du PAWA gamifié.
// (Le vrai REVITALIZOR — copy/delete/paste de buffers — viendra se brancher ICI.)
export class RecyclatingCore extends Motor {
  constructor() { super('RECYCLATING_CORE', { node: 'ALL', priority: 50 }); }
  tick() {
    const zombies = this.kernel.processes.list().filter(p => p.state === STATES.ZOMBIE);
    for (const z of zombies) {
      const fuel = Math.min((Date.now() - z.lastActive) / 1000, 100); // plus c'est vieux, plus ça mint
      this.kernel.pawa.mint(fuel);
      this.kernel.processes.reap(z.pid);
    }
  }
}

// #26 BERG MINING ENGINE — mining coopératif gamifié sur les ressources DORMANT.
export class BergMiningEngine extends Motor {
  constructor() { super('BERG_MINING_ENGINE', { node: 'ALL', priority: 60 }); this._acc = 0; }
  tick({ dt }) {
    this._acc += dt;
    if (this._acc < 1000) return; // ~1x/seconde
    this._acc = 0;
    const dormant = this.kernel.processes.list().filter(p => p.state === STATES.DORMANT).length;
    if (dormant) this.kernel.pawa.mineCooperative(dormant * 2);
  }
}

export function coreMotors() {
  return [new SupersamA(), new MetadataMotor(), new RecyclatingCore(), new BergMiningEngine()];
}
