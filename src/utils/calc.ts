/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TKPIItem, BahanMakananInput, HariPM } from "../types";

export interface CalcIngredientResult {
  id: string;
  nama: string;
  sumber: string;
  beratBB: number;
  urt: string;
  bdd: number;
  beratKotor: number; // gram
  totalKebutuhanGram: number;
  totalKebutuhanKg: number;
  hargaSatuan: number;
  hargaTotal: number;
  
  potong?: number | string;
  ekor?: number | string;
  buah?: number | string;
  butir?: number | string;
  formula?: "kg" | "potong" | "ekor" | "buah" | "butir";
  bufferBase?: "kg" | "potong" | "ekor" | "custom";
  bufferCustomVal?: string | number;
  jumlahBufferChoice?: string;
  jumlahBufferCustomVal?: string | number;
  
  // Nutrients
  energi: number;
  protein: number;
  lemak: number;
  kh: number;
  serat: number;
  abu: number;
  ca: number;
  p: number;
  fe: number;
  na: number;
  k: number;
  cu: number;
  zn: number;
  retinol: number;
  b_karoten: number;
  thiamin: number;
  riboflavin: number;
  niasin: number;
  vit_c: number;
}

export interface DayCalculatedResult {
  porsiBesarItems: CalcIngredientResult[];
  porsiKecilItems: CalcIngredientResult[];
  totalBesarBahanCost: number;
  totalKecilBahanCost: number;
  
  // Totals
  jumlahPMBesar: number;
  jumlahPMKecil: number;
  totalPM: number;
  
  bufferBesarCost: number;
  bufferKecilCost: number;
  bumbuBesarCost: number;
  bumbuKecilCost: number;
  
  subtotalBesarCost: number;
  subtotalKecilCost: number;
  
  costPerPorsiBesar: number;
  costPerPorsiKecil: number;
  
  // Nutritional averages per single portion
  nutrisiPorsiBesar: Record<string, number>;
  nutrisiPorsiKecil: Record<string, number>;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function createTkpiMap(tkpiList: TKPIItem[]): Map<string, TKPIItem> {
  const map = new Map<string, TKPIItem>();
  for (let i = 0; i < tkpiList.length; i++) {
    const item = tkpiList[i];
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return map;
}

export function calculateIngredient(
  input: BahanMakananInput,
  tkpiListOrMap: TKPIItem[] | Map<string, TKPIItem>,
  jumlahPM: number,
  bufferPct: number = 3
): CalcIngredientResult {
  let tkpi: TKPIItem | undefined;
  if (tkpiListOrMap instanceof Map) {
    tkpi = tkpiListOrMap.get(input.tkpiId);
  } else if (Array.isArray(tkpiListOrMap)) {
    tkpi = tkpiListOrMap.find((t) => t.id === input.tkpiId);
  }

  if (!tkpi) {
    tkpi = {
      id: "unknown",
      nama: "Bahan Tidak Diketahui",
      sumber: "Umum",
      bdd: 100,
      energi: 0,
      protein: 0,
      lemak: 0,
      kh: 0,
      serat: 0,
      abu: 0,
      ca: 0,
      p: 0,
      fe: 0,
      na: 0,
      k: 0,
      cu: 0,
      zn: 0,
      retinol: 0,
      b_karoten: 0,
      thiamin: 0,
      riboflavin: 0,
      niasin: 0,
      vit_c: 0
    };
  }

  const bddPct = typeof input.bdd === "number" ? input.bdd : (tkpi.bdd || 100);
  
  // BK (g) = BB / (BDD / 100)
  const beratKotor = bddPct > 0 ? (input.beratBB / (bddPct / 100)) : 0;
  
  // Total kebutuhan = BK * Jumlah PM (g)
  const totalKebutuhanGram = beratKotor * jumlahPM;
  const totalKebutuhanKg = totalKebutuhanGram / 1000;
  
  // Helper to parse potential math expression strings
  const parseVal = (val: number | string | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number") return val;
    const str = String(val).trim();
    if (!str) return 0;
    try {
      const sanitized = str.replace(/[^0-9+\-*/().\s]/g, "");
      if (!sanitized.trim()) return 0;
      const evaluated = new Function(`return (${sanitized})`)();
      if (typeof evaluated === "number" && !isNaN(evaluated) && isFinite(evaluated)) {
        return evaluated;
      }
    } catch (e) {}
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const potongVal = parseVal(input.potong);
  const ekorVal = parseVal(input.ekor);

  // 1. Base quantity from which buffer is calculated
  let baseQty = totalKebutuhanKg;
  const selectedBase = input.bufferBase || "auto";
  if (selectedBase === "kg") {
    baseQty = totalKebutuhanKg;
  } else if (selectedBase === "potong") {
    baseQty = potongVal * jumlahPM;
  } else if (selectedBase === "ekor") {
    baseQty = ekorVal * jumlahPM;
  } else if (selectedBase === "custom") {
    baseQty = parseVal(input.bufferCustomVal);
  } else {
    // "auto" legacy detection
    if (potongVal > 0) {
      baseQty = potongVal * jumlahPM;
    } else if (ekorVal > 0) {
      baseQty = ekorVal * jumlahPM;
    } else {
      baseQty = totalKebutuhanKg;
    }
  }

  // Calculate Buffer Amount dynamically based on selected bufferPct
  const bufferAmount = baseQty * (bufferPct / 100);

  // 2. Calculate Jumlah + Buffer based on user choice
  const jChoice = input.jumlahBufferChoice || "auto";
  const totalPotong = potongVal * jumlahPM;
  const totalEkor = ekorVal * jumlahPM;
  
  let effectiveJChoice = jChoice;
  if (jChoice === "auto") {
    if (selectedBase === "kg") {
      effectiveJChoice = "kg_with";
    } else if (selectedBase === "potong") {
      effectiveJChoice = "potong_with";
    } else if (selectedBase === "ekor") {
      effectiveJChoice = "ekor_with";
    } else if (selectedBase === "custom") {
      effectiveJChoice = "custom_with";
    } else {
      // If base is "auto", detect based on whether potong/ekor input is entered
      if (potongVal > 0) {
        effectiveJChoice = "potong_with";
      } else if (ekorVal > 0) {
        effectiveJChoice = "ekor_with";
      } else {
        effectiveJChoice = "kg_with";
      }
    }
  }

  let jumlahPlusBuffer = totalKebutuhanKg;
  const netKg = (input.beratBB * jumlahPM) / 1000;

  if (effectiveJChoice === "kg_with") {
    jumlahPlusBuffer = totalKebutuhanKg + bufferAmount;
  } else if (effectiveJChoice === "kilogram_with") {
    jumlahPlusBuffer = netKg + bufferAmount;
  } else if (effectiveJChoice === "potong_with") {
    jumlahPlusBuffer = totalPotong + bufferAmount;
  } else if (effectiveJChoice === "ekor_with") {
    jumlahPlusBuffer = totalEkor + bufferAmount;
  } else if (effectiveJChoice === "custom_with") {
    const customVal = parseVal(input.jumlahBufferCustomVal !== undefined ? input.jumlahBufferCustomVal : input.bufferCustomVal);
    jumlahPlusBuffer = customVal + bufferAmount;
  } else if (effectiveJChoice === "kg_without") {
    jumlahPlusBuffer = totalKebutuhanKg;
  } else if (effectiveJChoice === "kilogram_without") {
    jumlahPlusBuffer = netKg;
  } else if (effectiveJChoice === "potong_without") {
    jumlahPlusBuffer = totalPotong;
  } else if (effectiveJChoice === "ekor_without") {
    jumlahPlusBuffer = totalEkor;
  } else if (effectiveJChoice === "custom_without") {
    jumlahPlusBuffer = parseVal(input.jumlahBufferCustomVal !== undefined ? input.jumlahBufferCustomVal : input.bufferCustomVal);
  }

  // Calculate Harga Total based on chosen formula
  const formula = input.formula || "kg";
  let multiplier = totalKebutuhanKg;
  if (formula === "potong") {
    multiplier = potongVal * jumlahPM;
  } else if (formula === "ekor") {
    multiplier = ekorVal * jumlahPM;
  } else if (formula === "buah") {
    multiplier = bufferAmount;
  } else if (formula === "butir") {
    multiplier = jumlahPlusBuffer;
  }
  
  // As requested: harga total mengambil harga satuan x nilai pada tabel (jumlah+buffer)
  const hargaTotal = jumlahPlusBuffer * input.hargaSatuan;

  // Nutritional values per single portion (BB / 100 * value per 100g)
  const factor = input.beratBB / 100;

  return {
    id: input.id,
    nama: tkpi.nama,
    sumber: tkpi.sumber,
    beratBB: input.beratBB,
    urt: input.urt,
    bdd: bddPct,
    beratKotor,
    totalKebutuhanGram,
    totalKebutuhanKg,
    hargaSatuan: input.hargaSatuan,
    hargaTotal,
    formula,
    
    potong: input.potong,
    ekor: input.ekor,
    buah: bufferAmount, // b.buah is now Buffer amount
    butir: jumlahPlusBuffer, // b.butir is now Jumlah + Buffer
    bufferBase: input.bufferBase,
    bufferCustomVal: input.bufferCustomVal,
    jumlahBufferChoice: input.jumlahBufferChoice,
    jumlahBufferCustomVal: input.jumlahBufferCustomVal,
    
    energi: tkpi.energi * factor,
    protein: tkpi.protein * factor,
    lemak: tkpi.lemak * factor,
    kh: tkpi.kh * factor,
    serat: tkpi.serat * factor,
    abu: tkpi.abu * factor,
    ca: tkpi.ca * factor,
    p: tkpi.p * factor,
    fe: tkpi.fe * factor,
    na: tkpi.na * factor,
    k: tkpi.k * factor,
    cu: tkpi.cu * factor,
    zn: tkpi.zn * factor,
    retinol: tkpi.retinol * factor,
    b_karoten: tkpi.b_karoten * factor,
    thiamin: tkpi.thiamin * factor,
    riboflavin: tkpi.riboflavin * factor,
    niasin: tkpi.niasin * factor,
    vit_c: tkpi.vit_c * factor
  };
}

export function calculateDay(
  porsiBesarBahan: BahanMakananInput[],
  porsiKecilBahan: BahanMakananInput[],
  jumlahPMBesar: number,
  jumlahPMKecil: number,
  bufferPct: number, // 3 or 5
  tkpiListOrMap: TKPIItem[] | Map<string, TKPIItem>
): DayCalculatedResult {
  const tkpiMap = tkpiListOrMap instanceof Map ? tkpiListOrMap : createTkpiMap(tkpiListOrMap);
  const besarItems = porsiBesarBahan.map((b) => calculateIngredient(b, tkpiMap, jumlahPMBesar, bufferPct));
  const kecilItems = porsiKecilBahan.map((b) => calculateIngredient(b, tkpiMap, jumlahPMKecil, bufferPct));

  const totalBesarBahanCost = besarItems.reduce((acc, item) => acc + item.hargaTotal, 0);
  const totalKecilBahanCost = kecilItems.reduce((acc, item) => acc + item.hargaTotal, 0);

  const bufferBesarCost = (bufferPct / 100) * totalBesarBahanCost;
  const bufferKecilCost = (bufferPct / 100) * totalKecilBahanCost;

  const bumbuBesarCost = 0.1 * totalBesarBahanCost;
  const bumbuKecilCost = 0.1 * totalKecilBahanCost;

  const subtotalBesarCost = totalBesarBahanCost + bumbuBesarCost;
  const subtotalKecilCost = totalKecilBahanCost + bumbuKecilCost;

  const costPerPorsiBesar = jumlahPMBesar > 0 ? subtotalBesarCost / jumlahPMBesar : 0;
  const costPerPorsiKecil = jumlahPMKecil > 0 ? subtotalKecilCost / jumlahPMKecil : 0;

  // Sum nutritional values
  const nutrisiPorsiBesar: Record<string, number> = {};
  const nutrisiPorsiKecil: Record<string, number> = {};

  const keys = [
    "energi", "protein", "lemak", "kh", "serat", "abu", "ca", "p", "fe", "na", "k",
    "cu", "zn", "retinol", "b_karoten", "thiamin", "riboflavin", "niasin", "vit_c"
  ];

  keys.forEach((key) => {
    nutrisiPorsiBesar[key] = besarItems.reduce((acc, b) => acc + ((b as any)[key] || 0), 0);
    nutrisiPorsiKecil[key] = kecilItems.reduce((acc, b) => acc + ((b as any)[key] || 0), 0);
  });

  return {
    porsiBesarItems: besarItems,
    porsiKecilItems: kecilItems,
    totalBesarBahanCost,
    totalKecilBahanCost,
    jumlahPMBesar,
    jumlahPMKecil,
    totalPM: jumlahPMBesar + jumlahPMKecil,
    bufferBesarCost,
    bufferKecilCost,
    bumbuBesarCost,
    bumbuKecilCost,
    subtotalBesarCost,
    subtotalKecilCost,
    costPerPorsiBesar,
    costPerPorsiKecil,
    nutrisiPorsiBesar,
    nutrisiPorsiKecil
  };
}

export function getCountsForDay(harianPM: HariPM[], dayNum: number) {
  const dayPM = harianPM.find(h => h.hariKe === dayNum) || harianPM[0] || { sasaran: [] };
  
  let totalPorsiKecilAll = 0;
  let totalPorsiBesarAll = 0;
  let totalAlergiKecilAll = 0;
  let totalAlergiBesarAll = 0;

  let pmKecilSekolah = 0;
  let pmBesarSekolah = 0;
  let totalSekolahAlergiKecil = 0;
  let totalSekolahAlergiBesar = 0;

  let totalBalita = 0;
  let totalBumil = 0;
  let totalBusui = 0;
  let total3BAlergiKecil = 0;
  let total3BAlergiBesar = 0;
  let totalMPAsi = 0;
  let pmKecil3B = 0;
  let pmBesar3B = 0;

  const sekolahIds = ["tk_paud_lb", "sd_kelas_1_3", "sd_kelas_4_6", "smp_mts_smplb", "sma_smk_ma", "pendidik", "tenaga_kependidikan"];
  const tigaBIds = ["anak_balita", "anak_balita_13_59", "balita_6_11", "ibu_hamil", "ibu_menyusui"];
  const balitaIds = ["anak_balita", "anak_balita_13_59", "balita_6_11"];

  (dayPM.sasaran || []).forEach((s) => {
    const pk = Number(s.porsiKecil) || 0;
    const pb = Number(s.porsiBesar) || 0;
    const ak = Number(s.alergiKecil) || 0;
    const ab = Number(s.alergiBesar) || 0;

    totalPorsiKecilAll += pk;
    totalPorsiBesarAll += pb;
    totalAlergiKecilAll += ak;
    totalAlergiBesarAll += ab;

    if (sekolahIds.includes(s.id)) {
      pmKecilSekolah += pk;
      pmBesarSekolah += pb;
      totalSekolahAlergiKecil += ak;
      totalSekolahAlergiBesar += ab;
    }

    if (tigaBIds.includes(s.id)) {
      pmKecil3B += pk;
      pmBesar3B += pb;
      total3BAlergiKecil += ak;
      total3BAlergiBesar += ab;

      if (balitaIds.includes(s.id)) {
        totalBalita += pk + pb;
      }
      if (s.id === "ibu_hamil") {
        totalBumil += pk + pb;
      }
      if (s.id === "ibu_menyusui") {
        totalBusui += pk + pb;
      }
      if (s.id === "balita_6_11") {
        totalMPAsi += pk + pb;
      }
    }
  });

  const totalAlergiCombined = totalAlergiKecilAll + totalAlergiBesarAll;
  const totalSekolahSiswa = pmKecilSekolah + pmBesarSekolah;
  const totalSekolahAlergi = totalSekolahAlergiKecil + totalSekolahAlergiBesar;
  const total3BAlergi = total3BAlergiKecil + total3BAlergiBesar;
  const total3BPM = pmKecil3B + pmBesar3B;
  const grandTotalPMAll = totalPorsiKecilAll + totalPorsiBesarAll;

  return {
    pmKecilSekolah,
    pmBesarSekolah,
    totalSekolahSiswa,
    totalSekolahAlergiKecil,
    totalSekolahAlergiBesar,
    totalSekolahAlergi,
    totalBalita,
    totalBumil,
    totalBusui,
    total3BPM,
    total3BAlergiKecil,
    total3BAlergiBesar,
    total3BAlergi,
    totalMPAsi,
    pmKecil3B,
    pmBesar3B,
    totalPorsiKecilAll,
    totalPorsiBesarAll,
    totalAlergiKecilAll,
    totalAlergiBesarAll,
    totalAlergiCombined,
    grandTotalPMAll
  };
}
