/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FoodCostDay, TKPIItem, MasterMenu, HariPM } from "../types";
import { calculateDay, formatRupiah, getCountsForDay } from "../utils/calc";
import { TARGET_AKG_LIMITS } from "../tkpiData";
import { PieChart, ListOrdered, PiggyBank, CalendarRange, TrendingDown, TrendingUp, AlertTriangle, Printer, Download, Image as ImageIcon } from "lucide-react";
import { downloadElementAsImage } from "../lib/printUtils";

interface DashboardOutputsProps {
  foodCostDays: FoodCostDay[];
  tkpiList: TKPIItem[];
  masterMenu: MasterMenu;
  harianPM: HariPM[];
  kopLine1: string;
  setKopLine1: (val: string) => void;
  kopLine2: string;
  setKopLine2: (val: string) => void;
  kopLine3: string;
  setKopLine3: (val: string) => void;
  kopLine4: string;
  setKopLine4: (val: string) => void;
  leftLogo: string;
  setLeftLogo: (val: string) => void;
  rightLogo: string;
  setRightLogo: (val: string) => void;
}

export default function DashboardOutputs({
  foodCostDays,
  tkpiList,
  masterMenu,
  harianPM,
  kopLine1,
  setKopLine1,
  kopLine2,
  setKopLine2,
  kopLine3,
  setKopLine3,
  kopLine4,
  setKopLine4,
  leftLogo,
  setLeftLogo,
  rightLogo,
  setRightLogo
}: DashboardOutputsProps) {
  const [activeOutputTab, setActiveOutputTab] = useState<"rekap" | "nota">("rekap");
  const [targetBudgetPorsiBesar, setTargetBudgetPorsiBesar] = useState<number>(10000); // Default IDR 10,000 for Porsi Besar
  const [targetBudgetPorsiKecil, setTargetBudgetPorsiKecil] = useState<number>(8000);  // Default IDR 8,000 for Porsi Kecil
  const [saldoAwalUsiaSekolah, setSaldoAwalUsiaSekolah] = useState<number>(50000000); // 50 juta
  const [saldoAwal3B, setSaldoAwal3B] = useState<number>(15000000); // 15 juta
  const [selectedNotaDay, setSelectedNotaDay] = useState<number>(1);
  const [selectedDashboardDay, setSelectedDashboardDay] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"edit" | "print">("edit");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [printDocType, setPrintDocType] = useState<"rekap" | "nota">("rekap");

  // Selected dashboard day counts
  const currentDayCounts = getCountsForDay(harianPM, selectedDashboardDay);
  
  const pmKecilSekolah = currentDayCounts.pmKecilSekolah;
  const pmBesarSekolah = currentDayCounts.pmBesarSekolah;
  const totalSekolahSiswa = pmKecilSekolah + pmBesarSekolah;
  
  const totalBalita = currentDayCounts.totalBalita;
  const totalBumil = currentDayCounts.totalBumil;
  const totalBusui = currentDayCounts.totalBusui;
  const total3BPM = totalBalita + totalBumil + totalBusui;

  const totalSekolahAlergi = currentDayCounts.totalSekolahAlergi;
  const total3BAlergi = currentDayCounts.total3BAlergi;
  const totalAlergiCombined = totalSekolahAlergi + total3BAlergi;

  const totalMPAsi = currentDayCounts.totalMPAsi;
  const grandTotalPMAll = totalSekolahSiswa + total3BPM;

  const pmKecil3B = totalBalita;
  const pmBesar3B = totalBumil + totalBusui;

  // 1. Precalculate all 12 days to render Rekap with day-specific recipient counts
  const calculatedDays = Array.from({ length: 12 }).map((_, idx) => {
    const dayNum = idx + 1;
    const dayCounts = getCountsForDay(harianPM, dayNum);
    
    // School Group (Basah/Standard)
    const schoolDayData = foodCostDays.find((d) => d.hariKe === dayNum && d.jenisMenu === "Basah") || {
      hariKe: dayNum,
      jenisMenu: "Basah" as const,
      porsiBesarBahan: [],
      porsiKecilBahan: [],
      bufferPct: 5
    };
    
    const schoolResult = calculateDay(
      schoolDayData.porsiBesarBahan,
      schoolDayData.porsiKecilBahan,
      dayCounts.pmBesarSekolah,
      dayCounts.pmKecilSekolah,
      schoolDayData.bufferPct,
      tkpiList
    );

    // 3B Group (MP-ASI)
    const threeBDayData = foodCostDays.find((d) => d.hariKe === dayNum && d.jenisMenu === "MP-ASI") || {
      hariKe: dayNum,
      jenisMenu: "MP-ASI" as const,
      porsiBesarBahan: [],
      porsiKecilBahan: [],
      bufferPct: 5
    };

    const threeBResult = calculateDay(
      threeBDayData.porsiBesarBahan,
      threeBDayData.porsiKecilBahan,
      dayCounts.pmBesar3B,
      dayCounts.pmKecil3B,
      threeBDayData.bufferPct,
      tkpiList
    );

    return {
      dayNum,
      schoolResult,
      threeBResult,
      menuName: masterMenu.usiaSekolah[idx]?.namaMenu || "Menu Hari " + dayNum
    };
  });

  // Overall calculations for entire period (sum of all 12 days)
  const totalBelanjaSekolah = calculatedDays.reduce((acc, d) => acc + d.schoolResult.subtotalBesarCost + d.schoolResult.subtotalKecilCost, 0);
  const totalBelanja3B = calculatedDays.reduce((acc, d) => acc + d.threeBResult.subtotalBesarCost + d.threeBResult.subtotalKecilCost, 0);
  const grandTotalBelanja = totalBelanjaSekolah + totalBelanja3B;

  // Rujukan AKG Standards (Average for color coding)
  // Standard SD Besar is 585-683 kkal -> midpoint ~634 kkal
  const akgEnergyRef = 634;
  const akgProteinRef = 18.5; // g
  const akgLemakRef = 20; // g
  const akgKhRef = 95; // g
  const akgSeratRef = 8; // g

  // Helper for AKG indicator color-coding
  const getAKGColorBadge = (actual: number, ref: number) => {
    const pct = (actual / ref) * 100;
    if (pct >= 90 && pct <= 110) {
      return { text: "bg-emerald-50 text-emerald-800 border-emerald-200/80", icon: "✅", label: "Sesuai", pct };
    } else if (pct < 90) {
      return { text: "bg-amber-50 text-amber-800 border-amber-200/80", icon: "⚠️", label: "Kurang", pct };
    } else {
      return { text: "bg-rose-50 text-rose-800 border-rose-200/80", icon: "❌", label: "Lebih", pct };
    }
  };

  // Helper for budget comparison
  const getBudgetBadge = (cost: number, target: number) => {
    if (cost === 0) return { text: "text-slate-400 bg-slate-50", label: "N/A" };
    if (cost <= target) {
      return { text: "text-emerald-700 bg-emerald-50 font-bold", label: "UNDER BUDGET" };
    } else {
      return { text: "text-rose-700 bg-rose-50 font-bold", label: "OVER BUDGET" };
    }
  };

  // Aggregate ingredients for Nota Pesanan of specific selected day
  const getNotaIngredients = (dayNum: number, group: "sekolah" | "3b") => {
    const dayData = foodCostDays.find((d) => d.hariKe === dayNum && d.jenisMenu === (group === "sekolah" ? "Basah" : "MP-ASI"));
    if (!dayData) return [];

    const dayCounts = getCountsForDay(harianPM, dayNum);

    // Calculate details
    const result = calculateDay(
      dayData.porsiBesarBahan,
      dayData.porsiKecilBahan,
      group === "sekolah" ? dayCounts.pmBesarSekolah : dayCounts.pmBesar3B,
      group === "sekolah" ? dayCounts.pmKecilSekolah : dayCounts.pmKecil3B,
      dayData.bufferPct,
      tkpiList
    );

    // Group items by tkpiId to avoid multiple entries of the same food
    const aggregated: Record<string, {
      nama: string;
      totalKg: number;
      sumber: string;
      hargaSatuan: number;
    }> = {};

    // Standard items
    result.porsiBesarItems.forEach((b) => {
      if (!aggregated[b.id]) {
        aggregated[b.id] = { nama: b.nama, totalKg: b.totalKebutuhanKg, sumber: b.sumber, hargaSatuan: b.hargaSatuan };
      } else {
        aggregated[b.id].totalKg += b.totalKebutuhanKg;
      }
    });

    result.porsiKecilItems.forEach((k) => {
      if (!aggregated[k.id]) {
        aggregated[k.id] = { nama: k.nama, totalKg: k.totalKebutuhanKg, sumber: k.sumber, hargaSatuan: k.hargaSatuan };
      } else {
        aggregated[k.id].totalKg += k.totalKebutuhanKg;
      }
    });

    return Object.values(aggregated);
  };

  const currentNotaSekolah = getNotaIngredients(selectedNotaDay, "sekolah");
  const currentNota3B = getNotaIngredients(selectedNotaDay, "3b");

  return (
    <div id="outputs-view-container" className="space-y-6">
      {/* Tab Switcher: Edit vs Cetak */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          type="button"
          onClick={() => setViewMode("edit")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${viewMode === "edit" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          📝 Kustomisasi & Dashboard Interaktif
        </button>
        <button
          type="button"
          onClick={() => setViewMode("print")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${viewMode === "print" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          🖨️ Pratinjau & Cetak Dokumen (A4)
        </button>
      </div>

      {viewMode === "edit" && (
        <div className="space-y-6">
          {/* Dashboard PM & Day Selector Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="text-[#4F46E5] shrink-0 mt-0.5">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                Monitoring Penerima Manfaat (PM) Siklus 12 Hari
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilih hari siklus (Hari 1 s/d Hari 12) untuk melihat rincian alokasi porsi dan menu gizi sasaran harian.
              </p>
            </div>
          </div>
          
          {/* Day Cycle Navigation Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 xl:pb-0 scrollbar-none max-w-full">
            {Array.from({ length: 12 }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = selectedDashboardDay === day;
              return (
                <button
                  key={day}
                  id={`btn-dash-day-${day}`}
                  type="button"
                  onClick={() => {
                    setSelectedDashboardDay(day);
                    setSelectedNotaDay(day); // Sync both day views for user convenience!
                  }}
                  className={`w-11 h-11 rounded-lg text-center flex flex-col justify-center items-center transition shrink-0 ${
                    isSelected
                      ? "bg-[#4F46E5] text-white shadow-xs"
                      : "bg-[#F8FAFC] hover:bg-slate-100 text-slate-600 border border-slate-100/60"
                  }`}
                >
                  <span className={`text-[9px] block leading-none ${isSelected ? "text-white/80" : "text-slate-400 font-medium"}`}>Hari</span>
                  <span className="text-sm font-bold block leading-none mt-1">{day}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5 PM Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: PM ANAK SEKOLAH */}
          <div className="bg-[#EEF2FF]/40 hover:bg-[#EEF2FF]/60 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
            <div>
              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">PM Anak Sekolah</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-indigo-900 tracking-tight">{totalSekolahSiswa}</span>
                <span className="text-xs text-indigo-600 font-bold ml-1">Siswa</span>
              </div>
            </div>
            <div className="text-xs text-indigo-500/90 font-semibold flex justify-between mt-4">
              <span>Kecil: {pmKecilSekolah}</span>
              <span>Besar: {pmBesarSekolah}</span>
            </div>
          </div>

          {/* Card 2: PM 3B */}
          <div className="bg-[#FFF1F2]/40 hover:bg-[#FFF1F2]/60 border border-rose-100 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
            <div>
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">PM 3B</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-rose-900 tracking-tight">{total3BPM}</span>
                <span className="text-xs text-rose-600 font-bold ml-1">Orang</span>
              </div>
            </div>
            <div className="text-xs text-rose-500/90 font-semibold flex justify-between mt-4">
              <span>Balita: {totalBalita}</span>
              <span>Bumil: {pmBesar3B}</span>
            </div>
          </div>

          {/* Card 3: PM ALERGI */}
          <div className="bg-[#FEF3C7]/40 hover:bg-[#FEF3C7]/60 border border-amber-100 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
            <div>
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">PM Alergi</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-amber-900 tracking-tight">{totalAlergiCombined}</span>
                <span className="text-xs text-amber-600 font-bold ml-1">Orang</span>
              </div>
            </div>
            <div className="text-xs text-amber-600/90 font-semibold flex justify-between mt-4">
              <span>Sekolah: {totalSekolahAlergi}</span>
              <span>3B: {total3BAlergi}</span>
            </div>
          </div>

          {/* Card 4: PM MP-ASI */}
          <div className="bg-[#ECFEFF]/40 hover:bg-[#ECFEFF]/60 border border-cyan-100 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
            <div>
              <span className="text-[10px] font-black text-cyan-800 uppercase tracking-wider block">PM MP ASI (MP-ASI)</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-cyan-900 tracking-tight">{totalMPAsi}</span>
                <span className="text-xs text-cyan-600 font-bold ml-1">Bayi</span>
              </div>
            </div>
            <div className="text-xs text-cyan-600/90 font-semibold mt-4">
              Kelompok MP-ASI Desa 3B
            </div>
          </div>

          {/* Card 5: TOTAL PM KESELURUHAN */}
          <div className="bg-[#ECFDF5]/40 hover:bg-[#ECFDF5]/60 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
            <div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Total PM Keseluruhan</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-emerald-900 tracking-tight">{grandTotalPMAll}</span>
                <span className="text-xs text-emerald-600 font-bold ml-1">Jiwa</span>
              </div>
            </div>
            <div className="text-xs text-emerald-600/90 font-semibold mt-4">
              Akumulasi seluruh sasaran
            </div>
          </div>
        </div>

        {/* Selected Day Status Bar */}
        <div className="bg-slate-50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">Hari Ke-{selectedDashboardDay}</span>
            <span className="text-slate-600 font-medium">
              Menu Aktif:{" "}
              <strong className="text-slate-900">
                {masterMenu.usiaSekolah[selectedDashboardDay - 1]?.namaMenu || "Menu Sehat Standar"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Estimasi Porsi Sekolah: <strong className="text-slate-700 font-mono">{totalSekolahSiswa} porsi</strong></span>
            <span>Estimasi Porsi 3B: <strong className="text-slate-700 font-mono">{total3BPM} porsi</strong></span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          id="btn-output-rekap"
          type="button"
          onClick={() => setActiveOutputTab("rekap")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeOutputTab === "rekap"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PieChart className="w-4 h-4" />
          Output 1 — Rekap Nilai Gizi & Food Cost Harian
        </button>
        <button
          id="btn-output-nota"
          type="button"
          onClick={() => setActiveOutputTab("nota")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeOutputTab === "nota"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          Output 2 — Nota Pesanan & Subsidi Silang
        </button>
      </div>

      {activeOutputTab === "rekap" ? (
        <div className="space-y-6">
          {/* Budget Setting Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <PiggyBank className="w-4.5 h-4.5 text-emerald-600" />
                Alokasi Anggaran Target Per Porsi
              </h4>
              <p className="text-xs text-slate-500">
                Tentukan target plafon anggaran makan bergizi per per porsi untuk memicu analisis real-time LOW/OVER budget di tabel bawah.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:shrink-0 w-full xl:w-auto">
              {/* PORSI BESAR */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  PORSI BESAR (SD 1-4, SMP, BUMIL/BUSUI) Target Plafon:
                </span>
                <div className="flex items-center">
                  <span className="bg-amber-50 border border-amber-200 border-r-0 rounded-l-lg text-xs font-bold text-amber-700 px-3 py-2">Rp</span>
                  <input
                    id="input-budget-porsi-besar"
                    type="number"
                    value={targetBudgetPorsiBesar}
                    onChange={(e) => setTargetBudgetPorsiBesar(Number(e.target.value))}
                    className="px-3 py-1.5 border border-slate-200 rounded-r-lg text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono text-right w-full sm:w-32"
                  />
                </div>
              </div>

              {/* PORSI KECIL */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  PORSI KECIL (BALITA, TK/PAUD, SD 1-3) Target Plafon:
                </span>
                <div className="flex items-center">
                  <span className="bg-cyan-50 border border-cyan-200 border-r-0 rounded-l-lg text-xs font-bold text-cyan-700 px-3 py-2">Rp</span>
                  <input
                    id="input-budget-porsi-kecil"
                    type="number"
                    value={targetBudgetPorsiKecil}
                    onChange={(e) => setTargetBudgetPorsiKecil(Number(e.target.value))}
                    className="px-3 py-1.5 border border-slate-200 rounded-r-lg text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono text-right w-full sm:w-32"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table of 12 days rekap */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-indigo-600" />
                Siklus 12 Hari — Analisis Kandungan Gizi vs Cost
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Ringkasan gizi harian (AKG Rujukan SD 4-6) dan realisasi harga porsi</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 pl-4 w-12 text-center">Hari</th>
                    <th className="p-3 min-w-[150px]">Nama Menu</th>
                    <th className="p-3 text-right">Berat Bersih (g)</th>
                    <th className="p-3 text-right">Energi (kkal)</th>
                    <th className="p-3 text-right">Protein (g)</th>
                    <th className="p-3 text-right">Lemak (g)</th>
                    <th className="p-3 text-right">Karbohidrat (g)</th>
                    <th className="p-3 text-right">Serat (g)</th>
                    <th className="p-3 text-right">Porsi Kecil (Rp)</th>
                    <th className="p-3 text-right">Porsi Besar (Rp)</th>
                    <th className="p-3 text-right">RAB Harian (Rp)</th>
                    <th className="p-3 text-center min-w-[120px]">Status Anggaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {calculatedDays.map((d) => {
                    // Average nutrisi
                    const energi = d.schoolResult.nutrisiPorsiBesar.energi || 0;
                    const protein = d.schoolResult.nutrisiPorsiBesar.protein || 0;
                    const lemak = d.schoolResult.nutrisiPorsiBesar.lemak || 0;
                    const kh = d.schoolResult.nutrisiPorsiBesar.kh || 0;
                    const serat = d.schoolResult.nutrisiPorsiBesar.serat || 0;

                    const beratBersih = d.schoolResult.porsiBesarItems.reduce((acc, item) => acc + item.beratBB, 0);

                    const costKecil = d.schoolResult.costPerPorsiKecil;
                    const costBesar = d.schoolResult.costPerPorsiBesar;
                    const rabHarian = d.schoolResult.subtotalBesarCost + d.schoolResult.subtotalKecilCost;

                    const isBesarOver = costBesar > 0 && costBesar > targetBudgetPorsiBesar;
                    const isKecilOver = costKecil > 0 && costKecil > targetBudgetPorsiKecil;
                    const isAnyOver = isBesarOver || isKecilOver;
                    const isAnyValid = costBesar > 0 || costKecil > 0;

                    const budgetStatus = !isAnyValid
                      ? { text: "text-slate-400 bg-slate-50", label: "N/A" }
                      : isAnyOver
                        ? { text: "text-rose-700 bg-rose-50 font-bold", label: "OVER BUDGET" }
                        : { text: "text-emerald-700 bg-emerald-50 font-bold", label: "UNDER BUDGET" };

                    // Nutrients status
                    const nEnergy = getAKGColorBadge(energi, akgEnergyRef);
                    const nProtein = getAKGColorBadge(protein, akgProteinRef);
                    const nLemak = getAKGColorBadge(lemak, akgLemakRef);
                    const nKh = getAKGColorBadge(kh, akgKhRef);
                    const nSerat = getAKGColorBadge(serat, akgSeratRef);

                    return (
                      <tr key={d.dayNum} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 pl-4 text-center font-bold text-indigo-600 font-mono">H-{d.dayNum}</td>
                        <td className="p-3 font-medium text-slate-800">{d.menuName}</td>
                        
                        {/* Berat Bersih */}
                        <td className="p-3 text-right font-mono font-semibold text-indigo-700">
                          {beratBersih > 0 ? `${beratBersih.toFixed(1)}g` : "-"}
                        </td>

                        {/* Energi */}
                        <td className="p-3 text-right font-mono">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border font-semibold ${nEnergy.text}`}>
                            {energi.toFixed(0)} ({nEnergy.pct.toFixed(0)}%)
                          </span>
                        </td>

                        {/* Protein */}
                        <td className="p-3 text-right font-mono">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border font-semibold ${nProtein.text}`}>
                            {protein.toFixed(1)}g ({nProtein.pct.toFixed(0)}%)
                          </span>
                        </td>

                        {/* Lemak */}
                        <td className="p-3 text-right font-mono">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border font-semibold ${nLemak.text}`}>
                            {lemak.toFixed(1)}g ({nLemak.pct.toFixed(0)}%)
                          </span>
                        </td>

                        {/* KH */}
                        <td className="p-3 text-right font-mono">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border font-semibold ${nKh.text}`}>
                            {kh.toFixed(1)}g ({nKh.pct.toFixed(0)}%)
                          </span>
                        </td>

                        {/* Serat */}
                        <td className="p-3 text-right font-mono">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border font-semibold ${nSerat.text}`}>
                            {serat.toFixed(1)}g ({nSerat.pct.toFixed(0)}%)
                          </span>
                        </td>

                        {/* Porsi Kecil */}
                        <td className="p-3 text-right font-mono text-cyan-700 font-semibold bg-cyan-50/10">
                          {costKecil > 0 ? formatRupiah(costKecil) : "-"}
                        </td>

                        {/* Porsi Besar */}
                        <td className="p-3 text-right font-mono text-amber-700 font-semibold bg-amber-50/10">
                          {costBesar > 0 ? formatRupiah(costBesar) : "-"}
                        </td>

                        {/* RAB Harian */}
                        <td className="p-3 text-right font-mono text-indigo-900 font-extrabold bg-indigo-50/10">
                          {formatRupiah(rabHarian)}
                        </td>

                        {/* Status Budget */}
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1.5 rounded-lg text-[10px] border tracking-wider uppercase font-extrabold ${budgetStatus.text}`}>
                            {budgetStatus.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rekap footer */}
            <div className="p-4 bg-indigo-50/20 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs text-slate-500 font-medium">Legend Nutrisi (% AKG):</span>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded">KURANG (&lt;90%)</span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded">SESUAI (90–110%)</span>
                <span className="text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200/80 px-2 py-0.5 rounded">LEBIH (&gt;110%)</span>
              </div>
              
              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold block">Total Proyeksi Belanja 12 Hari:</span>
                <span className="text-xl font-black text-indigo-950 font-mono">{formatRupiah(grandTotalBelanja)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Consolidated Logistics PO Promo banner */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <h5 className="text-xs font-bold text-amber-900">Nota Pesanan Logistik Gabungan (Presisi 100% Siap Cetak/Download)</h5>
                <p className="text-[11px] text-amber-700">Untuk rekap belanja kotor gabungan antara Usia Sekolah dan 3B per hari dalam format cetak resmi, silakan gunakan menu utama <strong>Nota Pesanan Logistik</strong>.</p>
              </div>
            </div>
            <button
              id="btn-goto-nota-logistik"
              type="button"
              onClick={() => {
                const navBtn = document.getElementById("tab-nav-notalogistik");
                if (navBtn) navBtn.click();
              }}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-lg shadow-sm shadow-amber-600/10 transition shrink-0"
            >
              Buka Nota Gabungan →
            </button>
          </div>

          {/* Day selection for PO */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Pilih Hari Nota Pesanan</h4>
              <p className="text-xs text-slate-500">Tampilkan nota rincian kebutuhan pesanan logistik dan bumbu per hari terpilih.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">Hari Ke:</span>
              <select
                id="select-nota-day-idx"
                value={selectedNotaDay}
                onChange={(e) => setSelectedNotaDay(Number(e.target.value))}
                className="bg-slate-100 border border-slate-200 rounded-lg text-sm px-4 py-2 font-mono font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i + 1}>
                    Hari Ke-{i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TWO NOTAS - Usia Sekolah vs 3B */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NOTA USIA SEKOLAH */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Nota Pesanan</span>
                <h4 className="font-bold text-slate-800 text-sm">Kelompok Usia Sekolah (TK, SD, SMP, SMA)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Alokasi penerima manfaat: {pmBesarSekolah + pmKecilSekolah} siswa</p>
              </div>

              <div className="flex-grow overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5 pl-4 w-12 text-center">No</th>
                      <th className="p-2.5">Bahan Baku</th>
                      <th className="p-2.5 text-right w-24">Jumlah (Kg)</th>
                      <th className="p-2.5 text-right w-28">Harga (Rp/Kg)</th>
                      <th className="p-2.5 text-right w-28">Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentNotaSekolah.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                          Belum ada komponen pangan yang diinput hari ini.
                        </td>
                      </tr>
                    ) : (
                      currentNotaSekolah.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 pl-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-800">{item.nama}</td>
                          <td className="p-2.5 text-right font-mono">{item.totalKg.toFixed(3)} Kg</td>
                          <td className="p-2.5 text-right font-mono">{formatRupiah(item.hargaSatuan)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.totalKg * item.hargaSatuan)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Costing calculations & Cross-Subsidy for Schools */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Sub-total Bahan:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(currentNotaSekolah.reduce((acc, i) => acc + (i.totalKg * i.hargaSatuan), 0))}
                  </span>
                </div>
                
                {/* Cross subsidy calculator */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-indigo-600" />
                    Kalkulator Subsidi Silang Usia Sekolah
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Awal Alokasi</label>
                      <input
                        id="input-saldo-sekolah"
                        type="number"
                        value={saldoAwalUsiaSekolah}
                        onChange={(e) => setSaldoAwalUsiaSekolah(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-right font-mono font-bold mt-1 text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sisa Saldo (Selisih)</span>
                      <div className={`p-1.5 rounded text-right font-mono font-black mt-1 ${saldoAwalUsiaSekolah - totalBelanjaSekolah >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                        {formatRupiah(saldoAwalUsiaSekolah - totalBelanjaSekolah)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTA 3B */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Nota Pesanan</span>
                <h4 className="font-bold text-slate-800 text-sm">Kelompok 3B (Bumil, Balita, Busui)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Alokasi penerima manfaat: {pmBesar3B + pmKecil3B} orang</p>
              </div>

              <div className="flex-grow overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5 pl-4 w-12 text-center">No</th>
                      <th className="p-2.5">Bahan Baku</th>
                      <th className="p-2.5 text-right w-24">Jumlah (Kg)</th>
                      <th className="p-2.5 text-right w-28">Harga (Rp/Kg)</th>
                      <th className="p-2.5 text-right w-28">Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentNota3B.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                          Belum ada komponen pangan yang diinput hari ini.
                        </td>
                      </tr>
                    ) : (
                      currentNota3B.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 pl-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-800">{item.nama}</td>
                          <td className="p-2.5 text-right font-mono">{item.totalKg.toFixed(3)} Kg</td>
                          <td className="p-2.5 text-right font-mono">{formatRupiah(item.hargaSatuan)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.totalKg * item.hargaSatuan)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Costing calculations & Cross-Subsidy for 3B */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Sub-total Bahan:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(currentNota3B.reduce((acc, i) => acc + (i.totalKg * i.hargaSatuan), 0))}
                  </span>
                </div>
                
                {/* Cross subsidy calculator */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-rose-950 flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-rose-600" />
                    Kalkulator Subsidi Silang Kelompok 3B
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Awal Alokasi</label>
                      <input
                        id="input-saldo-3b"
                        type="number"
                        value={saldoAwal3B}
                        onChange={(e) => setSaldoAwal3B(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-right font-mono font-bold mt-1 text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sisa Saldo (Selisih)</span>
                      <div className={`p-1.5 rounded text-right font-mono font-black mt-1 ${saldoAwal3B - totalBelanja3B >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                        {formatRupiah(saldoAwal3B - totalBelanja3B)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* --- PRATINJAU CETAK KOP & EKSPOR --- */}
      {viewMode === "print" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-slate-100 gap-3">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Sesuaikan KOP Surat &amp; Cetak / Ekspor</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500">Pilih Dokumen:</span>
                  <select
                    value={printDocType}
                    onChange={(e) => setPrintDocType(e.target.value as any)}
                    className="bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-indigo-600 focus:outline-none"
                  >
                    <option value="rekap">RAB 12 Hari &amp; Rekap Gizi</option>
                    <option value="nota">Nota Rincian Bahan (Hari Ke-{selectedNotaDay})</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  id="btn-do-download-img"
                  type="button"
                  disabled={!!isDownloading}
                  onClick={() => downloadElementAsImage("print-area-rab-harian", printDocType === "rekap" ? "RAB_12_Hari_Rekap_Gizi" : "Nota_Rincian_Bahan_Hari_" + selectedNotaDay, setIsDownloading)}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isDownloading === "Memproses gambar..." || isDownloading === "Mengunduh gambar..." ? isDownloading : "Unduh Gambar (PNG)"}
                </button>
                <button
                  id="btn-do-print"
                  type="button"
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF (A4 Portrait)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 1</label>
                <input
                  type="text"
                  value={kopLine1}
                  onChange={(e) => setKopLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 2</label>
                <input
                  type="text"
                  value={kopLine2}
                  onChange={(e) => setKopLine2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 3</label>
                <input
                  type="text"
                  value={kopLine3}
                  onChange={(e) => setKopLine3(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 4</label>
                <input
                  type="text"
                  value={kopLine4}
                  onChange={(e) => setKopLine4(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-300 shadow-inner flex justify-center no-print overflow-x-auto">
            <div 
              id="print-area-rab-harian" 
              className="bg-white p-8 border border-slate-400 shadow-md w-full max-w-[210mm] min-w-[210mm] font-sans text-slate-950 print:text-black print:border-none print:shadow-none print:p-0 print:m-0 space-y-8"
            >
              {/* Kop Surat Header */}
              <div className="relative flex items-center justify-between pb-3 border-b-2 border-black w-full" style={{ minHeight: '90px' }}>
                {/* Left Logo */}
                <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                  <img 
                    src={leftLogo} 
                    alt="Logo Kiri" 
                    className="w-16 h-16 object-contain" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/src/assets/images/logo_sppg_1782256222616.jpg";
                    }}
                  />
                </div>

                {/* Centered Kop Text */}
                <div className="text-center font-sans tracking-wide leading-snug px-4 flex-1">
                  <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none" style={{ fontSize: '14pt' }}>{kopLine1}</div>
                  <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine2}</div>
                  <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine3}</div>
                  <div className="italic text-slate-800 print:text-black font-sans mt-1.5" style={{ fontSize: '10pt' }}>{kopLine4}</div>
                </div>

                {/* Right Logo */}
                <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                  {rightLogo ? (
                    <img 
                      src={rightLogo} 
                      alt="Logo Kanan" 
                      className="w-16 h-16 object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase no-print">
                      Logo Kanan
                    </div>
                  )}
                </div>
              </div>

              {printDocType === "rekap" ? (
                <div className="space-y-6">
                  {/* Title */}
                  <div className="text-center space-y-1">
                    <h3 className="font-black text-black uppercase tracking-wide" style={{ fontSize: '13pt' }}>
                      LAPORAN REKAPITULASI RAB &amp; ANALISIS KECUKUPAN GIZI
                    </h3>
                    <p className="text-xs font-bold text-slate-700 uppercase">
                      MONITORING PROGRAM SPPG SIKLUS 12 HARI
                    </p>
                  </div>

                  {/* 12-day Table for print */}
                  <table className="w-full text-left text-[9px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700 uppercase border border-slate-300">
                        <th className="border border-slate-300 p-1.5 text-center">Hari</th>
                        <th className="border border-slate-300 p-1.5">Menu Utama</th>
                        <th className="border border-slate-300 p-1.5 text-right">Energi</th>
                        <th className="border border-slate-300 p-1.5 text-right">Protein</th>
                        <th className="border border-slate-300 p-1.5 text-right">Lemak</th>
                        <th className="border border-slate-300 p-1.5 text-right">KH</th>
                        <th className="border border-slate-300 p-1.5 text-right">Serat</th>
                        <th className="border border-slate-300 p-1.5 text-right">P.Kecil</th>
                        <th className="border border-slate-300 p-1.5 text-right">P.Besar</th>
                        <th className="border border-slate-300 p-1.5 text-right">RAB Harian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedDays.map(({ dayNum, schoolResult, menuName }) => {
                        return (
                          <tr key={dayNum} className="text-slate-800 font-medium">
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">H{dayNum}</td>
                            <td className="border border-slate-300 p-1.5 truncate max-w-[120px]">{menuName}</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">{(schoolResult.nutrisiPorsiBesar.energi || 0).toFixed(0)} kkal</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">{(schoolResult.nutrisiPorsiBesar.protein || 0).toFixed(1)}g</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">{(schoolResult.nutrisiPorsiBesar.lemak || 0).toFixed(1)}g</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">{(schoolResult.nutrisiPorsiBesar.kh || 0).toFixed(1)}g</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">{(schoolResult.nutrisiPorsiBesar.serat || 0).toFixed(1)}g</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">{formatRupiah(schoolResult.costPerPorsiKecil)}</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono">{formatRupiah(schoolResult.costPerPorsiBesar)}</td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">{formatRupiah(schoolResult.subtotalBesarCost + schoolResult.subtotalKecilCost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Summary row */}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-800">
                    <span className="text-xs font-bold uppercase text-slate-700">Total Proyeksi Belanja Kumulatif 12 Hari:</span>
                    <span className="text-sm font-black text-black font-mono">
                      {formatRupiah(calculatedDays.reduce((acc, d) => acc + (d.schoolResult.subtotalBesarCost + d.schoolResult.subtotalKecilCost) + (d.threeBResult.subtotalBesarCost + d.threeBResult.subtotalKecilCost), 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Title */}
                  <div className="text-center space-y-1">
                    <h3 className="font-black text-black uppercase tracking-wide" style={{ fontSize: '13pt' }}>
                      LAPORAN NOTA RINCIAN BAHAN MAKANAN &amp; ANGGARAN
                    </h3>
                    <p className="text-xs font-bold text-slate-700 uppercase">
                      HARI KE-{selectedNotaDay} | MENU: {(masterMenu.usiaSekolah[selectedNotaDay - 1]?.namaMenu || "Menu Sehat Standar").toUpperCase()}
                    </p>
                  </div>

                  {/* Two columns: Usia Sekolah vs 3B */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Usia Sekolah */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">Usia Sekolah (Siswa)</h4>
                      <table className="w-full text-left text-[9px] border-collapse border border-slate-300">
                        <thead className="bg-slate-50 font-bold">
                          <tr>
                            <th className="border border-slate-300 p-1">Bahan</th>
                            <th className="border border-slate-300 p-1 text-right">Netto</th>
                            <th className="border border-slate-300 p-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentNotaSekolah.map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-300 p-1 truncate max-w-[80px]">{item.nama}</td>
                              <td className="border border-slate-300 p-1 text-right font-mono">{item.totalKg.toFixed(3)} Kg</td>
                              <td className="border border-slate-300 p-1 text-right font-mono">{formatRupiah(item.totalKg * item.hargaSatuan)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-right text-[9px] font-bold pt-1">
                        Total Sekolah: {formatRupiah(currentNotaSekolah.reduce((acc, i) => acc + (i.totalKg * i.hargaSatuan), 0))}
                      </div>
                    </div>

                    {/* Kelompok 3B */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 border-b pb-1">Kelompok 3B (MP-ASI)</h4>
                      <table className="w-full text-left text-[9px] border-collapse border border-slate-300">
                        <thead className="bg-slate-50 font-bold">
                          <tr>
                            <th className="border border-slate-300 p-1">Bahan</th>
                            <th className="border border-slate-300 p-1 text-right">Netto</th>
                            <th className="border border-slate-300 p-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentNota3B.map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-300 p-1 truncate max-w-[80px]">{item.nama}</td>
                              <td className="border border-slate-300 p-1 text-right font-mono">{item.totalKg.toFixed(3)} Kg</td>
                              <td className="border border-slate-300 p-1 text-right font-mono">{formatRupiah(item.totalKg * item.hargaSatuan)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-right text-[9px] font-bold pt-1">
                        Total 3B: {formatRupiah(currentNota3B.reduce((acc, i) => acc + (i.totalKg * i.hargaSatuan), 0))}
                      </div>
                    </div>
                  </div>

                  {/* Subsidy report */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10px] space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>PAGU ALOKASI HARIAN USIA SEKOLAH:</span>
                      <span className="font-mono">{formatRupiah(saldoAwalUsiaSekolah)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>PAGU ALOKASI HARIAN KELOMPOK 3B:</span>
                      <span className="font-mono">{formatRupiah(saldoAwal3B)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 border-t pt-1 mt-1">
                      <span>TOTAL BELANJA HARIAN GABUNGAN:</span>
                      <span className="font-mono text-rose-800">
                        {formatRupiah(
                          currentNotaSekolah.reduce((acc, i) => acc + (i.totalKg * i.hargaSatuan), 0) +
                          currentNota3B.reduce((acc, i) => acc + (i.totalKg * i.hargaSatuan), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
