/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SPPGProfile, SekolahPM, TigaBPM, MasterMenu, FoodCostDay, KelompokSasaranPM, HariPM } from "./types";

export const INITIAL_SPPG_PROFILE: SPPGProfile = {
  namaLembaga: "SPPG Muna Barat Sawerigadi Ondoke",
  alamat: "Jl. Poros Sawerigadi No. 12, Ondoke, Muna Barat, Sulawesi Tenggara",
  namaKepala: "La Ode Muhammad Yusuf, S.Pd.",
  namaAhliGizi: "Sitti Aminah, S.Gz.",
  namaYayasan: "Yayasan Sinergi Membangun Sultra",
  ketuaYayasan: "Drs. H. Syukri Yusuf, M.Si.",
  namaAkuntan: "Megawati, S.Ak.",
  tahunAnggaran: "2026",
  periodeDates: [
    "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11",
    "2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18"
  ],
  awalPeriodeBerikutnya: "2026-07-20"
};

export const INITIAL_SEKOLAH_PM: SekolahPM[] = [
  { id: "sch_1", namaSekolah: "TK Ondoke", alamatDesa: "Desa Ondoke", porsiKecil: 35, porsiBesar: 0, alergi: 2 },
  { id: "sch_2", namaSekolah: "SDN 1 Sawerigadi", alamatDesa: "Desa Ondoke", porsiKecil: 120, porsiBesar: 140, alergi: 8 },
  { id: "sch_3", namaSekolah: "SDN 2 Sawerigadi", alamatDesa: "Desa Sawerigadi", porsiKecil: 80, porsiBesar: 95, alergi: 5 },
  { id: "sch_4", namaSekolah: "SDN 3 Sawerigadi", alamatDesa: "Desa Lawada", porsiKecil: 45, porsiBesar: 55, alergi: 3 },
  { id: "sch_5", namaSekolah: "SMPN 1 Sawerigadi", alamatDesa: "Desa Ondoke", porsiKecil: 0, porsiBesar: 180, alergi: 10 },
  { id: "sch_6", namaSekolah: "SMPN 2 Sawerigadi", alamatDesa: "Desa Marobea", porsiKecil: 0, porsiBesar: 110, alergi: 6 },
  { id: "sch_7", namaSekolah: "SMAN 1 Sawerigadi", alamatDesa: "Desa Ondoke", porsiKecil: 0, porsiBesar: 220, alergi: 12 },
  { id: "sch_8", namaSekolah: "PAUD Al-Hidayah", alamatDesa: "Desa Marobea", porsiKecil: 25, porsiBesar: 0, alergi: 1 },
  { id: "sch_9", namaSekolah: "SDN 1 Marobea", alamatDesa: "Desa Marobea", porsiKecil: 60, porsiBesar: 70, alergi: 4 },
  { id: "sch_10", namaSekolah: "SDN 2 Marobea", alamatDesa: "Desa Marobea", porsiKecil: 50, porsiBesar: 55, alergi: 3 },
  { id: "sch_11", namaSekolah: "SDN 1 Lawada", alamatDesa: "Desa Lawada", porsiKecil: 70, porsiBesar: 80, alergi: 5 },
  { id: "sch_12", namaSekolah: "SMPN 3 Sawerigadi", alamatDesa: "Desa Lawada", porsiKecil: 0, porsiBesar: 90, alergi: 4 },
  { id: "sch_13", namaSekolah: "MAS Sawerigadi", alamatDesa: "Desa Sawerigadi", porsiKecil: 0, porsiBesar: 105, alergi: 5 },
  { id: "sch_14", namaSekolah: "TK Sawerigadi", alamatDesa: "Desa Sawerigadi", porsiKecil: 30, porsiBesar: 0, alergi: 1 },
  { id: "sch_15", namaSekolah: "SDN 1 Wawona", alamatDesa: "Desa Wawona", porsiKecil: 55, porsiBesar: 65, alergi: 4 },
  { id: "sch_16", namaSekolah: "SDN 2 Wawona", alamatDesa: "Desa Wawona", porsiKecil: 40, porsiBesar: 45, alergi: 2 },
  { id: "sch_17", namaSekolah: "TK Lawada", alamatDesa: "Desa Lawada", porsiKecil: 22, porsiBesar: 0, alergi: 1 },
  { id: "sch_18", namaSekolah: "PAUD Cerdas Ceria", alamatDesa: "Desa Wawona", porsiKecil: 18, porsiBesar: 0, alergi: 1 },
  { id: "sch_19", namaSekolah: "SDN 1 Kampobalano", alamatDesa: "Desa Kampobalano", porsiKecil: 65, porsiBesar: 75, alergi: 5 },
  { id: "sch_20", namaSekolah: "SDN 2 Kampobalano", alamatDesa: "Desa Kampobalano", porsiKecil: 48, porsiBesar: 50, alergi: 3 },
  { id: "sch_21", namaSekolah: "SMPN 4 Sawerigadi", alamatDesa: "Desa Kampobalano", porsiKecil: 0, porsiBesar: 115, alergi: 6 },
  { id: "sch_22", namaSekolah: "TK Kampobalano", alamatDesa: "Desa Kampobalano", porsiKecil: 26, porsiBesar: 0, alergi: 1 },
  { id: "sch_23", namaSekolah: "SDN 1 Niandar", alamatDesa: "Desa Niandar", porsiKecil: 40, porsiBesar: 45, alergi: 2 },
  { id: "sch_24", namaSekolah: "TK Niandar", alamatDesa: "Desa Niandar", porsiKecil: 15, porsiBesar: 0, alergi: 1 },
  { id: "sch_25", namaSekolah: "SDN 1 Lombu Jaya", alamatDesa: "Desa Lombu Jaya", porsiKecil: 52, porsiBesar: 60, alergi: 3 },
  { id: "sch_26", namaSekolah: "SMPN 5 Sawerigadi", alamatDesa: "Desa Lombu Jaya", porsiKecil: 0, porsiBesar: 80, alergi: 4 },
  { id: "sch_27", namaSekolah: "TK Lombu Jaya", alamatDesa: "Desa Lombu Jaya", porsiKecil: 20, porsiBesar: 0, alergi: 1 },
  { id: "sch_28", namaSekolah: "SDN 1 Lakalamba", alamatDesa: "Desa Lakalamba", porsiKecil: 58, porsiBesar: 68, alergi: 4 },
  { id: "sch_29", namaSekolah: "SMP Satap Lakalamba", alamatDesa: "Desa Lakalamba", porsiKecil: 0, porsiBesar: 72, alergi: 3 },
  { id: "sch_30", namaSekolah: "TK Lakalamba", alamatDesa: "Desa Lakalamba", porsiKecil: 22, porsiBesar: 0, alergi: 1 },
  { id: "sch_31", namaSekolah: "SDN 1 Ondoke (Sore)", alamatDesa: "Desa Ondoke", porsiKecil: 30, porsiBesar: 40, alergi: 2 }
];

export const INITIAL_TIGAB_PM: TigaBPM[] = [
  { id: "3b_1", namaDesa: "Desa Ondoke", bumil: 12, balita: 45, busui: 15, mpAsi: 20, alergi: 2 },
  { id: "3b_2", namaDesa: "Desa Sawerigadi", bumil: 8, balita: 30, busui: 10, mpAsi: 15, alergi: 1 },
  { id: "3b_3", namaDesa: "Desa Lawada", bumil: 10, balita: 28, busui: 12, mpAsi: 14, alergi: 1 },
  { id: "3b_4", namaDesa: "Desa Marobea", bumil: 7, balita: 25, busui: 9, mpAsi: 12, alergi: 1 }
];

export const INITIAL_MASTER_MENU: MasterMenu = {
  usiaSekolah: [
    { namaMenu: "Nasi Kuning Ayam Penyet", karbohidrat: "Nasi Giling Kuning", laukHewani: "Daging Ayam Bakar/Penyet", laukNabati: "Tempe Bacem", sayur: "Sup Wortel", buahSusu: "Susu Fullcream + Pisang" },
    { namaMenu: "Nasi Putih Ikan Bakar", karbohidrat: "Nasi Putih", laukHewani: "Ikan Kembung Panggang", laukNabati: "Tahu Goreng Gurih", sayur: "Cah Kangkung Bawang", buahSusu: "Jeruk Manis" },
    { namaMenu: "Bubur Sup Ayam Suwir", karbohidrat: "Bubur Beras Giling", laukHewani: "Ayam Suwir Panggang", laukNabati: "Kacang Tanah Sangrai", sayur: "Bening Bayam & Tomat", buahSusu: "Susu Fullcream" },
    { namaMenu: "Nasi Tim Telur Dadar", karbohidrat: "Nasi Tim Lembek", laukHewani: "Telur Dadar Sayur", laukNabati: "Tempe Goreng Tepung", sayur: "Sup Wortel Kentang", buahSusu: "Pisang Ambon" },
    { namaMenu: "Nasi Uduk Ayam Goreng", karbohidrat: "Nasi Uduk Gurih", laukHewani: "Ayam Goreng Lengkuas", laukNabati: "Tahu Bacem", sayur: "Tumis Labu Siam", buahSusu: "Jeruk Manis" },
    { namaMenu: "Nasi Putih Daging Semur", karbohidrat: "Nasi Putih", laukHewani: "Semur Daging Sapi", laukNabati: "Tempe Mendoan", sayur: "Sup Kacang Polong Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Nasi Kuning Telur Balado", karbohidrat: "Nasi Kuning", laukHewani: "Telur Bulat Rebus Balado", laukNabati: "Tahu Goreng Kuning", sayur: "Cah Sayur Hijau", buahSusu: "Susu Fullcream + Jeruk" },
    { namaMenu: "Nasi Putih Ikan Goreng Tepung", karbohidrat: "Nasi Putih", laukHewani: "Ikan Fillet Goreng Tepung", laukNabati: "Tempe Penyet", sayur: "Sup Tomat & Wortel", buahSusu: "Susu Fullcream" },
    { namaMenu: "Bubur Gurih Udang Rebus", karbohidrat: "Bubur Gurih Santan", laukHewani: "Udang Kupas Rebus", laukNabati: "Tahu Bacem", sayur: "Cah Kangkung Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Nasi Putih Ayam Semur", karbohidrat: "Nasi Putih", laukHewani: "Semur Daging Ayam", laukNabati: "Tempe Goreng Kuning", sayur: "Bening Bayam Jagung", buahSusu: "Jeruk Manis" },
    { namaMenu: "Nasi Uduk Telur Dadar", karbohidrat: "Nasi Uduk", laukHewani: "Telur Dadar Iris", laukNabati: "Tahu Goreng", sayur: "Sup Wortel Kentang Kol", buahSusu: "Susu Fullcream" },
    { namaMenu: "Nasi Putih Ikan Asam Manis", karbohidrat: "Nasi Putih", laukHewani: "Ikan Kakap Asam Manis", laukNabati: "Kacang Tanah Sangrai", sayur: "Tumis Kangkung Cabai", buahSusu: "Pisang Ambon" }
  ],
  tigaB: [
    { namaMenu: "Nasi Kuning Ayam Kuah Jahe", karbohidrat: "Nasi Kuning", laukHewani: "Daging Ayam rebus jahe", laukNabati: "Tempe Rebus Gurih", sayur: "Sup Wortel Tomat", buahSusu: "Susu Fullcream + Pisang" },
    { namaMenu: "Nasi Putih Ikan Panggang", karbohidrat: "Nasi Putih", laukHewani: "Ikan Kembung Kukus", laukNabati: "Tahu Kukus Daun Kelor", sayur: "Bening Kangkung", buahSusu: "Jeruk Manis" },
    { namaMenu: "Bubur Lembut Ayam Sayur", karbohidrat: "Bubur Beras", laukHewani: "Ayam Suwir Halus", laukNabati: "Tahu Halus Kukus", sayur: "Sup Bayam Wortel", buahSusu: "Susu Fullcream" },
    { namaMenu: "Nasi Tim Telur Rebus", karbohidrat: "Nasi Tim", laukHewani: "Telur Rebus Setengah Matang", laukNabati: "Tempe Halus Kukus", sayur: "Sup Labu Siam Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Nasi Uduk Ayam Kukus", karbohidrat: "Nasi Uduk", laukHewani: "Ayam Kukus Bumbu Kuning", laukNabati: "Tahu Kukus", sayur: "Tumis Wortel Buncis", buahSusu: "Jeruk Manis" },
    { namaMenu: "Nasi Daging Sapi Cincang", karbohidrat: "Nasi Putih", laukHewani: "Semur Daging Cincang", laukNabati: "Tempe Rebus", sayur: "Sup Brokoli Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Nasi Kuning Telur Ceplok Air", karbohidrat: "Nasi Kuning", laukHewani: "Telur Ceplok Air", laukNabati: "Tahu Kukus", sayur: "Sup Bayam Bening", buahSusu: "Susu Fullcream + Jeruk" },
    { namaMenu: "Nasi Ikan Fillet Kukus", karbohidrat: "Nasi Putih", laukHewani: "Ikan Fillet Kukus Jahe", laukNabati: "Tempe Mendoan Oven", sayur: "Sup Tomat Kentang", buahSusu: "Susu Fullcream" },
    { namaMenu: "Bubur Udang Halus Kentang", karbohidrat: "Bubur Kentang Beras", laukHewani: "Udang Kupas Cincang", laukNabati: "Tahu Tim", sayur: "Sayur Sop Kangkung Bayam", buahSusu: "Pisang Ambon" },
    { namaMenu: "Nasi Ayam Cincang Tomat", karbohidrat: "Nasi Putih", laukHewani: "Cincang Ayam Masak Tomat", laukNabati: "Tempe Kukus", sayur: "Bening Bayam Wortel", buahSusu: "Jeruk Manis" },
    { namaMenu: "Nasi Uduk Telur Dadar Kukus", karbohidrat: "Nasi Uduk", laukHewani: "Telur Dadar Kukus Sayur", laukNabati: "Tahu Goreng Tipis", sayur: "Sup Wortel Kentang", buahSusu: "Susu Fullcream" },
    { namaMenu: "Nasi Ikan Masak Woku (Tidak Pedas)", karbohidrat: "Nasi Putih", laukHewani: "Ikan Kembung Kukus Woku", laukNabati: "Kacang Merah Rebus", sayur: "Sayur Kangkung Bening", buahSusu: "Pisang Ambon" }
  ],
  mpAsi: [
    { namaMenu: "Bubur Saring Beras Ayam Saring", karbohidrat: "Tepung Beras", laukHewani: "Ayam Cincang Saring", laukNabati: "Tahu Saring", sayur: "Wortel Halus", buahSusu: "Susu Ibu / Formula" },
    { namaMenu: "Puree Kentang Ikan Kukus", karbohidrat: "Kentang Halus", laukHewani: "Ikan Fillet Saring", laukNabati: "Tempe Kukus Saring", sayur: "Bayam Saring", buahSusu: "Susu" },
    { namaMenu: "Bubur Susu Telur Saring", karbohidrat: "Tepung Beras", laukHewani: "Kuning Telur Rebus", laukNabati: "Tahu Halus", sayur: "Labu Siam Saring", buahSusu: "Susu Formula" },
    { namaMenu: "Puree Beras Merah Daging Sapi Saring", karbohidrat: "Tepung Beras Merah", laukHewani: "Daging Sapi Cincang Saring", laukNabati: "Tempe Saring", sayur: "Wortel Halus", buahSusu: "Susu" },
    { namaMenu: "Bubur Saring Ayam Jagung Manis", karbohidrat: "Bubur Beras", laukHewani: "Daging Ayam Cincang", laukNabati: "Tahu Halus", sayur: "Bayam Halus", buahSusu: "Susu" },
    { namaMenu: "Puree Labu Kuning Daging Ayam", karbohidrat: "Labu Kuning Halus", laukHewani: "Ayam Cincang Saring", laukNabati: "Kacang Hijau Saring", sayur: "Wortel Saring", buahSusu: "Susu" },
    { namaMenu: "Bubur Saring Telur Puyuh", karbohidrat: "Tepung Beras", laukHewani: "Kuning Telur Puyuh", laukNabati: "Tahu Saring", sayur: "Tomat Saring", buahSusu: "Susu" },
    { namaMenu: "Puree Kentang Ikan Kembung Saring", karbohidrat: "Kentang Kukus Halus", laukHewani: "Ikan Kembung Fillet Saring", laukNabati: "Tempe Kukus Saring", sayur: "Kangkung Saring", buahSusu: "Susu" },
    { namaMenu: "Bubur Saring Udang Cincang", karbohidrat: "Tepung Beras", laukHewani: "Udang Kupas Saring", laukNabati: "Tahu Kukus Halus", sayur: "Labu Siam Halus", buahSusu: "Susu" },
    { namaMenu: "Puree Pisang Susu", karbohidrat: "Pisang Halus", laukHewani: "Kuning Telur Saring", laukNabati: "Kacang Merah Halus", sayur: "Bayam Halus", buahSusu: "Susu Fullcream" },
    { namaMenu: "Bubur Saring Daging Sapi Sup Wortel", karbohidrat: "Tepung Beras", laukHewani: "Daging Sapi Halus", laukNabati: "Tahu Saring", sayur: "Wortel Sup Saring", buahSusu: "Susu" },
    { namaMenu: "Puree Labu Kuning Ikan Kakap", karbohidrat: "Labu Kuning Kukus", laukHewani: "Ikan Kakap Saring", laukNabati: "Tempe Saring", sayur: "Bayam Kukus Halus", buahSusu: "Susu" }
  ],
  usiaSekolahAlergi: [
    { namaMenu: "Alergi: Nasi Kuning Ayam Penyet", karbohidrat: "Nasi Giling Kuning", laukHewani: "Daging Ayam Bakar/Penyet", laukNabati: "Tempe Bacem", sayur: "Sup Wortel", buahSusu: "Jus Pisang (Bebas Susu)" },
    { namaMenu: "Alergi: Nasi Putih Ayam Panggang (Ganti Ikan)", karbohidrat: "Nasi Putih", laukHewani: "Ayam Panggang Jahe", laukNabati: "Tahu Goreng Gurih", sayur: "Cah Kangkung Bawang", buahSusu: "Jeruk Manis" },
    { namaMenu: "Alergi: Bubur Sup Ayam Suwir", karbohidrat: "Bubur Beras Giling", laukHewani: "Ayam Suwir Panggang", laukNabati: "Kacang Tanah Sangrai", sayur: "Bening Bayam & Tomat", buahSusu: "Sari Buah Melon" },
    { namaMenu: "Alergi: Nasi Tim Daging Cincang (Ganti Telur)", karbohidrat: "Nasi Tim Lembek", laukHewani: "Daging Sapi Cincang Kukus", laukNabati: "Tempe Goreng Tepung", sayur: "Sup Wortel Kentang", buahSusu: "Pisang Ambon" },
    { namaMenu: "Alergi: Nasi Uduk Ayam Goreng", karbohidrat: "Nasi Uduk Gurih", laukHewani: "Ayam Goreng Lengkuas", laukNabati: "Tahu Bacem", sayur: "Tumis Labu Siam", buahSusu: "Jeruk Manis" },
    { namaMenu: "Alergi: Nasi Putih Daging Semur", karbohidrat: "Nasi Putih", laukHewani: "Semur Daging Sapi", laukNabati: "Tempe Mendoan", sayur: "Sup Kacang Polong Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Alergi: Nasi Kuning Ayam Balado (Ganti Telur)", karbohidrat: "Nasi Kuning", laukHewani: "Daging Ayam Cincang Balado", laukNabati: "Tahu Goreng Kuning", sayur: "Cah Sayur Hijau", buahSusu: "Jus Jeruk Segar" },
    { namaMenu: "Alergi: Nasi Putih Daging Goreng Tepung (Ganti Ikan)", karbohidrat: "Nasi Putih", laukHewani: "Daging Sapi Fillet Krispi", laukNabati: "Tempe Penyet", sayur: "Sup Tomat & Wortel", buahSusu: "Jalua Melon" },
    { namaMenu: "Alergi: Bubur Gurih Ayam Rebus (Ganti Udang)", karbohidrat: "Bubur Gurih Santan", laukHewani: "Ayam Cincang Rebus", laukNabati: "Tahu Bacem", sayur: "Cah Kangkung Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Alergi: Nasi Putih Ayam Semur", karbohidrat: "Nasi Putih", laukHewani: "Semur Daging Ayam", laukNabati: "Tempe Goreng Kuning", sayur: "Bening Bayam Jagung", buahSusu: "Jeruk Manis" },
    { namaMenu: "Alergi: Nasi Uduk Ayam Suwir (Ganti Telur)", karbohidrat: "Nasi Uduk", laukHewani: "Ayam Suwir Panggang", laukNabati: "Tahu Goreng", sayur: "Sup Wortel Kentang Kol", buahSusu: "Jus Melon" },
    { namaMenu: "Alergi: Nasi Putih Ayam Asam Manis (Ganti Ikan)", karbohidrat: "Nasi Putih", laukHewani: "Ayam Fillet Asam Manis", laukNabati: "Kacang Tanah Sangrai", sayur: "Tumis Kangkung Cabai", buahSusu: "Pisang Ambon" }
  ],
  tigaBAlergi: [
    { namaMenu: "Alergi: Nasi Kuning Ayam Kuah Jahe", karbohidrat: "Nasi Kuning", laukHewani: "Daging Ayam rebus jahe", laukNabati: "Tempe Rebus Gurih", sayur: "Sup Wortel Tomat", buahSusu: "Jus Pisang (Bebas Susu)" },
    { namaMenu: "Alergi: Nasi Putih Daging Kukus (Ganti Ikan)", karbohidrat: "Nasi Putih", laukHewani: "Daging Sapi Kukus Giling", laukNabati: "Tahu Kukus Daun Kelor", sayur: "Bening Kangkung", buahSusu: "Jeruk Manis" },
    { namaMenu: "Alergi: Bubur Lembut Ayam Sayur", karbohidrat: "Bubur Beras", laukHewani: "Ayam Suwir Halus", laukNabati: "Tahu Halus Kukus", sayur: "Sup Bayam Wortel", buahSusu: "Sari Kacang Hijau" },
    { namaMenu: "Alergi: Nasi Tim Daging Giling (Ganti Telur)", karbohidrat: "Nasi Tim", laukHewani: "Daging Sapi Giling Semur", laukNabati: "Tempe Halus Kukus", sayur: "Sup Labu Siam Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Alergi: Nasi Uduk Ayam Kukus", karbohidrat: "Nasi Uduk", laukHewani: "Ayam Kukus Bumbu Kuning", laukNabati: "Tahu Kukus", sayur: "Tumis Wortel Buncis", buahSusu: "Jeruk Manis" },
    { namaMenu: "Alergi: Nasi Daging Sapi Cincang", karbohidrat: "Nasi Putih", laukHewani: "Semur Daging Cincang", laukNabati: "Tempe Rebus", sayur: "Sup Brokoli Wortel", buahSusu: "Pisang Ambon" },
    { namaMenu: "Alergi: Nasi Kuning Ayam Suwir (Ganti Telur)", karbohidrat: "Nasi Kuning", laukHewani: "Ayam Suwir Bumbu Kuning", laukNabati: "Tahu Kukus", sayur: "Sup Bayam Bening", buahSusu: "Jus Jeruk" },
    { namaMenu: "Alergi: Nasi Daging Sapi Kukus Jahe (Ganti Ikan)", karbohidrat: "Nasi Putih", laukHewani: "Daging Sapi Giling Kukus Jahe", laukNabati: "Tempe Mendoan Oven", sayur: "Sup Tomat Kentang", buahSusu: "Sari Kelapa Muda" },
    { namaMenu: "Alergi: Bubur Ayam Halus Kentang (Ganti Udang)", karbohidrat: "Bubur Kentang Beras", laukHewani: "Ayam Cincang Kukus", laukNabati: "Tahu Tim", sayur: "Sayur Sop Kangkung Bayam", buahSusu: "Pisang Ambon" },
    { namaMenu: "Alergi: Nasi Ayam Cincang Tomat", karbohidrat: "Nasi Putih", laukHewani: "Cincang Ayam Masak Tomat", laukNabati: "Tempe Kukus", sayur: "Bening Bayam Wortel", buahSusu: "Jeruk Manis" },
    { namaMenu: "Alergi: Nasi Uduk Ayam Cincang (Ganti Telur)", karbohidrat: "Nasi Uduk", laukHewani: "Cincang Ayam Masak Jahe", laukNabati: "Tahu Goreng Tipis", sayur: "Sup Wortel Kentang", buahSusu: "Jus Melon" },
    { namaMenu: "Alergi: Nasi Ayam Masak Woku (Ganti Ikan)", karbohidrat: "Nasi Putih", laukHewani: "Daging Ayam Kukus Woku", laukNabati: "Kacang Merah Rebus", sayur: "Sayur Kangkung Bening", buahSusu: "Pisang Ambon" }
  ],
  mpAsiAlergi: [
    { namaMenu: "Alergi: Bubur Saring Beras Ayam Saring", karbohidrat: "Tepung Beras", laukHewani: "Ayam Cincang Saring", laukNabati: "Tahu Saring", sayur: "Wortel Halus", buahSusu: "Susu Ibu (Bebas Formula Sapi)" },
    { namaMenu: "Alergi: Puree Kentang Daging Kukus (Ganti Ikan)", karbohidrat: "Kentang Halus", laukHewani: "Daging Sapi Giling Saring", laukNabati: "Tempe Kukus Saring", sayur: "Bayam Saring", buahSusu: "Air Kelapa Muda Saring" },
    { namaMenu: "Alergi: Bubur Beras Ayam Saring (Ganti Telur)", karbohidrat: "Tepung Beras", laukHewani: "Ayam Saring Halus", laukNabati: "Tahu Halus", sayur: "Labu Siam Saring", buahSusu: "ASI Saring" },
    { namaMenu: "Alergi: Puree Beras Merah Daging Sapi Saring", karbohidrat: "Tepung Beras Merah", laukHewani: "Daging Sapi Cincang Saring", laukNabati: "Tempe Saring", sayur: "Wortel Halus", buahSusu: "Air Buah Melon" },
    { namaMenu: "Alergi: Bubur Saring Ayam Jagung Manis", karbohidrat: "Bubur Beras", laukHewani: "Daging Ayam Cincang", laukNabati: "Tahu Halus", sayur: "Bayam Halus", buahSusu: "ASI" },
    { namaMenu: "Alergi: Puree Labu Kuning Daging Ayam", karbohidrat: "Labu Kuning Halus", laukHewani: "Ayam Cincang Saring", laukNabati: "Kacang Hijau Saring", sayur: "Wortel Saring", buahSusu: "ASI" },
    { namaMenu: "Alergi: Bubur Saring Daging Cincang (Ganti Telur)", karbohidrat: "Tepung Beras", laukHewani: "Daging Sapi Saring", laukNabati: "Tahu Saring", sayur: "Tomat Saring", buahSusu: "ASI" },
    { namaMenu: "Alergi: Puree Kentang Daging Sapi Saring (Ganti Ikan)", karbohidrat: "Kentang Kukus Halus", laukHewani: "Daging Sapi Saring", laukNabati: "Tempe Kukus Saring", sayur: "Kangkung Saring", buahSusu: "Sari Jeruk" },
    { namaMenu: "Alergi: Bubur Saring Ayam Cincang (Ganti Udang)", karbohidrat: "Tepung Beras", laukHewani: "Ayam Fillet Saring", laukNabati: "Tahu Kukus Halus", sayur: "Labu Siam Halus", buahSusu: "ASI" },
    { namaMenu: "Alergi: Puree Pisang Sari Kacang Hijau (Ganti Telur/Susu)", karbohidrat: "Pisang Halus", laukHewani: "Ayam Saring", laukNabati: "Kacang Merah Halus", sayur: "Bayam Halus", buahSusu: "Sari Kacang Hijau" },
    { namaMenu: "Alergi: Bubur Saring Daging Sapi Sup Wortel", karbohidrat: "Tepung Beras", laukHewani: "Daging Sapi Halus", laukNabati: "Tahu Saring", sayur: "Wortel Sup Saring", buahSusu: "ASI" },
    { namaMenu: "Alergi: Puree Labu Kuning Daging Ayam (Ganti Ikan)", karbohidrat: "Labu Kuning Kukus", laukHewani: "Daging Ayam Saring", laukNabati: "Tempe Saring", sayur: "Bayam Kukus Halus", buahSusu: "ASI" }
  ]
};

// We will prefill food cost models for Day 1 and Day 2 to make calculations lively from turn 1!
export const INITIAL_FOOD_COST_DAYS: FoodCostDay[] = [
  {
    jenisMenu: "Basah",
    hariKe: 1,
    porsiBesarBahan: [
      { id: "pb_1_1", tkpiId: "beras_giling", beratBB: 80, urt: "1 piring", hargaSatuan: 14000 },
      { id: "pb_1_2", tkpiId: "daging_ayam_tanpa_kulit", beratBB: 65, urt: "1 potong md", hargaSatuan: 40000 },
      { id: "pb_1_3", tkpiId: "tempe_kedelai", beratBB: 30, urt: "1 potong", hargaSatuan: 15000 },
      { id: "pb_1_4", tkpiId: "wortel_segar", beratBB: 40, urt: "1/2 gelas", hargaSatuan: 18000 },
      { id: "pb_1_5", tkpiId: "susu_bubuk_fullcream", beratBB: 25, urt: "1 gelas", hargaSatuan: 95000 },
      { id: "pb_1_6", tkpiId: "pisang_ambon", beratBB: 100, urt: "1 buah", hargaSatuan: 12000 }
    ],
    porsiKecilBahan: [
      { id: "pk_1_1", tkpiId: "beras_giling", beratBB: 50, urt: "1/2 piring", hargaSatuan: 14000 },
      { id: "pk_1_2", tkpiId: "daging_ayam_tanpa_kulit", beratBB: 40, urt: "1 potong kcl", hargaSatuan: 40000 },
      { id: "pk_1_3", tkpiId: "tempe_kedelai", beratBB: 20, urt: "1/2 potong", hargaSatuan: 15000 },
      { id: "pk_1_4", tkpiId: "wortel_segar", beratBB: 25, urt: "1/3 gelas", hargaSatuan: 18000 },
      { id: "pk_1_5", tkpiId: "susu_bubuk_fullcream", beratBB: 15, urt: "1 gelas kcl", hargaSatuan: 95000 },
      { id: "pk_1_6", tkpiId: "pisang_ambon", beratBB: 80, urt: "1 buah kcl", hargaSatuan: 12000 }
    ],
    bufferPct: 5
  },
  {
    jenisMenu: "Basah",
    hariKe: 2,
    porsiBesarBahan: [
      { id: "pb_2_1", tkpiId: "beras_giling", beratBB: 80, urt: "1 piring", hargaSatuan: 14000 },
      { id: "pb_2_2", tkpiId: "ikan_kembung_segar", beratBB: 70, urt: "1 ekor sedang", hargaSatuan: 35000 },
      { id: "pb_2_3", tkpiId: "tahu_mentah", beratBB: 40, urt: "1 potong", hargaSatuan: 10000 },
      { id: "pb_2_4", tkpiId: "kangkung_segar", beratBB: 50, urt: "1/2 gelas", hargaSatuan: 12000 },
      { id: "pb_2_5", tkpiId: "jeruk_manis", beratBB: 100, urt: "1 buah", hargaSatuan: 20000 }
    ],
    porsiKecilBahan: [
      { id: "pk_2_1", tkpiId: "beras_giling", beratBB: 50, urt: "1/2 piring", hargaSatuan: 14000 },
      { id: "pk_2_2", tkpiId: "ikan_kembung_segar", beratBB: 45, urt: "1 ekor kecil", hargaSatuan: 35000 },
      { id: "pk_2_3", tkpiId: "tahu_mentah", beratBB: 25, urt: "1/2 potong", hargaSatuan: 10000 },
      { id: "pk_2_4", tkpiId: "kangkung_segar", beratBB: 30, urt: "1/3 gelas", hargaSatuan: 12000 },
      { id: "pk_2_5", tkpiId: "jeruk_manis", beratBB: 80, urt: "1 buah kecil", hargaSatuan: 20000 }
    ],
    bufferPct: 5
  }
];

// Let's populate empty arrays for days 3 to 12 as scaffolding so the user can easily select them
for (let d = 3; d <= 12; d++) {
  INITIAL_FOOD_COST_DAYS.push({
    jenisMenu: "Basah",
    hariKe: d,
    porsiBesarBahan: [
      { id: `pb_${d}_1`, tkpiId: "beras_giling", beratBB: 80, urt: "1 piring", hargaSatuan: 14000 },
      { id: `pb_${d}_2`, tkpiId: "telur_ayam_ras", beratBB: 60, urt: "1 butir", hargaSatuan: 28000 },
      { id: `pb_${d}_3`, tkpiId: "tempe_kedelai", beratBB: 30, urt: "1 potong", hargaSatuan: 15000 },
      { id: `pb_${d}_4`, tkpiId: "bayam_segar", beratBB: 50, urt: "1/2 gelas", hargaSatuan: 15000 }
    ],
    porsiKecilBahan: [
      { id: `pk_${d}_1`, tkpiId: "beras_giling", beratBB: 50, urt: "1/2 piring", hargaSatuan: 14000 },
      { id: `pk_${d}_2`, tkpiId: "telur_ayam_ras", beratBB: 50, urt: "1 butir kcl", hargaSatuan: 28000 },
      { id: `pk_${d}_3`, tkpiId: "tempe_kedelai", beratBB: 20, urt: "1/2 potong", hargaSatuan: 15000 },
      { id: `pk_${d}_4`, tkpiId: "bayam_segar", beratBB: 30, urt: "1/3 gelas", hargaSatuan: 15000 }
    ],
    bufferPct: 5
  });
}

export const DEFAULT_SASARAN_LIST: KelompokSasaranPM[] = [
  { id: "tk_paud_lb", label: "Siswa TK/PAUD/LB", porsiKecil: 191, porsiBesar: 0, alergiKecil: 5, alergiBesar: 0 },
  { id: "sd_kelas_1_3", label: "Siswa SD/MI/SLB Kelas 1-3", porsiKecil: 350, porsiBesar: 0, alergiKecil: 12, alergiBesar: 0 },
  { id: "sd_kelas_4_6", label: "Siswa SD/MI/SLB Kelas 4-6", porsiKecil: 0, porsiBesar: 420, alergiKecil: 0, alergiBesar: 15 },
  { id: "smp_mts_smplb", label: "Siswa SMP/MTS/SMPLB", porsiKecil: 0, porsiBesar: 310, alergiKecil: 0, alergiBesar: 10 },
  { id: "sma_smk_ma", label: "Siswa SMA/SMK/MK/MASMALB", porsiKecil: 0, porsiBesar: 280, alergiKecil: 0, alergiBesar: 8 },
  { id: "pendidik", label: "Pendidik", porsiKecil: 0, porsiBesar: 25, alergiKecil: 0, alergiBesar: 1 },
  { id: "tenaga_kependidikan", label: "Tenaga Pendidikan", porsiKecil: 0, porsiBesar: 15, alergiKecil: 0, alergiBesar: 0 },
  { id: "anak_balita", label: "Anak Balita", porsiKecil: 75, porsiBesar: 0, alergiKecil: 2, alergiBesar: 0 },
  { id: "anak_balita_13_59", label: "Anak Balita Usia 13-59 Bulan", porsiKecil: 90, porsiBesar: 0, alergiKecil: 3, alergiBesar: 0 },
  { id: "balita_6_11", label: "Balita 6-11 Bulan", porsiKecil: 35, porsiBesar: 0, alergiKecil: 1, alergiBesar: 0 },
  { id: "ibu_hamil", label: "Ibu Hamil", porsiKecil: 0, porsiBesar: 42, alergiKecil: 0, alergiBesar: 1 },
  { id: "ibu_menyusui", label: "Ibu Menyusui", porsiKecil: 0, porsiBesar: 38, alergiKecil: 0, alergiBesar: 1 }
];

export const INITIAL_HARIAN_PM: HariPM[] = Array.from({ length: 12 }, (_, i) => ({
  hariKe: i + 1,
  sasaran: DEFAULT_SASARAN_LIST.map(item => ({ ...item }))
}));

export const EMPTY_SPPG_PROFILE: SPPGProfile = {
  namaLembaga: "",
  alamat: "",
  namaKepala: "",
  namaAhliGizi: "",
  namaYayasan: "",
  ketuaYayasan: "",
  namaAkuntan: "",
  tahunAnggaran: "",
  periodeDates: Array.from({ length: 12 }, () => ""),
  awalPeriodeBerikutnya: ""
};

export const EMPTY_SEKOLAH_PM: SekolahPM[] = [];
export const EMPTY_TIGAB_PM: TigaBPM[] = [];

export const EMPTY_SASARAN_LIST: KelompokSasaranPM[] = DEFAULT_SASARAN_LIST.map(item => ({
  ...item,
  porsiKecil: 0,
  porsiBesar: 0,
  alergiKecil: 0,
  alergiBesar: 0
}));

export const EMPTY_HARIAN_PM: HariPM[] = Array.from({ length: 12 }, (_, i) => ({
  hariKe: i + 1,
  sasaran: EMPTY_SASARAN_LIST.map(item => ({ ...item }))
}));

export const EMPTY_MASTER_MENU: MasterMenu = {
  usiaSekolah: Array.from({ length: 12 }, () => ({ namaMenu: "", karbohidrat: "", laukHewani: "", laukNabati: "", sayur: "", buahSusu: "" })),
  tigaB: Array.from({ length: 12 }, () => ({ namaMenu: "", karbohidrat: "", laukHewani: "", laukNabati: "", sayur: "", buahSusu: "" })),
  mpAsi: Array.from({ length: 12 }, () => ({ namaMenu: "", karbohidrat: "", laukHewani: "", laukNabati: "", sayur: "", buahSusu: "" })),
  usiaSekolahAlergi: Array.from({ length: 12 }, () => ({ namaMenu: "", karbohidrat: "", laukHewani: "", laukNabati: "", sayur: "", buahSusu: "" })),
  tigaBAlergi: Array.from({ length: 12 }, () => ({ namaMenu: "", karbohidrat: "", laukHewani: "", laukNabati: "", sayur: "", buahSusu: "" })),
  mpAsiAlergi: Array.from({ length: 12 }, () => ({ namaMenu: "", karbohidrat: "", laukHewani: "", laukNabati: "", sayur: "", buahSusu: "" }))
};

export const EMPTY_FOOD_COST_DAYS: FoodCostDay[] = Array.from({ length: 12 }, (_, i) => ({
  jenisMenu: "Basah",
  hariKe: i + 1,
  porsiBesarBahan: [],
  porsiKecilBahan: [],
  bufferPct: 5
}));

