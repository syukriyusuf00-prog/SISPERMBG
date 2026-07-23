/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Info, BookOpen, Search, CheckCircle, Download, FileText, Sparkles, Utensils, Award } from "lucide-react";
import * as XLSX from "xlsx";

interface JuknisRow {
  no: number;
  kelompok: string;
  distribusi: string;
  rujukanAkg: string;
  energiMin: number;
  energiMax: number;
  proteinMin: number;
  proteinMax: number;
  lemakMin: number;
  lemakMax: number;
  khMin: number;
  khMax: number;
}

const JUKNIS_DATA: JuknisRow[] = [
  { no: 1, kelompok: "Siswa TK/PAUD/LB", distribusi: "Pagi", rujukanAkg: "20-25%", energiMin: 280, energiMax: 350, proteinMin: 5, proteinMax: 6.3, lemakMin: 10, lemakMax: 12.5, khMin: 44, khMax: 55 },
  { no: 2, kelompok: "Siswa SD/MI/SLB Kelas 1-3", distribusi: "Pagi", rujukanAkg: "20-25%", energiMin: 330, energiMax: 413, proteinMin: 8, proteinMax: 10, lemakMin: 11, lemakMax: 13.8, khMin: 50, khMax: 62.5 },
  { no: 3, kelompok: "Siswa SD/MI/SLB Kelas 4-6", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 585, energiMax: 683, proteinMin: 15.8, proteinMax: 18.4, lemakMin: 19.5, lemakMax: 22.8, khMin: 87, khMax: 101.5 },
  { no: 4, kelompok: "Siswa SMP/MTS/SMPLB", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 668, energiMax: 779, proteinMin: 20.3, proteinMax: 23.6, lemakMin: 22.5, lemakMax: 26.3, khMin: 97.7, khMax: 113.8 },
  { no: 5, kelompok: "Siswa SMA/SMK/MK/MASMALB", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 713, energiMax: 831, proteinMin: 21, proteinMax: 24.5, lemakMin: 22.5, lemakMax: 26.3, khMin: 105, khMax: 122.5 },
  { no: 6, kelompok: "Pendidik", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 713, energiMax: 831, proteinMin: 21, proteinMax: 24.5, lemakMin: 22.5, lemakMax: 26.3, khMin: 105, khMax: 122.5 },
  { no: 7, kelompok: "Tenaga Pendidikan", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 713, energiMax: 831, proteinMin: 21, proteinMax: 24.5, lemakMin: 22.5, lemakMax: 26.3, khMin: 105, khMax: 122.5 },
  { no: 8, kelompok: "Anak Balita", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 405, energiMax: 473, proteinMin: 6, proteinMax: 7, lemakMin: 13.5, lemakMax: 15.8, khMin: 64.5, khMax: 75.3 },
  { no: 9, kelompok: "Anak Balita Usia 13-59 Bulan", distribusi: "Siang", rujukanAkg: "20-25%", energiMin: 270, energiMax: 338, proteinMin: 4, proteinMax: 5, lemakMin: 9, lemakMax: 11.3, khMin: 43, khMax: 53.8 },
  { no: 10, kelompok: "Balita 6-11 Bulan", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 240, energiMax: 280, proteinMin: 4.5, proteinMax: 5.2, lemakMin: 10.5, lemakMax: 12.2, khMin: 31.5, khMax: 36.7 },
  { no: 11, kelompok: "Ibu Hamil", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 753, energiMax: 879, proteinMin: 22.1, proteinMax: 25.8, lemakMin: 20.2, lemakMax: 23.6, khMin: 118.5, khMax: 138.3 },
  { no: 12, kelompok: "Ibu Menyusui", distribusi: "Siang", rujukanAkg: "30-35%", energiMin: 782, energiMax: 912, proteinMin: 26.3, proteinMax: 30.6, lemakMin: 20.2, lemakMax: 23.5, khMin: 123, khMax: 143.5 }
];

interface FoodItem {
  bahan: string;
  urt: string;
  kotor: number;
  bersih: number;
}

interface FoodGroupSection {
  kelompokPangan: string;
  sp: number | string;
  items: FoodItem[];
}

interface StandarMakananGroup {
  id: string;
  title: string;
  badge: string;
  sections: FoodGroupSection[];
}

const STANDAR_MAKANAN_DATA: StandarMakananGroup[] = [
  {
    id: "balita",
    title: "STANDAR MAKANAN BALITA UNTUK MAKAN SIANG",
    badge: "Balita",
    sections: [
      {
        kelompokPangan: "Sumber Karbohidrat",
        sp: 1,
        items: [
          { bahan: "Beras", urt: "1/2 gelas", kotor: 50, bersih: 50 },
          { bahan: "Nasi", urt: "10 sdm", kotor: 100, bersih: 100 },
          { bahan: "Kentang", urt: "2 buah", kotor: 247, bersih: 210 },
          { bahan: "Mie Kering", urt: "1 gelas", kotor: 50, bersih: 50 },
          { bahan: "Roti Putih", urt: "3 lembar", kotor: 70, bersih: 70 },
          { bahan: "Ubi", urt: "1 buah", kotor: 159, bersih: 135 }
        ]
      },
      {
        kelompokPangan: "Protein Hewani",
        sp: 1,
        items: [
          { bahan: "Telur", urt: "1 butir", kotor: 62, bersih: 55 },
          { bahan: "Daging Ayam", urt: "1 potong", kotor: 69, bersih: 40 },
          { bahan: "Daging Sapi", urt: "2 potong", kotor: 35, bersih: 35 },
          { bahan: "Ikan Segar", urt: "3 potong", kotor: 50, bersih: 40 }
        ]
      },
      {
        kelompokPangan: "Protein Nabati",
        sp: 0.25,
        items: [
          { bahan: "Tempe", urt: "1/4 potong", kotor: 12.5, bersih: 12.5 },
          { bahan: "Tahu", urt: "1/2 potong", kotor: 27.5, bersih: 27.5 },
          { bahan: "Oncom", urt: "1/2 potong", kotor: 10, bersih: 10 }
        ]
      },
      {
        kelompokPangan: "Sayur",
        sp: 0.5,
        items: [
          { bahan: "Kol", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 62.5, bersih: 50 },
          { bahan: "Kangkung", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 56, bersih: 50 },
          { bahan: "Sawi", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 70, bersih: 50 },
          { bahan: "Wortel", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 54, bersih: 50 },
          { bahan: "Kacang Panjang", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 60, bersih: 50 },
          { bahan: "Buncis", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 67, bersih: 50 },
          { bahan: "Bayam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 83, bersih: 50 },
          { bahan: "Labu Siam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 57.5, bersih: 50 }
        ]
      },
      {
        kelompokPangan: "Buah",
        sp: 1,
        items: [
          { bahan: "Pisang", urt: "1 buah", kotor: 67, bersih: 50 },
          { bahan: "Jeruk", urt: "1 buah", kotor: 153, bersih: 110 },
          { bahan: "Semangka", urt: "1 potong", kotor: 391, bersih: 180 },
          { bahan: "Melon", urt: "1 potong", kotor: 327, bersih: 190 },
          { bahan: "Pepaya", urt: "1 potong", kotor: 147, bersih: 110 }
        ]
      },
      {
        kelompokPangan: "Sumber Lemak",
        sp: 1,
        items: [
          { bahan: "Minyak", urt: "1 sdt", kotor: 5, bersih: 5 },
          { bahan: "Santan", urt: "4 sdm", kotor: 40, bersih: 40 },
          { bahan: "Mentega", urt: "1 sdt", kotor: 5, bersih: 5 }
        ]
      },
      {
        kelompokPangan: "Susu*",
        sp: 0.625,
        items: [
          { bahan: "Susu", urt: "1 kotak kecil", kotor: 125, bersih: 125 }
        ]
      }
    ]
  },
  {
    id: "tk_paud",
    title: "STANDAR MAKANAN PESERTA DIDIK TK/PAUD UNTUK MAKAN SIANG",
    badge: "TK/PAUD",
    sections: [
      {
        kelompokPangan: "Sumber Karbohidrat",
        sp: 1.25,
        items: [
          { bahan: "Beras", urt: "1/3 gelas", kotor: 62.5, bersih: 65.5 },
          { bahan: "Nasi", urt: "12.5 sdm", kotor: 125, bersih: 125 },
          { bahan: "Kentang", urt: "2 1/4 buah", kotor: 309, bersih: 262.5 },
          { bahan: "Mie Kering", urt: "1 1/4 gelas", kotor: 62.5, bersih: 62.5 },
          { bahan: "Roti Putih", urt: "3 3/4 lembar", kotor: 87.5, bersih: 87.5 },
          { bahan: "Ubi", urt: "1 1/4 buah", kotor: 198.5, bersih: 169 }
        ]
      },
      {
        kelompokPangan: "Protein Hewani",
        sp: 1,
        items: [
          { bahan: "Telur", urt: "1 butir", kotor: 62, bersih: 55 },
          { bahan: "Daging Ayam", urt: "1 potong", kotor: 69, bersih: 40 },
          { bahan: "Daging Sapi", urt: "1 potong", kotor: 35, bersih: 35 },
          { bahan: "Ikan Segar", urt: "1 potong", kotor: 50, bersih: 40 }
        ]
      },
      {
        kelompokPangan: "Protein Nabati",
        sp: 0.5,
        items: [
          { bahan: "Tempe", urt: "1/2 potong", kotor: 25, bersih: 25 },
          { bahan: "Tahu", urt: "1 potong", kotor: 55, bersih: 55 },
          { bahan: "Oncom", urt: "1 potong", kotor: 20, bersih: 20 }
        ]
      },
      {
        kelompokPangan: "Sayur",
        sp: 0.5,
        items: [
          { bahan: "Kol", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 62.5, bersih: 50 },
          { bahan: "Kangkung", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 56, bersih: 50 },
          { bahan: "Sawi", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 70, bersih: 50 },
          { bahan: "Wortel", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 54, bersih: 50 },
          { bahan: "Kacang Panjang", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 60, bersih: 50 },
          { bahan: "Buncis", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 67, bersih: 50 },
          { bahan: "Bayam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 83, bersih: 50 },
          { bahan: "Labu Siam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 57.5, bersih: 50 }
        ]
      },
      {
        kelompokPangan: "Buah",
        sp: 1,
        items: [
          { bahan: "Pisang", urt: "1 buah", kotor: 67, bersih: 50 },
          { bahan: "Jeruk", urt: "1 buah", kotor: 153, bersih: 110 },
          { bahan: "Semangka", urt: "1 potong", kotor: 392, bersih: 180 },
          { bahan: "Melon", urt: "1 potong", kotor: 327, bersih: 190 },
          { bahan: "Pepaya", urt: "1 potong", kotor: 147, bersih: 110 }
        ]
      },
      {
        kelompokPangan: "Sumber Lemak",
        sp: 1,
        items: [
          { bahan: "Minyak", urt: "1 sdt", kotor: 5, bersih: 5 },
          { bahan: "Santan", urt: "4 sdm", kotor: 40, bersih: 40 },
          { bahan: "Mentega", urt: "1 sdt", kotor: 5, bersih: 5 }
        ]
      },
      {
        kelompokPangan: "Susu*",
        sp: 0.625,
        items: [
          { bahan: "Susu", urt: "1 kotak kecil", kotor: 125, bersih: 125 }
        ]
      }
    ]
  },
  {
    id: "sd_1_3",
    title: "STANDAR MAKANAN PESERTA DIDIK SD 1-3 UNTUK MAKAN SIANG",
    badge: "SD Kelas 1-3",
    sections: [
      {
        kelompokPangan: "Sumber Karbohidrat",
        sp: 1.25,
        items: [
          { bahan: "Beras", urt: "1/3 gelas", kotor: 62.5, bersih: 65.5 },
          { bahan: "Nasi", urt: "12.5 sdm", kotor: 125, bersih: 125 },
          { bahan: "Kentang", urt: "2 1/4 buah", kotor: 309, bersih: 262.5 },
          { bahan: "Mie Kering", urt: "1 1/4 gelas", kotor: 62.5, bersih: 62.5 },
          { bahan: "Roti Putih", urt: "3 3/4 lembar", kotor: 87.5, bersih: 87.5 },
          { bahan: "Ubi", urt: "1 1/4 buah", kotor: 198.5, bersih: 169 }
        ]
      },
      {
        kelompokPangan: "Protein Hewani",
        sp: 1,
        items: [
          { bahan: "Telur", urt: "1 butir", kotor: 62, bersih: 55 },
          { bahan: "Daging Ayam", urt: "1 potong", kotor: 69, bersih: 40 },
          { bahan: "Daging Sapi", urt: "1 potong", kotor: 35, bersih: 35 },
          { bahan: "Ikan Segar", urt: "1 potong", kotor: 50, bersih: 40 }
        ]
      },
      {
        kelompokPangan: "Protein Nabati",
        sp: 0.5,
        items: [
          { bahan: "Tempe", urt: "1/2 potong", kotor: 25, bersih: 25 },
          { bahan: "Tahu", urt: "1 potong", kotor: 55, bersih: 55 },
          { bahan: "Oncom", urt: "1 potong", kotor: 20, bersih: 20 }
        ]
      },
      {
        kelompokPangan: "Sayur",
        sp: 0.5,
        items: [
          { bahan: "Kol", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 62.5, bersih: 50 },
          { bahan: "Kangkung", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 56, bersih: 50 },
          { bahan: "Sawi", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 70, bersih: 50 },
          { bahan: "Wortel", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 54, bersih: 50 },
          { bahan: "Kacang Panjang", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 60, bersih: 50 },
          { bahan: "Buncis", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 67, bersih: 50 },
          { bahan: "Bayam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 83, bersih: 50 },
          { bahan: "Labu Siam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 57.5, bersih: 50 }
        ]
      },
      {
        kelompokPangan: "Buah",
        sp: 1,
        items: [
          { bahan: "Pisang", urt: "1 buah", kotor: 67, bersih: 50 },
          { bahan: "Jeruk", urt: "1 buah", kotor: 153, bersih: 110 },
          { bahan: "Semangka", urt: "1 potong", kotor: 392, bersih: 180 },
          { bahan: "Melon", urt: "1 potong", kotor: 327, bersih: 190 },
          { bahan: "Pepaya", urt: "1 potong", kotor: 147, bersih: 110 }
        ]
      },
      {
        kelompokPangan: "Sumber Lemak",
        sp: 1,
        items: [
          { bahan: "Minyak", urt: "1 sdt", kotor: 5, bersih: 5 },
          { bahan: "Santan", urt: "4 sdm", kotor: 40, bersih: 40 },
          { bahan: "Mentega", urt: "1 sdt", kotor: 5, bersih: 5 }
        ]
      },
      {
        kelompokPangan: "Susu*",
        sp: 0.625,
        items: [
          { bahan: "Susu", urt: "1 kotak kecil", kotor: 125, bersih: 125 }
        ]
      }
    ]
  },
  {
    id: "sd_4_6",
    title: "STANDAR MAKANAN PESERTA DIDIK SD/MI 4-6 UNTUK MAKAN SIANG",
    badge: "SD Kelas 4-6",
    sections: [
      {
        kelompokPangan: "Sumber Karbohidrat",
        sp: 1.5,
        items: [
          { bahan: "Beras", urt: "3/4 gelas", kotor: 75, bersih: 75 },
          { bahan: "Nasi", urt: "15 sdm", kotor: 150, bersih: 150 },
          { bahan: "Kentang", urt: "2 1/2 buah", kotor: 371, bersih: 315 },
          { bahan: "Mie Kering", urt: "1 1/2 gelas", kotor: 75, bersih: 75 },
          { bahan: "Roti Putih", urt: "5 lembar", kotor: 105, bersih: 105 },
          { bahan: "Ubi", urt: "1 1/2 buah", kotor: 238, bersih: 202.5 }
        ]
      },
      {
        kelompokPangan: "Protein Hewani",
        sp: 1,
        items: [
          { bahan: "Telur", urt: "1 butir", kotor: 62, bersih: 55 },
          { bahan: "Daging Ayam", urt: "1 potong", kotor: 69, bersih: 40 },
          { bahan: "Daging Sapi", urt: "1 potong", kotor: 35, bersih: 35 },
          { bahan: "Ikan Segar", urt: "1 potong", kotor: 50, bersih: 40 }
        ]
      },
      {
        kelompokPangan: "Protein Nabati",
        sp: 0.5,
        items: [
          { bahan: "Tempe", urt: "1/2 potong", kotor: 25, bersih: 25 },
          { bahan: "Tahu", urt: "1 potong", kotor: 55, bersih: 55 },
          { bahan: "Oncom", urt: "1 potong", kotor: 20, bersih: 20 }
        ]
      },
      {
        kelompokPangan: "Sayur",
        sp: 0.5,
        items: [
          { bahan: "Kol", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 62.5, bersih: 50 },
          { bahan: "Kangkung", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 56, bersih: 50 },
          { bahan: "Sawi", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 70, bersih: 50 },
          { bahan: "Wortel", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 54, bersih: 50 },
          { bahan: "Kacang Panjang", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 60, bersih: 50 },
          { bahan: "Buncis", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 67, bersih: 50 },
          { bahan: "Bayam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 83, bersih: 50 },
          { bahan: "Labu Siam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 57.5, bersih: 50 }
        ]
      },
      {
        kelompokPangan: "Buah",
        sp: 1,
        items: [
          { bahan: "Pisang", urt: "1 buah", kotor: 67, bersih: 50 },
          { bahan: "Jeruk", urt: "1 buah", kotor: 153, bersih: 110 },
          { bahan: "Semangka", urt: "1 potong", kotor: 392, bersih: 180 },
          { bahan: "Melon", urt: "1 potong", kotor: 327, bersih: 190 },
          { bahan: "Pepaya", urt: "1 potong", kotor: 147, bersih: 110 }
        ]
      },
      {
        kelompokPangan: "Sumber Lemak",
        sp: 1,
        items: [
          { bahan: "Minyak", urt: "1 sdt", kotor: 5, bersih: 5 },
          { bahan: "Santan", urt: "4 sdm", kotor: 40, bersih: 40 },
          { bahan: "Mentega", urt: "1 sdt", kotor: 5, bersih: 5 }
        ]
      },
      {
        kelompokPangan: "Susu*",
        sp: 0.625,
        items: [
          { bahan: "Susu", urt: "1 kotak kecil", kotor: 125, bersih: 125 }
        ]
      }
    ]
  },
  {
    id: "smp",
    title: "STANDAR MAKANAN PESERTA DIDIK SMP/MTs UNTUK MAKAN SIANG",
    badge: "SMP/MTs",
    sections: [
      {
        kelompokPangan: "Sumber Karbohidrat",
        sp: 1.5,
        items: [
          { bahan: "Beras", urt: "3/4 gelas", kotor: 75, bersih: 75 },
          { bahan: "Nasi", urt: "17 sdm", kotor: 175, bersih: 175 },
          { bahan: "Kentang", urt: "3 1/2 buah", kotor: 371, bersih: 315 },
          { bahan: "Mie Kering", urt: "1 3/4 gelas", kotor: 75, bersih: 75 },
          { bahan: "Roti Putih", urt: "5 1/2 lembar", kotor: 105, bersih: 105 },
          { bahan: "Ubi", urt: "1 3/4 buah", kotor: 238, bersih: 202.5 }
        ]
      },
      {
        kelompokPangan: "Protein Hewani",
        sp: 1,
        items: [
          { bahan: "Telur", urt: "1 butir", kotor: 62, bersih: 55 },
          { bahan: "Daging Ayam", urt: "1 potong", kotor: 69, bersih: 40 },
          { bahan: "Daging Sapi", urt: "1 potong", kotor: 35, bersih: 35 },
          { bahan: "Ikan Segar", urt: "1 potong", kotor: 50, bersih: 40 }
        ]
      },
      {
        kelompokPangan: "Protein Nabati",
        sp: 0.5,
        items: [
          { bahan: "Tempe", urt: "1/2 potong", kotor: 25, bersih: 25 },
          { bahan: "Tahu", urt: "1 potong", kotor: 55, bersih: 55 },
          { bahan: "Oncom", urt: "1 potong", kotor: 20, bersih: 20 }
        ]
      },
      {
        kelompokPangan: "Sayur",
        sp: 0.5,
        items: [
          { bahan: "Kol", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 62.5, bersih: 50 },
          { bahan: "Kangkung", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 56, bersih: 50 },
          { bahan: "Sawi", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 70, bersih: 50 },
          { bahan: "Wortel", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 54, bersih: 50 },
          { bahan: "Kacang Panjang", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 60, bersih: 50 },
          { bahan: "Buncis", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 67, bersih: 50 },
          { bahan: "Bayam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 83, bersih: 50 },
          { bahan: "Labu Siam", urt: "1/2 mangkuk sayuran tanpa kuah (50 gram)", kotor: 57.5, bersih: 50 }
        ]
      },
      {
        kelompokPangan: "Buah",
        sp: 1,
        items: [
          { bahan: "Pisang", urt: "1 buah", kotor: 67, bersih: 50 },
          { bahan: "Jeruk", urt: "1 buah", kotor: 153, bersih: 110 },
          { bahan: "Semangka", urt: "1 potong", kotor: 392, bersih: 180 },
          { bahan: "Melon", urt: "1 potong", kotor: 327, bersih: 190 },
          { bahan: "Pepaya", urt: "1 potong", kotor: 147, bersih: 110 }
        ]
      },
      {
        kelompokPangan: "Sumber Lemak",
        sp: 1,
        items: [
          { bahan: "Minyak", urt: "1 sdt", kotor: 5, bersih: 5 },
          { bahan: "Santan", urt: "4 sdm", kotor: 40, bersih: 40 },
          { bahan: "Mentega", urt: "1 sdt", kotor: 5, bersih: 5 }
        ]
      },
      {
        kelompokPangan: "Susu*",
        sp: 0.625,
        items: [
          { bahan: "Susu", urt: "1 kotak kecil", kotor: 125, bersih: 125 }
        ]
      }
    ]
  },
  {
    id: "sma",
    title: "STANDAR MAKANAN PESERTA DIDIK SMA/MA UNTUK MAKAN SIANG",
    badge: "SMA/MA",
    sections: [
      {
        kelompokPangan: "Sumber Karbohidrat",
        sp: 1.5,
        items: [
          { bahan: "Beras", urt: "1 gelas", kotor: 100, bersih: 100 },
          { bahan: "Nasi", urt: "20 sdm", kotor: 200, bersih: 200 },
          { bahan: "Kentang", urt: "4 buah", kotor: 494, bersih: 420 },
          { bahan: "Mie Kering", urt: "1 gelas", kotor: 100, bersih: 100 },
          { bahan: "Roti Putih", urt: "6 lembar", kotor: 140, bersih: 140 },
          { bahan: "Ubi", urt: "2 buah", kotor: 270, bersih: 270 }
        ]
      },
      {
        kelompokPangan: "Protein Hewani",
        sp: 1,
        items: [
          { bahan: "Telur", urt: "1 1/2 butir", kotor: 93, bersih: 82.5 },
          { bahan: "Daging Ayam", urt: "1 1/2 potong", kotor: 52.2, bersih: 52.5 },
          { bahan: "Daging Sapi", urt: "1 1/2 potong", kotor: 104, bersih: 60 },
          { bahan: "Ikan Segar", urt: "1 1/2 potong", kotor: 75, bersih: 60 }
        ]
      },
      {
        kelompokPangan: "Protein Nabati",
        sp: 0.5,
        items: [
          { bahan: "Tempe", urt: "1/2 potong", kotor: 25, bersih: 25 },
          { bahan: "Tahu", urt: "1 potong", kotor: 55, bersih: 55 },
          { bahan: "Oncom", urt: "1 potong", kotor: 20, bersih: 20 }
        ]
      },
      {
        kelompokPangan: "Sayur",
        sp: 0.5,
        items: [
          { bahan: "Kol", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 125, bersih: 100 },
          { bahan: "Kangkung", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 111, bersih: 100 },
          { bahan: "Sawi", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 141, bersih: 100 },
          { bahan: "Wortel", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 109, bersih: 100 },
          { bahan: "Kacang Panjang", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 120.5, bersih: 100 },
          { bahan: "Buncis", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 133, bersih: 100 },
          { bahan: "Bayam", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 167, bersih: 100 },
          { bahan: "Labu Siam", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 115, bersih: 100 }
        ]
      },
      {
        kelompokPangan: "Buah",
        sp: 1,
        items: [
          { bahan: "Pisang", urt: "1 buah", kotor: 67, bersih: 50 },
          { bahan: "Jeruk", urt: "1 buah", kotor: 153, bersih: 110 },
          { bahan: "Semangka", urt: "1 potong", kotor: 392, bersih: 180 },
          { bahan: "Melon", urt: "1 potong", kotor: 327, bersih: 190 },
          { bahan: "Pepaya", urt: "1 potong", kotor: 147, bersih: 110 }
        ]
      },
      {
        kelompokPangan: "Sumber Lemak",
        sp: 1,
        items: [
          { bahan: "Minyak", urt: "1 sdt", kotor: 5, bersih: 5 },
          { bahan: "Santan", urt: "4 sdm", kotor: 40, bersih: 40 },
          { bahan: "Mentega", urt: "1 sdt", kotor: 5, bersih: 5 }
        ]
      },
      {
        kelompokPangan: "Susu*",
        sp: 1,
        items: [
          { bahan: "Susu", urt: "1 kotak kecil", kotor: 200, bersih: 200 }
        ]
      }
    ]
  },
  {
    id: "bumil_busui",
    title: "STANDAR MAKANAN BUMIL & BUSUI UNTUK MAKAN SIANG",
    badge: "Bumil & Busui",
    sections: [
      {
        kelompokPangan: "Sumber Karbohidrat",
        sp: 1.5,
        items: [
          { bahan: "Beras", urt: "1 1/4 gelas", kotor: 125, bersih: 125 },
          { bahan: "Nasi", urt: "25 sdm", kotor: 250, bersih: 250 },
          { bahan: "Kentang", urt: "5 buah", kotor: 618, bersih: 525 },
          { bahan: "Mie Kering", urt: "1 1/2 gelas", kotor: 125, bersih: 125 },
          { bahan: "Roti Putih", urt: "7 1/2 gelas", kotor: 175, bersih: 175 },
          { bahan: "Ubi", urt: "2 1/2 buah", kotor: 397, bersih: 337.5 }
        ]
      },
      {
        kelompokPangan: "Protein Hewani",
        sp: 1,
        items: [
          { bahan: "Telur", urt: "2 butir", kotor: 124, bersih: 110 },
          { bahan: "Daging Ayam", urt: "2 potong", kotor: 138, bersih: 80 },
          { bahan: "Daging Sapi", urt: "2 potong", kotor: 70, bersih: 70 },
          { bahan: "Ikan Segar", urt: "3/4 potong", kotor: 100, bersih: 80 }
        ]
      },
      {
        kelompokPangan: "Protein Nabati",
        sp: 0.5,
        items: [
          { bahan: "Tempe", urt: "1 potong", kotor: 50, bersih: 50 },
          { bahan: "Tahu", urt: "1 potong", kotor: 110, bersih: 110 },
          { bahan: "Oncom", urt: "2 potong", kotor: 40, bersih: 40 }
        ]
      },
      {
        kelompokPangan: "Sayur",
        sp: 0.5,
        items: [
          { bahan: "Kol", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 125, bersih: 100 },
          { bahan: "Kangkung", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 111, bersih: 100 },
          { bahan: "Sawi", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 141, bersih: 100 },
          { bahan: "Wortel", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 109, bersih: 100 },
          { bahan: "Kacang Panjang", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 120.5, bersih: 100 },
          { bahan: "Buncis", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 133, bersih: 100 },
          { bahan: "Bayam", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 167, bersih: 100 },
          { bahan: "Labu Siam", urt: "1 mangkuk sayuran tanpa kuah (100 gram)", kotor: 115, bersih: 100 }
        ]
      },
      {
        kelompokPangan: "Buah",
        sp: 1,
        items: [
          { bahan: "Pisang", urt: "1 buah", kotor: 67, bersih: 50 },
          { bahan: "Jeruk", urt: "1 buah", kotor: 153, bersih: 110 },
          { bahan: "Semangka", urt: "1 potong", kotor: 392, bersih: 180 },
          { bahan: "Melon", urt: "1 potong", kotor: 327, bersih: 190 },
          { bahan: "Pepaya", urt: "1 potong", kotor: 147, bersih: 110 }
        ]
      },
      {
        kelompokPangan: "Sumber Lemak",
        sp: 1,
        items: [
          { bahan: "Minyak", urt: "2 sdt", kotor: 10, bersih: 10 },
          { bahan: "Santan", urt: "8 sdm", kotor: 80, bersih: 80 },
          { bahan: "Mentega", urt: "2 sdt", kotor: 10, bersih: 10 }
        ]
      },
      {
        kelompokPangan: "Susu*",
        sp: 1,
        items: [
          { bahan: "Susu", urt: "1 kotak kecil", kotor: 200, bersih: 200 }
        ]
      }
    ]
  }
];

function RujukanJuknisTab() {
  const [subTab, setSubTab] = useState<"akg" | "standar">("akg");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStandarId, setSelectedStandarId] = useState<string>("balita");

  const filteredData = JUKNIS_DATA.filter((row) =>
    row.kelompok.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.distribusi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStandar = STANDAR_MAKANAN_DATA.find((g) => g.id === selectedStandarId) || STANDAR_MAKANAN_DATA[0];

  const handleDownloadExcel = () => {
    // Generate simple and elegant Excel output for Standar Makanan
    const rows: any[] = [];
    selectedStandar.sections.forEach((section) => {
      section.items.forEach((item) => {
        rows.push({
          "Kelompok Pangan": section.kelompokPangan,
          "Satuan Penukar (SP)": section.sp,
          "Contoh Bahan Pangan": item.bahan,
          "URT": item.urt,
          "Berat Kotor (g)": item.kotor,
          "Berat Bersih (g)": item.bersih,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Standar Makanan");
    XLSX.writeFile(wb, `${selectedStandar.title.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-100/30 p-6 rounded-2xl border border-emerald-100/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Rujukan Juknis BGN No. 401.1/2025
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Tabel Angka Kecukupan Gizi (AKG) rujukan resmi serta standar porsi makan siang bergizi terpadu.
          </p>
        </div>

        {/* Sub-tab Toggles */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setSubTab("akg")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === "akg"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Rujukan AKG
          </button>
          <button
            onClick={() => setSubTab("standar")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === "standar"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Standar Porsi Makanan
          </button>
        </div>
      </div>

      {subTab === "akg" ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Search Box */}
          <div className="flex justify-end">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kelompok sasaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-500 text-slate-950 p-4 font-black text-center text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-2">
              <span>Rujukan Angka Kecukupan Gizi Juknis BGN No. 401.1 Tahun 2025</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-emerald-600 text-white text-[11px] font-bold tracking-wider uppercase border-b border-emerald-700">
                    <th className="p-3 w-12 text-center" rowSpan={2}>No.</th>
                    <th className="p-3 min-w-[200px]" rowSpan={2}>Kelompok Sasaran</th>
                    <th className="p-3 text-center" rowSpan={2}>Pendistribusian MBG</th>
                    <th className="p-3 text-center" rowSpan={2}>Rujukan % AKG</th>
                    <th className="p-3 text-center border-l border-emerald-500/50" colSpan={2}>Energi (kkal)</th>
                    <th className="p-3 text-center border-l border-emerald-500/50" colSpan={2}>Protein (g)</th>
                    <th className="p-3 text-center border-l border-emerald-500/50" colSpan={2}>Lemak (g)</th>
                    <th className="p-3 text-center border-l border-emerald-500/50" colSpan={2}>KH (g)</th>
                  </tr>
                  <tr className="bg-emerald-700 text-white text-[10px] font-bold tracking-wider uppercase border-b border-emerald-800">
                    <th className="p-2 text-center border-l border-emerald-500/30">Min</th>
                    <th className="p-2 text-center">Max</th>
                    <th className="p-2 text-center border-l border-emerald-500/30">Min</th>
                    <th className="p-2 text-center">Max</th>
                    <th className="p-2 text-center border-l border-emerald-500/30">Min</th>
                    <th className="p-2 text-center">Max</th>
                    <th className="p-2 text-center border-l border-emerald-500/30">Min</th>
                    <th className="p-2 text-center">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <tr
                        key={row.no}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                        }`}
                      >
                        <td className="p-3 text-center font-semibold text-slate-400">{row.no}</td>
                        <td className="p-3 font-bold text-slate-800">{row.kelompok}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.distribusi === "Pagi"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                            }`}
                          >
                            {row.distribusi}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-teal-700 bg-teal-50/30">
                          {row.rujukanAkg}
                        </td>
                        <td className="p-3 text-center border-l border-slate-100 font-mono text-slate-800 bg-amber-50/10">
                          {row.energiMin}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-800 bg-amber-50/10">
                          {row.energiMax}
                        </td>
                        <td className="p-3 text-center border-l border-slate-100 font-mono text-slate-800 bg-indigo-50/10">
                          {row.proteinMin}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-800 bg-indigo-50/10">
                          {row.proteinMax}
                        </td>
                        <td className="p-3 text-center border-l border-slate-100 font-mono text-slate-800 bg-rose-50/10">
                          {row.lemakMin}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-800 bg-rose-50/10">
                          {row.lemakMax}
                        </td>
                        <td className="p-3 text-center border-l border-slate-100 font-mono text-slate-800 bg-cyan-50/10">
                          {row.khMin}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-800 bg-cyan-50/10">
                          {row.khMax}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">
                        Kelompok sasaran tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] font-semibold text-slate-500">
              Perhitungan Standar Gizi MBG Mengikuti Peraturan Kementerian Kesehatan Nomor 28 Tahun 2019
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Selection of Standar Makanan Group */}
          <div className="bg-slate-100/60 border border-slate-200/80 p-4 rounded-2xl flex flex-wrap gap-2 items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
              Pilih Standar Porsi:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STANDAR_MAKANAN_DATA.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedStandarId(g.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    selectedStandarId === g.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:text-slate-800 border border-slate-200"
                  }`}
                >
                  {g.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Standard Table View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Title Bar exactly styled as original green header */}
            <div className="bg-[#8ecb47] text-slate-950 p-4 font-black text-center text-sm md:text-base uppercase tracking-wider flex items-center justify-between gap-4">
              <div className="w-6"></div> {/* Spacer to center title */}
              <span className="text-slate-900">{selectedStandar.title}</span>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 rounded-lg text-xs font-bold transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#38b249] text-white text-[11px] font-bold tracking-wider uppercase border-b border-[#2d8d3a]">
                    <th className="p-3 border-r border-[#2d8d3a] text-center w-[160px]">Kelompok Pangan</th>
                    <th className="p-3 border-r border-[#2d8d3a] text-center w-[110px]">Satuan Penukar (SP)</th>
                    <th className="p-3 border-r border-[#2d8d3a] pl-5">Contoh Bahan Pangan</th>
                    <th className="p-3 border-r border-[#2d8d3a] text-center w-[160px]">URT (Ukuran Rumah Tangga)</th>
                    <th className="p-3 border-r border-[#2d8d3a] text-right pr-6 w-[130px]">Berat Kotor (g)</th>
                    <th className="p-3 text-right pr-6 w-[130px]">Berat Bersih (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {selectedStandar.sections.map((section, sIdx) => {
                    return section.items.map((item, iIdx) => {
                      return (
                        <tr key={`${sIdx}-${iIdx}`} className="hover:bg-slate-50/50 transition-colors">
                          {iIdx === 0 && (
                            <td
                              rowSpan={section.items.length}
                              className="p-3.5 bg-emerald-50/60 text-slate-800 font-extrabold text-[11px] text-center border-r border-slate-200 uppercase tracking-wide"
                            >
                              {section.kelompokPangan}
                            </td>
                          )}
                          {iIdx === 0 && (
                            <td
                              rowSpan={section.items.length}
                              className="p-3.5 bg-white text-slate-800 font-bold text-xs text-center border-r border-slate-200"
                            >
                              {section.sp}
                            </td>
                          )}
                          <td className="p-2.5 pl-5 font-semibold text-slate-800 border-r border-slate-200">
                            {item.bahan}
                          </td>
                          <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 text-center">
                            {item.urt}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-500 border-r border-slate-200 text-right pr-6 bg-slate-50/10">
                            {item.kotor}g
                          </td>
                          <td className="p-2.5 font-mono font-extrabold text-emerald-700 text-right pr-6 bg-emerald-50/10">
                            {item.bersih}g
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-emerald-50/30 border-t border-slate-200 text-center text-[11px] font-bold text-emerald-800/80">
              Perhitungan Standar Gizi MBG Mengikuti Peraturan Kementerian Kesehatan Nomor 28 Tahun 2019
            </div>
          </div>
        </div>
      )}

      {/* Additional informative cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 p-5 rounded-2xl border border-indigo-100/30 space-y-3">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" />
            Aturan Distribusi Gizi
          </h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✔</span>
              <span><strong>Pagi (20-25%):</strong> Untuk siswa TK/PAUD dan SD kelas rendah (1-3) guna membiasakan sarapan bergizi di awal hari sekolah.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✔</span>
              <span><strong>Siang (30-35%):</strong> Untuk siswa SD kelas tinggi, SMP, SMA, serta Guru/Tenaga Kependidikan untuk asupan makan siang produktif.</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-teal-50/50 to-slate-50 p-5 rounded-2xl border border-teal-100/30 space-y-3">
          <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-teal-500" />
            Kombinasi Makronutrisi Seimbang
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sesuai regulasi gizi terpadu, proporsi asupan energi harian didistribusikan secara berimbang antara karbohidrat, protein berkualitas tinggi, serta lemak sehat esensial guna mengoptimalkan pertumbuhan kognitif dan fisik generasi bangsa.
          </p>
        </div>
      </div>
    </div>
  );
}

export default React.memo(RujukanJuknisTab);
