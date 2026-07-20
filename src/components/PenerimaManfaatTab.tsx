/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HariPM, KelompokSasaranPM } from "../types";
import { 
  Calendar, 
  Download, 
  Upload, 
  Copy, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  HeartHandshake, 
  Wallet, 
  DollarSign, 
  Settings, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import * as XLSX from "xlsx";

interface PenerimaManfaatTabProps {
  harianPM: HariPM[];
  onChange: (updated: HariPM[]) => void;
  pmSettings?: {
    porsiKecilHarga: number;
    porsiBesarHarga: number;
    porsiKecilSasaranIds: string[];
    porsiBesarSasaranIds: string[];
  };
  setPmSettings?: (updated: any) => void;
}

export default function PenerimaManfaatTab({
  harianPM,
  onChange,
  pmSettings,
  setPmSettings
}: PenerimaManfaatTabProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  // Accordion state for classification editing
  const [showKecilSasaranEditor, setShowKecilSasaranEditor] = useState(false);
  const [showBesarSasaranEditor, setShowBesarSasaranEditor] = useState(false);

  const activeDayData = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0];

  // Fallbacks for dynamic PM settings
  const defaultSettings = {
    porsiKecilHarga: 8000,
    porsiBesarHarga: 10000,
    porsiKecilSasaranIds: ["tk_paud_lb", "sd_kelas_1_3", "anak_balita", "anak_balita_13_59", "balita_6_11"],
    porsiBesarSasaranIds: ["sd_kelas_4_6", "smp_mts_smplb", "sma_smk_ma", "pendidik", "tenaga_kependidikan", "ibu_hamil", "ibu_menyusui"]
  };
  
  const settings = pmSettings || defaultSettings;

  const updateSetting = (key: string, value: any) => {
    if (setPmSettings) {
      setPmSettings({
        ...settings,
        [key]: value
      });
    }
  };

  const handleToggleKecilSasaran = (sasaranId: string) => {
    const alreadySelected = settings.porsiKecilSasaranIds.includes(sasaranId);
    const updatedIds = alreadySelected
      ? settings.porsiKecilSasaranIds.filter(id => id !== sasaranId)
      : [...settings.porsiKecilSasaranIds, sasaranId];
    updateSetting("porsiKecilSasaranIds", updatedIds);
  };

  const handleToggleBesarSasaran = (sasaranId: string) => {
    const alreadySelected = settings.porsiBesarSasaranIds.includes(sasaranId);
    const updatedIds = alreadySelected
      ? settings.porsiBesarSasaranIds.filter(id => id !== sasaranId)
      : [...settings.porsiBesarSasaranIds, sasaranId];
    updateSetting("porsiBesarSasaranIds", updatedIds);
  };

  // Helper for triggering alert banners
  const triggerAlert = (type: "success" | "info" | "error", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  // Calculations for current day PM counts
  const totalPorsiKecil = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.porsiKecil) || 0), 0);
  const totalPorsiBesar = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.porsiBesar) || 0), 0);
  const totalAlergiKecil = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.alergiKecil) || 0), 0);
  const totalAlergiBesar = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.alergiBesar) || 0), 0);
  const totalAlergi = totalAlergiKecil + totalAlergiBesar;
  const totalPM = totalPorsiKecil + totalPorsiBesar;

  // Dynamic RAB calculations based on user settings & current day inputs
  const rabPorsiKecil = activeDayData.sasaran.reduce((acc, curr) => {
    if (settings.porsiKecilSasaranIds.includes(curr.id)) {
      return acc + (Number(curr.porsiKecil) || 0) * settings.porsiKecilHarga;
    }
    return acc;
  }, 0);

  const rabPorsiBesar = activeDayData.sasaran.reduce((acc, curr) => {
    if (settings.porsiBesarSasaranIds.includes(curr.id)) {
      return acc + (Number(curr.porsiBesar) || 0) * settings.porsiBesarHarga;
    }
    return acc;
  }, 0);

  const totalRABHarian = rabPorsiKecil + rabPorsiBesar;

  // Format currency for IDR cleanly
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Row update handler
  const handleCellChange = (id: string, field: "porsiKecil" | "porsiBesar" | "alergiKecil" | "alergiBesar", value: number) => {
    const updatedHarian = harianPM.map(day => {
      if (day.hariKe === selectedDay) {
        const updatedSasaran = day.sasaran.map(s => {
          if (s.id === id) {
            return { ...s, [field]: value };
          }
          return s;
        });
        return { ...day, sasaran: updatedSasaran };
      }
      return day;
    });
    onChange(updatedHarian);
  };

  // Copy current day data to all other 11 days
  const handleCopyToAllDays = () => {
    if (confirm(`Apakah Anda yakin ingin menyalin jumlah Penerima Manfaat Hari Ke-${selectedDay} ke semua hari kerja lainnya (Hari 1 sampai 12)?`)) {
      const currentSasaranCopy = activeDayData.sasaran.map(s => ({ ...s }));
      const updatedHarian = harianPM.map(day => ({
        ...day,
        sasaran: currentSasaranCopy.map(s => ({ ...s }))
      }));
      onChange(updatedHarian);
      triggerAlert("success", `Sukses menyalin format & jumlah PM Hari Ke-${selectedDay} ke seluruh 12 Hari Kerja!`);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm("Apakah Anda yakin ingin mengatur ulang data Penerima Manfaat untuk Hari ini ke setelan standar?")) {
      const DEFAULT_SASARAN_LIST: KelompokSasaranPM[] = [
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

      const updatedHarian = harianPM.map(day => {
        if (day.hariKe === selectedDay) {
          return { ...day, sasaran: DEFAULT_SASARAN_LIST.map(item => ({ ...item })) };
        }
        return day;
      });
      onChange(updatedHarian);
      triggerAlert("info", `Format Penerima Manfaat Hari Ke-${selectedDay} telah diatur ulang ke default.`);
    }
  };

  // Export spreadsheet
  const handleExportExcel = () => {
    const dataToExport = activeDayData.sasaran.map((s, idx) => ({
      No: idx + 1,
      "Kelompok Sasaran": s.label,
      "Porsi Kecil": s.porsiKecil,
      "Porsi Besar": s.porsiBesar,
      "PM Alergi Porsi Kecil": s.alergiKecil,
      "PM Alergi Porsi Besar": s.alergiBesar,
      "Total PM (Kecil + Besar)": Number(s.porsiKecil) + Number(s.porsiBesar)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `PM Hari Ke-${selectedDay}`);
    XLSX.writeFile(wb, `Sispber_PM_Format_Hari_${selectedDay}.xlsx`);
    triggerAlert("success", "File Excel Penerima Manfaat berhasil diunduh.");
  };

  // Import spreadsheet
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        if (rawData && rawData.length > 0) {
          const updatedSasaran = activeDayData.sasaran.map(s => {
            const row = rawData.find((r: any) => 
              String(r["Kelompok Sasaran"] || "").toLowerCase().trim() === s.label.toLowerCase().trim()
            );
            if (row) {
              const importedAlergiKecil = row["PM Alergi Porsi Kecil"] !== undefined 
                ? row["PM Alergi Porsi Kecil"] 
                : (row["PM Alergi"] !== undefined ? row["PM Alergi"] : s.alergiKecil);
              const importedAlergiBesar = row["PM Alergi Porsi Besar"] !== undefined
                ? row["PM Alergi Porsi Besar"]
                : s.alergiBesar;

              return {
                ...s,
                porsiKecil: Number(row["Porsi Kecil"] !== undefined ? row["Porsi Kecil"] : s.porsiKecil) || 0,
                porsiBesar: Number(row["Porsi Besar"] !== undefined ? row["Porsi Besar"] : s.porsiBesar) || 0,
                alergiKecil: Number(importedAlergiKecil) || 0,
                alergiBesar: Number(importedAlergiBesar) || 0
              };
            }
            return s;
          });

          const updatedHarian = harianPM.map(day => {
            if (day.hariKe === selectedDay) {
              return { ...day, sasaran: updatedSasaran };
            }
            return day;
          });

          onChange(updatedHarian);
          triggerAlert("success", `Berhasil memperbarui data PM Hari Ke-${selectedDay} dari file Excel!`);
        }
      } catch (err) {
        triggerAlert("error", "Gagal memproses berkas Excel. Pastikan header kolom adalah 'Kelompok Sasaran', 'Porsi Kecil', 'Porsi Besar', 'PM Alergi Porsi Kecil', dan 'PM Alergi Porsi Besar'.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset file input
  };

  // Generate dynamic labels list for bottom panels
  const porsiKecilLabels = activeDayData.sasaran
    .filter(s => settings.porsiKecilSasaranIds.includes(s.id))
    .map(s => s.label)
    .join(", ");

  const porsiBesarLabels = activeDayData.sasaran
    .filter(s => settings.porsiBesarSasaranIds.includes(s.id))
    .map(s => s.label)
    .join(", ");

  return (
    <div id="penerima-manfaat-container" className="space-y-6 font-sans">
      
      {/* Header and Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Penerima Manfaat (Siklus 12 Hari)
          </h2>
          <p className="text-sm text-slate-500">
            Kelola jumlah sasaran penerima manfaat, klasifikasi porsi makanan, dan daftar alergi harian.
          </p>
        </div>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm transition-all duration-300 shadow-sm border ${
          alertMsg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
          alertMsg.type === "info" ? "bg-blue-50 border-blue-100 text-blue-800" :
          "bg-rose-50 border-rose-100 text-rose-800"
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="font-medium">{alertMsg.text}</span>
        </div>
      )}

      {/* 12-Day Carousel/Tab Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Pilih Hari Kerja (Siklus 12 Hari)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected = selectedDay === dayNum;
            return (
              <button
                key={dayNum}
                id={`btn-day-tab-${dayNum}`}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10 scale-105"
                    : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                HARI {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Metrics Cards for Selected Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Porsi Kecil (H-{selectedDay})</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-900">{totalPorsiKecil}</span>
              <span className="text-[10px] text-indigo-600 font-bold">Jiwa</span>
            </div>
          </div>
          <p className="text-[9px] text-indigo-500/80 mt-2 line-clamp-2" title={porsiKecilLabels}>
            {porsiKecilLabels || "Tidak ada sasaran aktif"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-4 rounded-2xl border border-cyan-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block">Porsi Besar (H-{selectedDay})</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-cyan-900">{totalPorsiBesar}</span>
              <span className="text-[10px] text-cyan-600 font-bold">Jiwa</span>
            </div>
          </div>
          <p className="text-[9px] text-cyan-500/80 mt-2 line-clamp-2" title={porsiBesarLabels}>
            {porsiBesarLabels || "Tidak ada sasaran aktif"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">PM Alergi (H-{selectedDay})</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-900">{totalAlergi}</span>
              <span className="text-[10px] text-amber-600 font-bold">Jiwa</span>
            </div>
          </div>
          <p className="text-[9px] text-amber-500/80 mt-2">Kecil: {totalAlergiKecil} | Besar: {totalAlergiBesar}</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 rounded-2xl border border-indigo-950 shadow-sm text-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">Total PM (H-{selectedDay})</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{totalPM}</span>
              <span className="text-[10px] text-indigo-300 font-bold">Jiwa</span>
            </div>
          </div>
          <p className="text-[9px] text-indigo-200/80 mt-2">Seluruh kelompok penerima gabungan</p>
        </div>

        {/* Dynamic RAB Harian Metric Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-4 rounded-2xl border border-emerald-500 shadow-md text-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider block">Total RAB Harian (H-{selectedDay})</span>
            <div className="mt-2">
              <span className="text-xl font-extrabold font-mono text-white block truncate">
                {formatIDR(totalRABHarian)}
              </span>
            </div>
          </div>
          <p className="text-[9px] text-emerald-100/90 mt-2 truncate">
            Kecil: {formatIDR(rabPorsiKecil)} | Besar: {formatIDR(rabPorsiBesar)}
          </p>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              Tabel Format Penerima Manfaat — Hari Kerja {selectedDay}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Klasifikasi sasaran gizi, porsi makan, dan jaminan PM Alergi</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-copy-all-days"
              type="button"
              onClick={handleCopyToAllDays}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Salin data hari ini ke 11 hari kerja lainnya"
            >
              <Copy className="w-3.5 h-3.5" />
              Sama-kan 12 Hari
            </button>
            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              Unggah Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
            </label>
            <button
              id="btn-export-pm"
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Format
            </button>
            <button
              id="btn-reset-pm"
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sembuhkan Default
            </button>
          </div>
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4 min-w-[240px]">Kelompok Sasaran</th>
                <th className="p-4 text-center w-40">Porsi Kecil (TK/SD1-3/Balita)</th>
                <th className="p-4 text-center w-40">Porsi Besar (SD4-SMA/Pendidik/Ibu)</th>
                <th className="p-4 text-center w-36">PM Alergi Kecil ⚠️</th>
                <th className="p-4 text-center w-36">PM Alergi Besar ⚠️</th>
                <th className="p-4 text-right w-36">Total Sasaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {activeDayData.sasaran.map((s, idx) => {
                const rowTotal = (Number(s.porsiKecil) || 0) + (Number(s.porsiBesar) || 0);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-center font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 block">{s.label}</span>
                      <span className="text-[10px] text-slate-400">
                        {idx < 7 ? "Kategori Usia Sekolah" : "Kategori Ibu & Anak Balita (3B)"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <input
                          id={`input-pm-kecil-${s.id}`}
                          type="number"
                          value={s.porsiKecil}
                          min="0"
                          onChange={(e) => handleCellChange(s.id, "porsiKecil", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-28 text-center bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl p-2 text-sm font-semibold font-mono"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <input
                          id={`input-pm-besar-${s.id}`}
                          type="number"
                          value={s.porsiBesar}
                          min="0"
                          onChange={(e) => handleCellChange(s.id, "porsiBesar", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-28 text-center bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl p-2 text-sm font-semibold font-mono"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <input
                          id={`input-pm-alergi-kecil-${s.id}`}
                          type="number"
                          value={s.alergiKecil}
                          min="0"
                          onChange={(e) => handleCellChange(s.id, "alergiKecil", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 text-center bg-amber-50/30 border border-amber-200 text-amber-950 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl p-2 text-sm font-bold font-mono"
                          title="Jumlah PM Alergi Porsi Kecil"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <input
                          id={`input-pm-alergi-besar-${s.id}`}
                          type="number"
                          value={s.alergiBesar}
                          min="0"
                          onChange={(e) => handleCellChange(s.id, "alergiBesar", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 text-center bg-orange-50/30 border border-orange-200 text-orange-950 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl p-2 text-sm font-bold font-mono"
                          title="Jumlah PM Alergi Porsi Besar"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800 pr-6">
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}

              {/* Total Summary Row */}
              <tr className="bg-slate-50/70 font-bold border-t-2 border-slate-200">
                <td colSpan={2} className="p-4 text-left font-bold text-slate-800 pl-6">
                  TOTAL KESELURUHAN (H-{selectedDay})
                </td>
                <td className="p-4 text-center font-mono text-indigo-700 text-base">
                  {totalPorsiKecil}
                </td>
                <td className="p-4 text-center font-mono text-cyan-700 text-base">
                  {totalPorsiBesar}
                </td>
                <td className="p-4 text-center font-mono text-amber-700 text-base bg-amber-50/20">
                  {totalAlergiKecil}
                </td>
                <td className="p-4 text-center font-mono text-orange-700 text-base bg-orange-50/20">
                  {totalAlergiBesar}
                </td>
                <td className="p-4 text-right font-mono text-slate-950 text-base pr-6">
                  {totalPM}
                </td>
              </tr>

              {/* Estimasi RAB Harian Row */}
              <tr className="bg-emerald-50/40 font-extrabold border-t border-emerald-100">
                <td colSpan={2} className="p-4 text-left text-emerald-900 pl-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    ESTIMASI RAB HARIAN (H-{selectedDay})
                  </div>
                </td>
                <td className="p-4 text-center font-mono text-emerald-800 text-sm">
                  {formatIDR(rabPorsiKecil)}
                </td>
                <td className="p-4 text-center font-mono text-emerald-800 text-sm">
                  {formatIDR(rabPorsiBesar)}
                </td>
                <td colSpan={2} className="bg-emerald-50/5"></td>
                <td className="p-4 text-right font-mono text-emerald-950 text-base pr-6">
                  {formatIDR(totalRABHarian)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Informational Footer note with customizable targets and target selector */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="flex items-start gap-2.5 text-xs text-indigo-800">
            <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-sm">Pedoman Klasifikasi Jenis Porsi (Juknis BGN 2025):</span>
              <p className="text-slate-600">
                Setiap kelompok sasaran memiliki standard gizi tersendiri. Anda dapat mengubah harga satuan porsi dan memilih kelompok sasaran yang masuk ke dalam klasifikasi porsi di bawah ini untuk kalkulasi alokasi RAB yang dinamis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            
            {/* PORSI KECIL CONFIG CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider self-start">
                  Porsi Kecil
                </span>
                
                {/* Dynamic Price Input for Porsi Kecil */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <span>Target Rp</span>
                  <input
                    id="input-harga-kecil"
                    type="number"
                    value={settings.porsiKecilHarga}
                    min="0"
                    onChange={(e) => updateSetting("porsiKecilHarga", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-center text-xs font-extrabold text-emerald-700 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                  <span>/ porsi</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">Klasifikasi Sasaran Terpilih:</span>
                <p className="text-slate-500 text-[11px]">
                  {porsiKecilLabels || "Belum ada sasaran terpilih. Atur klasifikasi di bawah."}
                </p>
              </div>

              {/* Accordion Toggle for Porsi Kecil Classifications */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowKecilSasaranEditor(!showKecilSasaranEditor)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5" />
                    Pilih Klasifikasi Sasaran Porsi Kecil
                  </span>
                  {showKecilSasaranEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showKecilSasaranEditor && (
                  <div className="mt-2 p-3 bg-white border border-slate-150 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] max-h-[180px] overflow-y-auto animate-in fade-in duration-150">
                    {activeDayData.sasaran.map((s) => {
                      const isChecked = settings.porsiKecilSasaranIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition ${
                            isChecked 
                              ? "bg-indigo-50/40 border-indigo-200 text-indigo-950 font-semibold" 
                              : "border-slate-100 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleKecilSasaran(s.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">{s.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PORSI BESAR CONFIG CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-lg uppercase tracking-wider self-start">
                  Porsi Besar
                </span>
                
                {/* Dynamic Price Input for Porsi Besar */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <span>Target Rp</span>
                  <input
                    id="input-harga-besar"
                    type="number"
                    value={settings.porsiBesarHarga}
                    min="0"
                    onChange={(e) => updateSetting("porsiBesarHarga", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-center text-xs font-extrabold text-emerald-700 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                  <span>/ porsi</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">Klasifikasi Sasaran Terpilih:</span>
                <p className="text-slate-500 text-[11px]">
                  {porsiBesarLabels || "Belum ada sasaran terpilih. Atur klasifikasi di bawah."}
                </p>
              </div>

              {/* Accordion Toggle for Porsi Besar Classifications */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowBesarSasaranEditor(!showBesarSasaranEditor)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-cyan-50 hover:bg-cyan-100/80 text-cyan-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5" />
                    Pilih Klasifikasi Sasaran Porsi Besar
                  </span>
                  {showBesarSasaranEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showBesarSasaranEditor && (
                  <div className="mt-2 p-3 bg-white border border-slate-150 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] max-h-[180px] overflow-y-auto animate-in fade-in duration-150">
                    {activeDayData.sasaran.map((s) => {
                      const isChecked = settings.porsiBesarSasaranIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition ${
                            isChecked 
                              ? "bg-cyan-50/40 border-cyan-200 text-cyan-950 font-semibold" 
                              : "border-slate-100 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBesarSasaran(s.id)}
                            className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">{s.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
