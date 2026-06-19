// ViArtificial OS — motors-loader.js
// Les 26 moteurs sont EMBARQUÉS ici (zéro fetch -> jamais de 404 / SyntaxError).
// Les 26 fichiers motors/*.json restent à côté, éditables — mais ne sont PLUS requis au démarrage.
// (Si tu modifies un .json, demande-moi de régénérer ce fichier, ou édite MOTORS directement.)

import { Motor } from './motors.js';
import { Revitalizor } from './revitalizor.js';
import { STATES } from './config.js';

export const MOTORS = [
  {"n": 1, "id": "BERG_ENGINE", "name": "BERG Engine", "category": "FONDATION", "node": "ALL", "priority": 18, "impl": "symbolic", "role": "Bilan énergétique, garde le ratio 1/99 ; moteur de référence (gamifié)."},
  {"n": 2, "id": "SUPERSAM_A", "name": "SUPERSAM A", "category": "PHYSIQUE", "node": "CPU", "priority": 0, "impl": "telemetry", "role": "L'os : lit les VRAIS signaux du device (cœurs, mémoire, batterie*, réseau)."},
  {"n": 3, "id": "ALISCIA_B", "name": "ALISCIA B", "category": "EMOTIONNEL", "node": "ALL", "priority": 22, "impl": "symbolic", "role": "Intention/mode (ECONOMY/BERG/BOOST) ; oriente les splits (symbolique)."},
  {"n": 4, "id": "ALISCIA_C", "name": "ALISCIA INFINITY SAM C", "category": "EMERGENCE", "node": "ALL", "priority": 95, "impl": "symbolic", "role": "État émergent quand A et B résonnent (effectualisation > seuil)."},
  {"n": 5, "id": "PAWA_ENGINE", "name": "PAWA Engine", "category": "GENERATION", "node": "ALL", "priority": 15, "impl": "pawa", "role": "Dynamo : convertit l'activité réelle en PAWA gamifié."},
  {"n": 6, "id": "SLC_SYNC", "name": "SLC SYNC", "category": "EVOLUTION", "node": "ALL", "priority": 20, "impl": "persist", "role": "Jamais écraser, toujours superposer (snapshots OPFS)."},
  {"n": 7, "id": "METADATA_MOTOR", "name": "Metadata Motor", "category": "LECTURE", "node": "CPU", "priority": 10, "impl": "metadata", "role": "Passeport énergétique de chaque process (état, âge, z)."},
  {"n": 8, "id": "CRON_SYSTEM", "name": "CRON System", "category": "HORLOGE", "node": "ALL", "priority": 5, "impl": "clock", "role": "Métronome : transitions d'état ACTIF→PASSIF→DORMANT→ZOMBIE."},
  {"n": 9, "id": "CPUV_LOOP", "name": "CPUv Loop", "category": "AMPLIFICATION", "node": "CPUv", "priority": 30, "impl": "symbolic", "role": "Boucle logique amplifiée (compteur gamifié)."},
  {"n": 10, "id": "ENTROPY_HARVESTER", "name": "Entropy Harvester", "category": "COLLECTE", "node": "ALL", "priority": 32, "impl": "symbolic", "role": "Repère le 'gâché' (FPS bas, idle) comme carburant gamifié."},
  {"n": 11, "id": "RAF_SAMPLER", "name": "RAF Sampler", "category": "PRECISION", "node": "GPU", "priority": 6, "impl": "fps", "role": "Mesure FPS et drift réels via requestAnimationFrame."},
  {"n": 12, "id": "BRIDGE_MULTIPLIER", "name": "Bridge Multiplier", "category": "PONT", "node": "ALL", "priority": 40, "impl": "symbolic", "role": "9 ponts de décuplation (niveaux gamifiés)."},
  {"n": 13, "id": "DORMANT_WAKER", "name": "Dormant Waker", "category": "ACTIVATION", "node": "CPU", "priority": 12, "impl": "lifecycle", "role": "Réveille ou recycle les ressources dormantes."},
  {"n": 14, "id": "FREQUENCY_RESTORER", "name": "Frequency Restorer", "category": "CORRECTION", "node": "ALL", "priority": 34, "impl": "symbolic", "role": "Cohérence de phase entre nœuds (symbolique)."},
  {"n": 15, "id": "RECYCLATING_CORE", "name": "Recyclating Core", "category": "RECYCLEUR", "node": "ALL", "priority": 50, "impl": "revitalizor", "role": "Le Revitalizor : copy/delete/paste + défrag réels de la data de l'app."},
  {"n": 16, "id": "SEFIROT_RESONATOR", "name": "Sefirot Resonator", "category": "STRUCTURE", "node": "ALL", "priority": 42, "impl": "symbolic", "role": "10 niveaux de résonance (structure gamifiée)."},
  {"n": 17, "id": "TSIMTSOUM_COMPRESSOR", "name": "Tsimtsoum Compressor", "category": "COMPRESSION", "node": "ALL", "priority": 44, "impl": "symbolic", "role": "Filtre/compresse les pulses avant injection (symbolique)."},
  {"n": 18, "id": "GUEMATRIE_MAPPER", "name": "Guematrie Mapper", "category": "ENCODAGE", "node": "ALL", "priority": 46, "impl": "symbolic", "role": "Code numérique unique par type de fragment."},
  {"n": 19, "id": "QUANTUM_BRIDGE", "name": "Quantum Bridge", "category": "QUANTIQUE", "node": "ALL", "priority": 48, "impl": "symbolic", "role": "Saut de niveau N→N+1, bonus PAWA (gamifié)."},
  {"n": 20, "id": "CPUV_AMPLIFIER", "name": "CPUv Amplifier", "category": "VIRTUEL", "node": "CPUv", "priority": 36, "impl": "symbolic", "role": "Maintient la couche CPUv virtuelle (compteur)."},
  {"n": 21, "id": "GPUV_RENDERER", "name": "GPUv Renderer", "category": "RENDU", "node": "GPUv", "priority": 38, "impl": "symbolic", "role": "Couche rendu virtuelle (vrai WebGPU branchable plus tard)."},
  {"n": 22, "id": "FRACTAL_SCALER", "name": "Fractal Scaler", "category": "FRACTAL", "node": "ALL", "priority": 52, "impl": "symbolic", "role": "Mêmes lois à toutes les échelles (cohérence des sauts)."},
  {"n": 23, "id": "PHONETIC_ENCODER", "name": "Phonetic Encoder", "category": "SIGNAL", "node": "ALL", "priority": 54, "impl": "symbolic", "role": "Encode l'intention (clic/saisie) en onde vectorielle."},
  {"n": 24, "id": "ANTIFRAGILE_SHIELD", "name": "Antifragile Shield", "category": "PROTECTION", "node": "ALL", "priority": 56, "impl": "symbolic", "role": "Transforme le stress/erreurs en PAWA (gamifié)."},
  {"n": 25, "id": "OMEGA_ACCUMULATOR", "name": "@Omega Accumulator", "category": "CULMINANT", "node": "ALL", "priority": 90, "impl": "symbolic", "role": "Régulateur de l'état max, signal de complétion."},
  {"n": 26, "id": "BERG_MINING_ENGINE", "name": "BERG Mining Engine", "category": "MINING", "node": "ALL", "priority": 60, "impl": "mining", "role": "Mining coopératif gamifié 50/50 sur ressources DORMANT."}
];

// Moteur piloté par une spec + des hooks { boot?, tick? }.
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

    // telemetry / fps / clock / pawa / persist / lifecycle : gérés par le kernel.
    // symbolic + reste : tick vide (pas de no-op trompeur).
    default: return { tick() {} };
  }
}

// Charge les moteurs depuis les données EMBARQUÉES (pas de réseau).
export async function loadMotors(kernel, { revitalizor = null, data = MOTORS } = {}) {
  const specs = [...data].sort((a, b) => a.priority - b.priority);
  for (const spec of specs) {
    kernel.registerMotor(new DataMotor(spec, behaviorFor(spec.impl, { revitalizor })));
  }
  kernel.store.patch({ motorsLoaded: specs.length });
  kernel.bus.emit('motors:loaded', { count: specs.length });
  return specs.length;
}
