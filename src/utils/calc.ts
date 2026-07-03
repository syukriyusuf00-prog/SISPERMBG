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

export function calculateIngredient(
  input: BahanMakananInput,
  tkpiList: TKPIItem[],
  jumlahPM: number,
  bufferPct: number = 3
): CalcIngredientResult {
  const tkpi = tkpiList.find((t) => t.id === input.tkpiId) || {
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
  let jumlahBaseVal = totalKebutuhanKg;
  let addBuffer = true;

  if (jChoice === "auto") {
    // Legacy auto-detection
    if (potongVal > 0) {
      jumlahBaseVal = potongVal * jumlahPM;
    } else if (ekorVal > 0) {
      jumlahBaseVal = ekorVal * jumlahPM;
    } else {
      jumlahBaseVal = totalKebutuhanKg;
    }
    addBuffer = true;
  } else {
    const parts = jChoice.split("_");
    const baseType = parts[0];
    const bufferMode = parts[1]; // "with" or "without"

    if (baseType === "kg") {
      jumlahBaseVal = totalKebutuhanKg;
    } else if (baseType === "potong") {
      jumlahBaseVal = potongVal * jumlahPM;
    } else if (baseType === "ekor") {
      jumlahBaseVal = ekorVal * jumlahPM;
    } else if (baseType === "custom") {
      jumlahBaseVal = parseVal(input.jumlahBufferCustomVal !== undefined ? input.jumlahBufferCustomVal : input.bufferCustomVal);
    }

    addBuffer = (bufferMode === "with");
  }

  const finalBufferForJumlah = addBuffer ? (jumlahBaseVal * (bufferPct / 100)) : 0;
  const jumlahPlusBuffer = jumlahBaseVal + finalBufferForJumlah;

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
  tkpiList: TKPIItem[]
): DayCalculatedResult {
  const besarItems = porsiBesarBahan.map((b) => calculateIngredient(b, tkpiList, jumlahPMBesar, bufferPct));
  const kecilItems = porsiKecilBahan.map((b) => calculateIngredient(b, tkpiList, jumlahPMKecil, bufferPct));

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
  
  // Usia Sekolah groups (indices 0 to 6)
  const sekolahSasaran = dayPM.sasaran.filter(s => 
    ["tk_paud_lb", "sd_kelas_1_3", "sd_kelas_4_6", "smp_mts_smplb", "sma_smk_ma", "pendidik", "tenaga_kependidikan"].includes(s.id)
  );
  const pmKecilSekolah = sekolahSasaran.reduce((acc, curr) => acc + (Number(curr.porsiKecil) || 0), 0);
  const pmBesarSekolah = sekolahSasaran.reduce((acc, curr) => acc + (Number(curr.porsiBesar) || 0), 0);
  const totalSekolahAlergiKecil = sekolahSasaran.reduce((acc, curr) => acc + (Number(curr.alergiKecil) || 0), 0);
  const totalSekolahAlergiBesar = sekolahSasaran.reduce((acc, curr) => acc + (Number(curr.alergiBesar) || 0), 0);
  const totalSekolahAlergi = totalSekolahAlergiKecil + totalSekolahAlergiBesar;

  // 3B groups (indices 7 to 11)
  const tigaBSasaran = dayPM.sasaran.filter(s => 
    ["anak_balita", "anak_balita_13_59", "balita_6_11", "ibu_hamil", "ibu_menyusui"].includes(s.id)
  );
  
  const totalBalita = tigaBSasaran.filter(s => ["anak_balita", "anak_balita_13_59", "balita_6_11"].includes(s.id))
    .reduce((acc, curr) => acc + (Number(curr.porsiKecil) || 0), 0);
  
  const totalBumil = tigaBSasaran.filter(s => s.id === "ibu_hamil")
    .reduce((acc, curr) => acc + (Number(curr.porsiBesar) || 0), 0);
    
  const totalBusui = tigaBSasaran.filter(s => s.id === "ibu_menyusui")
    .reduce((acc, curr) => acc + (Number(curr.porsiBesar) || 0), 0);
    
  const total3BAlergiKecil = tigaBSasaran.reduce((acc, curr) => acc + (Number(curr.alergiKecil) || 0), 0);
  const total3BAlergiBesar = tigaBSasaran.reduce((acc, curr) => acc + (Number(curr.alergiBesar) || 0), 0);
  const total3BAlergi = total3BAlergiKecil + total3BAlergiBesar;
  
  const totalMPAsi = tigaBSasaran.filter(s => s.id === "balita_6_11")
    .reduce((acc, curr) => acc + (Number(curr.porsiKecil) || 0), 0);

  return {
    pmKecilSekolah,
    pmBesarSekolah,
    totalSekolahAlergiKecil,
    totalSekolahAlergiBesar,
    totalSekolahAlergi,
    totalBalita,
    totalBumil,
    totalBusui,
    total3BAlergiKecil,
    total3BAlergiBesar,
    total3BAlergi,
    totalMPAsi,
    pmKecil3B: totalBalita,
    pmBesar3B: totalBumil + totalBusui,
    grandTotalPMAll: pmKecilSekolah + pmBesarSekolah + totalBalita + totalBumil + totalBusui
  };
}
