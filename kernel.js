// ViArtificial OS — kernel.js
// Le NOYAU / orchestrateur central : relie bus + store + clock + telemetry + vfs + processes + pawa + moteurs.
// C'EST la pièce qui manquait (aucun orchestrateur reliant les matrices).

import { VERSION, OS_NAME, DEFAULT_APPS } from './config.js';
import { Bus } from './bus.js';
import { Store } from './store.js';
import { Clock } from './clock.js';
import { Telemetry } from './telemetry.js';
import { VFS } from './vfs.js';
import { Processes } from './processes.js';
import { Pawa } from './pawa.js';
import { MotorHost } from './motors.js';
import { Persist } from './persist.js';

export class ViArtificialOS {
  constructor(opts = {}) {
    this.version = VERSION;
    this.name = OS_NAME;
    this.opts = opts;

    this.bus = new Bus();
    this.store = new Store({ booted: false, frame: 0 });
    this.clock = new Clock(this.bus);
    this.telemetry = new Telemetry(this.bus);
    this.fs = new VFS();
    this.processes = new Processes(this.bus);
    this.pawa = new Pawa(this.bus);
    this.motors = new MotorHost(this.bus);
    this.persist = new Persist(this.fs);

    this._superposeAcc = 0;
  }

  /* ---- API publique (ce que l'UI / la console utiliseront) ---- */
  registerApp(app)   { this.processes.registerApp(app); return this; }
  registerMotor(m)   { this.motors.register(m); return this; }
  launch(appId, args){ return this.processes.launch(appId, args); }
  focus(pid)         { this.processes.focus(pid); return this; }
  kill(pid)          { this.processes.kill(pid); return this; }
  on(type, fn)       { return this.bus.on(type, fn); }
  getState()         { return this.store.get(); }

  // Séquence de BOOT : SUPERSAM A -> stockage -> restauration -> apps -> moteurs -> horloge.
  async boot() {
    this.bus.emit('boot:start', { name: this.name, version: this.version });

    // 1) SUPERSAM A se calibre (vrais signaux)
    await this.telemetry.init();

    // 2) Stockage (OPFS / repli mémoire)
    const fsMode = await this.fs.init();
    this.store.patch({ fsMode });

    // 3) SLC SYNC : restaurer l'état précédent s'il existe
    const restored = await this.persist.restore();
    if (restored) {
      this.pawa.bank = restored.pawaBank ?? this.pawa.bank;
      this.pawa.totalMinted = restored.totalMinted ?? this.pawa.totalMinted;
      this.store.patch({ restored: true });
    }

    // 4) Apps par défaut (logique seulement)
    if (this.opts.registerDefaultApps !== false)
      for (const a of DEFAULT_APPS) this.registerApp(a);

    // 5) Démarrer les moteurs (ordonnés par priorité)
    await this.motors.bootAll(this);

    // 6) Horloge : à chaque frame on fait tourner tout le système
    this.bus.on('tick', (ctx) => this._frame(ctx));
    this.clock.start();

    this.store.patch({ booted: true });
    this.bus.emit('boot:done', this.snapshot());
    return this;
  }

  _frame(ctx) {
    this.telemetry.sampleFromClock(ctx);        // FPS/drift réels
    this.processes.update(ctx.now);             // états des apps selon inactivité (CRON)
    this.motors.tickAll(ctx);                   // moteurs

    const t = this.telemetry.get();
    const eff = this.pawa.effectualisation(t);
    this.store.patch({
      frame: ctx.frame,
      fps: Math.round(ctx.fps),
      driftMs: +ctx.driftMs.toFixed(2),
      pawaBank: +this.pawa.bank.toFixed(2),
      effectualisation: eff.percent,
    });

    // SLC SYNC : superposer une couche ~1x/seconde
    this._superposeAcc += ctx.dt;
    if (this._superposeAcc >= 1000) { this._superposeAcc = 0; this.store.superpose('1s'); }
  }

  snapshot() {
    const s = this.store.get();
    return {
      name: this.name, version: this.version, fsMode: s.fsMode, booted: s.booted,
      fps: s.fps, effectualisation: s.effectualisation, pawaBank: s.pawaBank,
      apps: this.processes.listApps().length,
    };
  }

  async shutdown() {
    this.clock.stop();
    await this.persist.save({ pawaBank: this.pawa.bank, totalMinted: this.pawa.totalMinted });
    this.bus.emit('shutdown', {});
  }
}
