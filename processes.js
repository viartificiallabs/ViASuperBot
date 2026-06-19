// ViArtificial OS — processes.js
// Gestionnaire d'apps / fenêtres (LOGIQUE seulement, pas de DOM).
// Cycle de vie mappé sur tes états Datacron : ACTIF -> PASSIF -> DORMANT -> ZOMBIE.
// HONNÊTE : ce sont des apps web DANS la coquille, pas des process système.

import { STATES, LIFECYCLE } from './config.js';

let PID = 1;

export class Processes {
  constructor(bus) {
    this.bus = bus;
    this.apps = new Map();   // id -> { id, name, icon, ... }
    this.procs = new Map();  // pid -> process
    this.focused = null;
    this._z = 1;
  }

  registerApp(app) {
    if (!app?.id) throw new Error('app.id requis');
    this.apps.set(app.id, app);
    this.bus.emit('app:registered', app);
  }

  listApps() { return [...this.apps.values()]; }
  list() { return [...this.procs.values()]; }

  launch(appId, args = {}) {
    const app = this.apps.get(appId);
    if (!app) throw new Error(`app inconnue: ${appId}`);
    const proc = {
      pid: PID++, appId, name: app.name, icon: app.icon,
      state: STATES.ACTIF, z: this._z++, args,
      bornAt: Date.now(), lastActive: Date.now(),
    };
    this.procs.set(proc.pid, proc);
    this.focus(proc.pid);
    this.bus.emit('proc:launch', proc);
    return proc;
  }

  focus(pid) {
    const p = this.procs.get(pid);
    if (!p) return;
    if (this.focused && this.focused !== pid) {
      const prev = this.procs.get(this.focused);
      if (prev && prev.state === STATES.ACTIF) this._setState(prev, STATES.PASSIF);
    }
    this.focused = pid;
    p.z = this._z++;
    p.lastActive = Date.now();
    this._setState(p, STATES.ACTIF);
    this.bus.emit('proc:focus', p);
  }

  // tue : le process devient ZOMBIE (charge nette), il sera recyclé (reap) ensuite.
  kill(pid) {
    const p = this.procs.get(pid);
    if (!p) return;
    if (this.focused === pid) this.focused = null;
    this._setState(p, STATES.ZOMBIE);
    this.bus.emit('proc:kill', p);
  }

  // recyclage effectif d'un zombie (libération).
  reap(pid) {
    const p = this.procs.get(pid);
    if (p && p.state === STATES.ZOMBIE) {
      this.procs.delete(pid);
      this.bus.emit('proc:reap', p);
    }
  }

  // Appelé par CRON/Clock pour faire avancer les états selon l'inactivité.
  update(now = Date.now()) {
    for (const p of this.procs.values()) {
      if (p.state === STATES.ZOMBIE) continue;
      if (this.focused === p.pid) continue; // l'app au focus reste ACTIVE
      const idle = now - p.lastActive;
      if (p.state === STATES.ACTIF && idle > LIFECYCLE.toPassifMs) this._setState(p, STATES.PASSIF);
      else if (p.state === STATES.PASSIF && idle > LIFECYCLE.toDormantMs) this._setState(p, STATES.DORMANT);
      else if (p.state === STATES.DORMANT && idle > LIFECYCLE.toZombieMs) this._setState(p, STATES.ZOMBIE);
    }
  }

  _setState(p, state) {
    if (p.state === state) return;
    const from = p.state;
    p.state = state;
    this.bus.emit('proc:state', { pid: p.pid, from, to: state, proc: p });
  }
}
