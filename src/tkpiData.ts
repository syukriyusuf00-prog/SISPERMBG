/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TKPIItem } from "./types";

export const INITIAL_TKPI_DATABASE: TKPIItem[] = [];

export const TARGET_AKG_LIMITS: Record<string, { label: string; energiMin: number; energiMax: number; proteinMin: number; lemakMin: number; khMin: number; seratMin: number }> = {
  balita: {
    label: "Balita 13-59 bln (20-25% AKG)",
    energiMin: 270,
    energiMax: 338,
    proteinMin: 5,
    lemakMin: 8,
    khMin: 40,
    seratMin: 4
  },
  tk_paud: {
    label: "TK / PAUD (20-25% AKG)",
    energiMin: 280,
    energiMax: 350,
    proteinMin: 6,
    lemakMin: 9,
    khMin: 45,
    seratMin: 4
  },
  sd_kecil: {
    label: "SD Kelas 1-3 (20-25% AKG)",
    energiMin: 330,
    energiMax: 413,
    proteinMin: 8,
    lemakMin: 11,
    khMin: 55,
    seratMin: 5
  },
  sd_besar: {
    label: "SD Kelas 4-6 (30-35% AKG)",
    energiMin: 585,
    energiMax: 683,
    proteinMin: 15,
    lemakMin: 18,
    khMin: 85,
    seratMin: 8
  },
  smp: {
    label: "SMP (30-35% AKG)",
    energiMin: 668,
    energiMax: 779,
    proteinMin: 20,
    lemakMin: 22,
    khMin: 100,
    seratMin: 9
  },
  sma_pendidik: {
    label: "SMA / Pendidik (30-35% AKG)",
    energiMin: 713,
    energiMax: 831,
    proteinMin: 22,
    lemakMin: 24,
    khMin: 110,
    seratMin: 10
  },
  bumil: {
    label: "Ibu Hamil (30-35% AKG)",
    energiMin: 753,
    energiMax: 879,
    proteinMin: 25,
    lemakMin: 26,
    khMin: 120,
    seratMin: 11
  },
  busui: {
    label: "Ibu Menyusui (30-35% AKG)",
    energiMin: 782,
    energiMax: 912,
    proteinMin: 26,
    lemakMin: 27,
    khMin: 125,
    seratMin: 11
  }
};
