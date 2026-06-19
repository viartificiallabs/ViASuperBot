// ViArtificial OS — clock.js
// CRON SYSTEM + RAF SAMPLER. Le "cœur" du système.
// HONNÊTE : rAF est plafonné par la dalle (≈60/120Hz). On mesure le VRAI FPS et le drift.

import { CLOCK } from './config.js';

const raf = (typeof requestAnimationFrame === 'function')
  ? requestAnimationFrame.bind(globalThis)
  : (cb) => setTimeout(() => cb(performance.now()), CLOCK.targetFrameMs);

const caf = (typeof cancelAnimationFrame === 'function')
  ? cancelAnimationFrame.bind(globalThis)
  : clearTimeout;

export class Clock {
  constructor(bus) {
    this.bus = bus;
    this._id = null;
    this._last = 0;
    this._fpsBuf = [];
    this.running = false;
    this.fps = 0;
    this.driftMs = 0;  // écart à la frame cible -> proxy de charge (RAF SAMPLER)
    this.frame = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = now - this._last;
      this._last = now;
      this.frame++;

      const inst = dt > 0 ? 1000 / dt : 0;
      this._fpsBuf.push(inst);
      if (this._fpsBuf.length > CLOCK.fpsWindow) this._fpsBuf.shift();
      this.fps = this._fpsBuf.reduce((a, b) => a + b, 0) / this._fpsBuf.length;

      this.driftMs = Math.max(0, dt - CLOCK.targetFrameMs);

      this.bus.emit('tick', { dt, now, frame: this.frame, fps: this.fps, driftMs: this.driftMs });
      this._id = raf(loop);
    };
    this._id = raf(loop);
    this.bus.emit('clock:start', {});
  }

  stop() {
    this.running = false;
    if (this._id != null) caf(this._id);
    this._id = null;
    this.bus.emit('clock:stop', {});
  }
}
