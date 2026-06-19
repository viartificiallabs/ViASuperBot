// ViArtificial OS — config.js
// Configuration canonique du noyau. SOURCE DE VÉRITÉ UNIQUE.
// (Corrige les splits/ratios qui se contredisaient dans les encyclopédies.)

export const VERSION = '0.1.0-coquille';
export const OS_NAME = 'ViArtificial OS';

// Horloge / Cœur.
// HONNÊTE : rAF est plafonné par la dalle (≈60/120Hz). On VISE, on ne force pas.
export const CLOCK = {
  targetHz: 60,
  targetFrameMs: 1000 / 60, // 16.67ms — référence RAF SAMPLER
  fpsWindow: 60,            // moyenne glissante sur N frames
};

// États du cycle de vie (Datacron / fragments / process).
export const STATES = Object.freeze({
  ACTIF: 'ACTIF',
  PASSIF: 'PASSIF',
  DORMANT: 'DORMANT',
  ZOMBIE: 'ZOMBIE',
});

// Délais de transition d'état (ms). Gérés par CRON SYSTEM.
export const LIFECYCLE = {
  toPassifMs: 5_000,     // perte de focus -> PASSIF
  toDormantMs: 60_000,   // PASSIF prolongé -> DORMANT
  toZombieMs: 300_000,   // DORMANT trop long -> ZOMBIE (candidat recyclage)
};

// Économie PAWA / BERG — GAMIFIÉE. Ce ne sont PAS des watts physiques.
// Deux ratios DISTINCTS (c'était mélangé dans les docs) :
export const ECONOMY = {
  BERG_RATIO: 0.01,      // 1% cristallisé en PAWA_BANK
  REINJECT_RATIO: 0.99,  // 99% réinjectés (compteur interne)
  MINING_SPLIT: 0.5,     // BERG MINING ENGINE : 50/50 coopératif (≠ du 1/99)
};

// Splits de réinjection par nœud, par mode (somme ≈ 1 par mode, hors prélèvements BOOST).
export const SPLITS = {
  ECONOMY: { CPU: 0.55, CPUv: 0.30, GPU: 0.10, GPUv: 0.05 },
  BERG:    { CPU: 0.25, CPUv: 0.25, GPU: 0.25, GPUv: 0.25 },
  BOOST:   { CPU: 0.08, CPUv: -0.10, GPU: 0.06, GPUv: -0.10 }, // prélèvements virtuels -> physique
};

// Apps connues par l'OS (LOGIQUE seulement, l'UI viendra séparément).
export const DEFAULT_APPS = [
  { id: 'via-superbot', name: 'ViA SuperBot',  icon: '🤖' },
  { id: 'golemotor',    name: 'GoleMotor',     icon: '⚙' },
  { id: 'kefftech',     name: 'KeffTech',      icon: '🔧' },
  { id: 'geekonerd',    name: 'geekOnerd',     icon: '🛰' },
  { id: 'librarchie',   name: 'Librarchie',    icon: '📚' },
  { id: 'justforkeff',  name: 'JustForKeff',   icon: '✦' },
  { id: 'pawaw',        name: 'PAWAW INFINIAM',icon: '🌀' },
];
