/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HariPM, KelompokSasaranPM } from "../types";
import { Calendar, Download, Upload, Copy, RotateCcw, AlertTriangle, Users, HeartHandshake } from "lucide-react";
import * as XLSX from "xlsx";

interface PenerimaManfaatTabProps {
  harianPM: HariPM[];
  onChange: (updated: HariPM[]) => void;
}

export default function PenerimaManfaatTab({
  harianPM,
  onChange
}: PenerimaManfaatTabProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  const activeDayData = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0];

  // Helper for triggering alert banners
  const triggerAlert = (type: "success" | "info" | "error", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  // Calculations for current day
  const totalPorsiKecil = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.porsiKecil) || 0), 0);
  const totalPorsiBesar = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.porsiBesar) || 0), 0);
  const totalAlergiKecil = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.alergiKecil) || 0), 0);
  const totalAlergiBesar = activeDayData.sasaran.reduce((acc, curr) => acc + (Number(curr.alergiBesar) || 0), 0);
  const totalAlergi = totalAlergiKecil + totalAlergiBesar;
  const totalPM = totalPorsiKecil + totalPorsiBesar;

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

  return (
    <div id="penerima-manfaat-container" className="space-y-6">
      
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
          <span>●</span>
          <span>{alertMsg.text}</span>
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
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 border cursor-pointer ${
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Porsi Kecil (H-{selectedDay})</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-900">{totalPorsiKecil}</span>
            <span className="text-xs text-indigo-600 font-medium">Siswa / Anak</span>
          </div>
          <p className="text-[10px] text-indigo-500/80 mt-1">TK/PAUD, SD Kelas 1-3 & Balita</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-5 rounded-2xl border border-cyan-100 shadow-sm">
          <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider block">Porsi Besar (H-{selectedDay})</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-cyan-900">{totalPorsiBesar}</span>
            <span className="text-xs text-cyan-600 font-medium">Jiwa</span>
          </div>
          <p className="text-[10px] text-cyan-500/80 mt-1">SD Kelas 4-6, SMP, SMA & Ibu</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">PM Alergi (H-{selectedDay})</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-900">{totalAlergi}</span>
            <span className="text-xs text-amber-600 font-medium">Jiwa</span>
          </div>
          <p className="text-[10px] text-amber-500/80 mt-1">Kecil: {totalAlergiKecil} | Besar: {totalAlergiBesar}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Total Sasaran (H-{selectedDay})</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-900">{totalPM}</span>
            <span className="text-xs text-emerald-600 font-medium">Jiwa</span>
          </div>
          <p className="text-[10px] text-emerald-500/80 mt-1">Gabungan seluruh kelompok penerima</p>
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
            </tbody>
          </table>
        </div>

        {/* Informational Footer note */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="flex items-start gap-2.5 text-xs text-indigo-800">
            <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-sm">Pedoman Klasifikasi Jenis Porsi (Juknis BGN 2025):</span>
              <p className="text-slate-600">
                Setiap kelompok sasaran memiliki standard gizi tersendiri. Pengisian jumlah <span className="font-semibold text-amber-700">PM Alergi Porsi Kecil</span> dan <span className="font-semibold text-orange-700">PM Alergi Porsi Besar</span> harus diisi secara akurat untuk kalkulasi alokasi porsi yang tepat dan aman.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                  Porsi Kecil
                </span>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  Target Rp 8.000,- / porsi
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Klasifikasi Sasaran:</span> Balita 6-11 Bulan, Balita 13-59 Bulan, Anak Balita, TK/PAUD/LB, SD/MI/SLB Kelas 1-3.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                  Porsi Besar
                </span>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  Target Rp 8.000,- / porsi
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Klasifikasi Sasaran:</span> TK/PAUD/LB, SD/MI/SLB Kelas 4-6, Siswa SMP/MTS/SMPLB, Siswa SMA/SMK/MK/MASMALB, Pendidik, Tenaga Pendidikan, Ibu Hamil, Ibu Menyusui.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
