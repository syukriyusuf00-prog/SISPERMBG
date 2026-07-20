/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SPPGProfile } from "../types";
import { 
  Calendar, 
  Building, 
  RefreshCw, 
  Save, 
  Trash2, 
  FolderOpen, 
  Clock, 
  Plus, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Archive 
} from "lucide-react";

interface SPPGProfileTabProps {
  profile: SPPGProfile;
  onChange: (updated: SPPGProfile) => void;
  savedPeriods?: any[];
  setSavedPeriods?: (updated: any[]) => void;
  activeState?: {
    sekolahPM: any[];
    tigaBPM: any[];
    harianPM: any[];
    masterMenu: any;
    foodCostDays: any[];
  };
  loadPeriod?: (period: any) => void;
  startNewPeriod?: () => void;
}

export default function SPPGProfileTab({ 
  profile, 
  onChange,
  savedPeriods = [],
  setSavedPeriods,
  activeState,
  loadPeriod,
  startNewPeriod
}: SPPGProfileTabProps) {
  const [periodNameInput, setPeriodNameInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const handleChange = (field: keyof SPPGProfile, value: any) => {
    onChange({ ...profile, [field]: value });
  };

  const handleDateChange = (index: number, value: string) => {
    const updatedDates = [...profile.periodeDates];
    updatedDates[index] = value;
    onChange({ ...profile, periodeDates: updatedDates });
  };

  // Auto-generate 12 days starting from a specific date, skipping Sundays (Senin s/d Sabtu, 2 pekan)
  const generate12Days = (startDateStr: string) => {
    if (!startDateStr) return;
    const dates: string[] = [];
    let current = new Date(startDateStr);
    
    while (dates.length < 12) {
      const day = current.getDay();
      if (day !== 0) { // Skip Sunday (0)
        dates.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    // Set next period start date as the Monday after the last date
    let nextStart = new Date(current);
    while (nextStart.getDay() !== 1) { // Find next Monday
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    onChange({
      ...profile,
      periodeDates: dates,
      awalPeriodeBerikutnya: nextStart.toISOString().split("T")[0]
    });

    // Auto fill a friendly default period label based on start and end date
    if (dates.length > 0) {
      const startFmt = formatDateFriendly(dates[0]);
      const endFmt = formatDateFriendly(dates[11]);
      setPeriodNameInput(`Periode ${startFmt} s/d ${endFmt}`);
    }
  };

  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  // Handler to archive current state
  const handleSaveToHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodNameInput.trim()) {
      setAlertMsg("Mohon masukkan nama atau label periode perencanaan!");
      setTimeout(() => setAlertMsg(""), 3000);
      return;
    }

    if (!setSavedPeriods || !activeState) {
      setAlertMsg("Layanan penyimpanan belum siap.");
      setTimeout(() => setAlertMsg(""), 3000);
      return;
    }

    const currentJakartaTime = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) + " WIB";

    const newPeriodRecord = {
      id: "period_" + Date.now(),
      namaPeriode: periodNameInput.trim(),
      createdAt: currentJakartaTime,
      profile: JSON.parse(JSON.stringify(profile)),
      sekolahPM: JSON.parse(JSON.stringify(activeState.sekolahPM)),
      tigaBPM: JSON.parse(JSON.stringify(activeState.tigaBPM)),
      harianPM: JSON.parse(JSON.stringify(activeState.harianPM)),
      masterMenu: JSON.parse(JSON.stringify(activeState.masterMenu)),
      foodCostDays: JSON.parse(JSON.stringify(activeState.foodCostDays))
    };

    setSavedPeriods([newPeriodRecord, ...savedPeriods]);
    setSaveSuccess(true);
    setPeriodNameInput("");
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleLoadPeriod = (period: any) => {
    if (!loadPeriod) return;
    const confirmLoad = window.confirm(
      `Apakah Anda yakin ingin memuat data perencanaan "${period.namaPeriode}"?\n\nPERINGATAN: Seluruh data perencanaan aktif Anda saat ini di lembar kerja akan digantikan dengan data arsip terpilih. Pastikan Anda sudah mengarsipkan perencanaan saat ini ke riwayat jika diperlukan.`
    );
    if (confirmLoad) {
      loadPeriod(period);
      // set an alert
      alert(`Berhasil memuat perencanaan "${period.namaPeriode}"!`);
    }
  };

  const handleDeletePeriod = (id: string, name: string) => {
    if (!setSavedPeriods) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus arsip "${name}" secara permanen?\n\nPERINGATAN: Tindakan ini akan menghapus data tersebut selamanya dari database cloud GiziSync dan tidak dapat dibatalkan.`
    );
    if (confirmDelete) {
      setSavedPeriods(savedPeriods.filter((p) => p.id !== id));
    }
  };

  const handleStartNewPeriod = () => {
    if (!startNewPeriod) return;
    const confirmNew = window.confirm(
      `Apakah Anda ingin mengosongkan seluruh lembar perencanaan aktif saat ini untuk memulai periode/siklus baru?\n\nSaran: Pastikan data Anda saat ini sudah diarsipkan ke "Riwayat Perencanaan" di bawah agar tidak hilang.`
    );
    if (confirmNew) {
      startNewPeriod();
      setPeriodNameInput("");
      alert("Berhasil mengosongkan lembar perencanaan! Silakan input data untuk periode baru.");
    }
  };

  return (
    <div id="sppg-profile-container" className="space-y-6 font-sans">
      
      {/* 1. INFORMASI LEMBAGA SPPG */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" />
          Informasi Lembaga SPPG
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nama Lembaga</label>
            <input
              id="input-nama-lembaga"
              type="text"
              value={profile.namaLembaga}
              onChange={(e) => handleChange("namaLembaga", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="e.g. SPPG Muna Barat"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Alamat Lengkap</label>
            <input
              id="input-alamat"
              type="text"
              value={profile.alamat}
              onChange={(e) => handleChange("alamat", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="Alamat SPPG"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nama Kepala SPPG</label>
            <input
              id="input-kepala"
              type="text"
              value={profile.namaKepala}
              onChange={(e) => handleChange("namaKepala", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="Nama Kepala"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nama Ahli Gizi</label>
            <input
              id="input-ahli-gizi"
              type="text"
              value={profile.namaAhliGizi}
              onChange={(e) => handleChange("namaAhliGizi", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="Nama Ahli Gizi"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nama Yayasan</label>
            <input
              id="input-yayasan"
              type="text"
              value={profile.namaYayasan}
              onChange={(e) => handleChange("namaYayasan", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="Nama Yayasan"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ketua Yayasan</label>
            <input
              id="input-ketua-yayasan"
              type="text"
              value={profile.ketuaYayasan}
              onChange={(e) => handleChange("ketuaYayasan", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="Nama Ketua Yayasan"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nama Akuntan</label>
            <input
              id="input-nama-akuntan"
              type="text"
              value={profile.namaAkuntan}
              onChange={(e) => handleChange("namaAkuntan", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="Nama Akuntan"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tahun Anggaran</label>
            <input
              id="input-tahun-anggaran"
              type="text"
              value={profile.tahunAnggaran}
              onChange={(e) => handleChange("tahunAnggaran", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              placeholder="Tahun"
            />
          </div>
        </div>
      </div>

      {/* 2. PERIODE PENJADWALAN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Periode Penjadwalan (12 Hari Kerja)
            </h3>
            <p className="text-xs text-slate-500 mt-1">Siklus menu 12 hari (Senin s/d Sabtu, 2 pekan - Minggu libur)</p>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              id="input-generate-start-date"
              type="date"
              defaultValue={profile.periodeDates[0] || ""}
              onChange={(e) => generate12Days(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
            />
            <button
              id="btn-auto-fill-dates"
              type="button"
              onClick={() => {
                const firstVal = (document.getElementById("input-generate-start-date") as HTMLInputElement)?.value;
                if (firstVal) generate12Days(firstVal);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              Siklus Otomatis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Hari {idx + 1}</span>
              <input
                id={`date-field-${idx}`}
                type="date"
                value={profile.periodeDates[idx] || ""}
                onChange={(e) => handleDateChange(idx, e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg text-xs p-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Awal Periode Berikutnya:</span>
            <input
              id="input-awal-periode-berikutnya"
              type="date"
              value={profile.awalPeriodeBerikutnya}
              onChange={(e) => handleChange("awalPeriodeBerikutnya", e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>
          <span className="text-xs text-slate-400 italic">Tanggal ini otomatis dihitung saat Anda menekan tombol "Siklus Otomatis"</span>
        </div>
      </div>

      {/* 3. PUSAT ARSIP & RIWAYAT PERENCANAAN (PERIODE BARU & PERMANEN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sppg-archive-section">
        
        {/* Form Simpan Perencanaan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Arsipkan Perencanaan Aktif</h4>
              <p className="text-[10px] text-slate-400">Amankan data siklus saat ini ke database permanen</p>
            </div>
          </div>

          <form onSubmit={handleSaveToHistory} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Nama / Label Periode Perencanaan:</label>
              <input
                type="text"
                value={periodNameInput}
                onChange={(e) => setPeriodNameInput(e.target.value)}
                placeholder="Contoh: Periode Juli 2026 - Siklus 1"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                Gunakan label yang spesifik agar memudahkan Anda memilah dan memuat kembali data arsip ini di masa mendatang.
              </span>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Perencanaan berhasil diarsipkan secara permanen ke database awan!</span>
              </div>
            )}

            {alertMsg && (
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-150">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{alertMsg}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleStartNewPeriod}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <Plus className="w-4 h-4" />
                <span>Mulai Periode Baru</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/15"
              >
                <Save className="w-4 h-4" />
                <span>Simpan ke Riwayat</span>
              </button>
            </div>
          </form>

          {/* Info Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Mengapa Fitur Ini Penting?
            </span>
            <p>
              Dengan fitur Riwayat Perencanaan, data Anda <strong>tidak akan pernah tertimpa atau terhapus</strong> saat berganti ke periode baru. Cukup simpan siklus saat ini ke riwayat, lalu tekan "Mulai Periode Baru" untuk merancang siklus berikutnya dengan lembar kosong. Anda dapat beralih atau memuat kembali arsip kapan saja.
            </p>
          </div>
        </div>

        {/* Daftar Riwayat Perencanaan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Daftar Riwayat Perencanaan</h4>
                <p className="text-[10px] text-slate-400">Total data perencanaan tersimpan di cloud</p>
              </div>
            </div>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
              {savedPeriods.length} Siklus Tersimpan
            </span>
          </div>

          <div className="flex-grow overflow-y-auto max-h-[360px] pr-1 space-y-3">
            {savedPeriods.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2.5">
                <div className="text-4xl">📭</div>
                <div>
                  <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Tersimpan</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-0.5">
                    Gunakan formulir di samping untuk menyimpan dan mengamankan rencana menu 12 hari aktif Anda saat ini.
                  </p>
                </div>
              </div>
            ) : (
              savedPeriods.map((period: any) => {
                const totalSchools = period.sekolahPM?.length || 0;
                const totalVillages = period.tigaBPM?.length || 0;
                const dateRange = period.profile?.periodeDates || [];
                const firstDate = dateRange[0] ? formatDateFriendly(dateRange[0]) : "-";
                const lastDate = dateRange[11] ? formatDateFriendly(dateRange[11]) : "-";

                return (
                  <div
                    key={period.id}
                    className="p-4 rounded-xl border border-slate-150 hover:border-slate-300 hover:bg-slate-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        {period.namaPeriode}
                      </h5>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        Diarsipkan: {period.createdAt}
                      </p>
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-2">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-lg">
                          <Users className="w-3 h-3 text-slate-400" />
                          {totalSchools} Sekolah • {totalVillages} Desa
                        </span>
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-lg">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          {firstDate} s/d {lastDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(period.id, period.namaPeriode)}
                        title="Hapus Permanen"
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleLoadPeriod(period)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl transition cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-500/10"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Muat Data</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
