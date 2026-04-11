/**
 * version.js
 *
 * Versionamento centralizado da aplicação FarmBot Lab.
 * Atualizar aqui afeta exibição na UI e logs do sistema.
 */

export const VERSION = {
  major: 1,
  minor: 2,
  patch: 0,
  stage: "beta",

  toString() {
    return `${this.major}.${this.minor}.${this.patch}-${this.stage}`;
  },

  full() {
    return `FarmBot Lab v${this.toString()}`;
  },
};

export const BUILD_DATE = "2026-04-11";
export const LAST_UPDATED = "2026-04-11"; // v1.2.0: API de Solo
