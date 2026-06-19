// ViArtificial OS — pawa.js
// Économie PAWA / BERG — GAMIFIÉE. Ce sont des points internes, PAS des watts physiques.
// L'"effectualisation" est calculée à partir des VRAIS signaux dispo (cœurs, FPS, mémoire).

import { ECONOMY } from './config.js';

export class Pawa {
  constructor(bus) {
    this.bus = bus;
    this.bank = 0;        // PAWA_BANK (cristallisé)
    this.reinjected = 0;  // compteur réinjection (boucle)
    this.totalMinted = 0;
  }

  // Génère du PAWA depuis une activité interne RÉELLE (transitions, octets recyclés…).
  mint(amount) {
    if (!(amount > 0)) return 0;
    this.totalMinted += amount;
    const berg = amount * ECONOMY.BERG_RATIO;
    this.bank += berg;
    this.reinjected += amount * ECONOMY.REINJECT_RATIO;
    this.bus.emit('pawa:mint', { amount, berg, bank: this.bank });
    return berg;
  }

  // Mining coopératif (split 50/50) — distinct du ratio 1/99 ci-dessus.
  mineCooperative(amount) {
    const mine = amount * ECONOMY.MINING_SPLIT;
    this.bank += mine;
    this.bus.emit('pawa:mine', { amount, mine, bank: this.bank });
    return mine; // l'autre moitié irait "à l'app partagée" (gamifié)
  }

  // Effectualisation HONNÊTE : 0..1 à partir de ce que le web expose vraiment.
  // (freqGHz / vramGB ne sont PAS lisibles sur le web -> non inclus.)
  effectualisation(t) {
    const parts = [];
    if (t.cores.available)    parts.push([Math.min(t.cores.value / 16, 1), 0.34]);
    if (t.memoryGB.available) parts.push([Math.min(t.memoryGB.value / 8, 1), 0.33]);
    if (t.fps.available)      parts.push([Math.min(t.fps.value / 60, 1), 0.33]);
    const wsum = parts.reduce((a, [, w]) => a + w, 0) || 1;
    const score = parts.reduce((a, [v, w]) => a + v * w, 0) / wsum;
    return { score, percent: Math.round(score * 100) };
  }
}
