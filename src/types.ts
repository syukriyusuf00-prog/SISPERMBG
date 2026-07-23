/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SPPGProfile {
  namaLembaga: string;
  alamat: string;
  namaKepala: string;
  namaAhliGizi: string;
  namaYayasan: string;
  ketuaYayasan: string;
  namaAkuntan: string;
  tahunAnggaran: string;
  periodeDates: string[]; // 10 dates
  awalPeriodeBerikutnya: string;
}

export interface SekolahPM {
  id: string;
  namaSekolah: string;
  alamatDesa: string;
  porsiKecil: number; // TK/PAUD, SD 1-3
  porsiBesar: number; // SD 4-6, SMP, SMA
  alergi?: number;    // Jumlah siswa alergi
}

export interface TigaBPM {
  id: string;
  namaDesa: string;
  bumil: number;
  balita: number;
  busui: number;
  mpAsi?: number;    // PM PM-ASI
  alergi?: number;   // Jumlah PM 3B alergi
}

export interface KelompokSasaranPM {
  id: string;
  label: string;
  porsiKecil: number;
  porsiBesar: number;
  alergiKecil: number;
  alergiBesar: number;
}

export interface HariPM {
  hariKe: number;
  sasaran: KelompokSasaranPM[];
}

export interface MenuItem {
  namaMenu: string;
  karbohidrat: string;
  laukHewani: string;
  laukNabati: string;
  sayur: string;
  buahSusu: string;
}

export interface MasterMenu {
  usiaSekolah: MenuItem[]; // 10 days
  tigaB: MenuItem[];      // 10 days
  mpAsi: MenuItem[];      // 10 days
  usiaSekolahAlergi: MenuItem[]; // 10 days
  tigaBAlergi: MenuItem[];      // 10 days
  mpAsiAlergi: MenuItem[];      // 10 days
}

export interface TKPIItem {
  id: string;
  nama: string;
  sumber: string;
  kategori?: string;
  beratStandar?: number; // g
  bdd: number;       // %
  energi: number;    // kkal
  protein: number;   // g
  lemak: number;     // g
  kh: number;        // g
  serat: number;     // g
  abu: number;       // g
  ca: number;        // mg
  p: number;         // mg
  fe: number;        // mg
  na: number;        // mg
  k: number;         // mg
  cu: number;        // mg
  zn: number;        // mg
  retinol: number;   // mcg
  b_karoten: number; // mcg
  thiamin: number;   // mg
  riboflavin: number;// mg
  niasin: number;    // mg
  vit_c: number;     // mg
  air?: number;      // g
}

export interface BahanMakananInput {
  id: string;
  tkpiId: string;
  beratBB: number; // gram
  urt: string;     // e.g. "1 gls", "1 ptg"
  hargaSatuan: number; // per Kg atau per Satuan
  bdd?: number;    // % (optional custom override)
  potong?: number | string; // potong per porsi
  ekor?: number | string;   // ekor per porsi
  buah?: number | string;   // buah per porsi
  butir?: number | string;  // butir per porsi
  formula?: "kg" | "potong" | "ekor" | "buah" | "butir"; // formula for total price calculation
  bufferBase?: "kg" | "potong" | "ekor" | "custom";
  bufferCustomVal?: string | number;
  jumlahBufferChoice?: string; // "auto" or format like "[kg|potong|ekor|custom]_[with|without]"
  jumlahBufferCustomVal?: string | number;
}

export interface FoodCostDay {
  jenisMenu: "Basah" | "Alergi" | "Kering" | "MP-ASI" | "3B-Basah" | "3B-Alergi" | "3B-Kering";
  hariKe: number; // 1 to 12
  porsiBesarBahan: BahanMakananInput[];
  porsiKecilBahan: BahanMakananInput[];
  bufferPct: number; // 3 or 5
  customPmBesarCount?: number;
  customPmKecilCount?: number;
}

export interface CekGiziInput {
  id: string;
  namaMenu: string;
  tkpiId: string;
  berat: number; // gram
  urt: string;
}

export interface TargetAKG {
  label: string;
  energiMin: number;
  energiMax: number;
  proteinMin: number;
  lemakMin: number;
  khMin: number;
}
