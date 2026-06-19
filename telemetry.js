// ViArtificial OS — telemetry.js
// SUPERSAM A : "l'os". Mesure les VRAIS signaux disponibles. Ne corrige rien, mesure.
// HONNÊTE : tout en LECTURE SEULE. Ce qui n'existe pas sur la plateforme -> { available:false }.

export class Telemetry {
  constructor(bus) {
    this.bus = bus;
    this._battery = null;
    this.snapshot = this._empty();
  }

  _empty() {
    return {
      cores:     { value: null, available: false },                 // navigator.hardwareConcurrency
      memoryGB:  { value: null, available: false },                 // approx arrondi (Chrome/Android)
      battery:   { level: null, charging: null, available: false }, // Chrome/Android only, iOS = non
      network:   { type: null, downlink: null, available: false },  // souvent absent sur Safari
      visibility:{ state: 'visible', available: true },
      fps:       { value: 0, driftMs: 0, available: true },         // alimenté par Clock
      platform:  typeof navigator !== 'undefined' ? (navigator.platform || null) : null,
    };
  }

  // Calibration au démarrage (SUPERSAM A se calibre lui-même, en premier).
  async init() {
    const s = this.snapshot;
    if (typeof navigator !== 'undefined') {
      if (typeof navigator.hardwareConcurrency === 'number')
        s.cores = { value: navigator.hardwareConcurrency, available: true };

      if (typeof navigator.deviceMemory === 'number')
        s.memoryGB = { value: navigator.deviceMemory, available: true };

      const c = navigator.connection || navigator.webkitConnection;
      if (c) s.network = { type: c.effectiveType ?? null, downlink: c.downlink ?? null, available: true };

      // Battery Status API : Chrome/Android OUI, Safari/iOS NON.
      if (typeof navigator.getBattery === 'function') {
        try {
          this._battery = await navigator.getBattery();
          const sync = () => {
            s.battery = { level: this._battery.level, charging: this._battery.charging, available: true };
            this.bus.emit('telemetry:battery', s.battery);
          };
          sync();
          this._battery.addEventListener('levelchange', sync);
          this._battery.addEventListener('chargingchange', sync);
        } catch { /* refusé / indispo */ }
      }
    }

    if (typeof document !== 'undefined') {
      s.visibility = { state: document.visibilityState, available: true };
      document.addEventListener('visibilitychange', () => {
        s.visibility.state = document.visibilityState;
        this.bus.emit('telemetry:visibility', s.visibility);
      });
    }

    this.bus.emit('telemetry:init', s);
    return s;
  }

  // FPS/drift réels, mesurés par Clock à chaque frame.
  sampleFromClock({ fps, driftMs }) {
    this.snapshot.fps = { value: fps, driftMs, available: true };
  }

  get() { return this.snapshot; }
}
