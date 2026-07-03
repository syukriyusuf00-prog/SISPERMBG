/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { SPPGProfile, SekolahPM, TigaBPM, MasterMenu, FoodCostDay, TKPIItem, KelompokSasaranPM, HariPM } from "./types";
import { INITIAL_SPPG_PROFILE, INITIAL_SEKOLAH_PM, INITIAL_TIGAB_PM, INITIAL_MASTER_MENU, INITIAL_FOOD_COST_DAYS, INITIAL_HARIAN_PM } from "./initialData";
import { INITIAL_TKPI_DATABASE } from "./tkpiData";
import { getCountsForDay } from "./utils/calc";

// Components
import SPPGProfileTab from "./components/SPPGProfileTab";
import PenerimaManfaatTab from "./components/PenerimaManfaatTab";
import MasterMenuTab from "./components/MasterMenuTab";
import FoodCostTab from "./components/FoodCostTab";
import CekGiziTab from "./components/CekGiziTab";
import DashboardOutputs from "./components/DashboardOutputs";
import NotaPesananLogistikTab from "./components/NotaPesananLogistikTab";
import RujukanJuknisTab from "./components/RujukanJuknisTab";
import HandbookTab from "./components/HandbookTab";

// Icons & Animation
import {
  Heart,
  Book,
  TrendingUp,
  Settings,
  Users,
  Utensils,
  BookOpen,
  DollarSign,
  Search,
  Database,
  Printer,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Upload,
  Download,
  FileText,
  Camera,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "./context/AuthContext.tsx";

export default function App() {
  // Load initial state from LocalStorage or use default initial values
  const [profile, setProfile] = useState<SPPGProfile>(() => {
    const saved = localStorage.getItem("sisper_profile");
    return saved ? JSON.parse(saved) : INITIAL_SPPG_PROFILE;
  });

  const [sekolahPM, setSekolahPM] = useState<SekolahPM[]>(() => {
    const saved = localStorage.getItem("sisper_sekolah");
    return saved ? JSON.parse(saved) : INITIAL_SEKOLAH_PM;
  });

  const [tigaBPM, setTigaBPM] = useState<TigaBPM[]>(() => {
    const saved = localStorage.getItem("sisper_tigab");
    return saved ? JSON.parse(saved) : INITIAL_TIGAB_PM;
  });

  const [harianPM, setHarianPM] = useState<HariPM[]>(() => {
    const saved = localStorage.getItem("sisper_harian_pm");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_HARIAN_PM;
  });

  const [masterMenu, setMasterMenu] = useState<MasterMenu>(() => {
    const saved = localStorage.getItem("sisper_menu");
    return saved ? JSON.parse(saved) : INITIAL_MASTER_MENU;
  });

  const [foodCostDays, setFoodCostDays] = useState<FoodCostDay[]>(() => {
    const saved = localStorage.getItem("sisper_food_cost");
    return saved ? JSON.parse(saved) : INITIAL_FOOD_COST_DAYS;
  });

  const [tkpiList, setTkpiList] = useState<TKPIItem[]>(() => {
    const saved = localStorage.getItem("sisper_tkpi_list");
    return saved ? JSON.parse(saved) : INITIAL_TKPI_DATABASE;
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [tkpiSearchQuery, setTkpiSearchQuery] = useState<string>("");
  const [customLogo, setCustomLogo] = useState<string>(() => {
    return localStorage.getItem("sisper_custom_logo") || "/src/assets/images/logo_sppg_1782256222616.jpg";
  });

  const { 
    user, 
    isCloudActive, 
    saveStateToCloud, 
    loadStateFromCloud, 
    signInWithGoogle, 
    signOutUser 
  } = useAuth();
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string>("Mode Lokal");

  // Sync state helpers
  useEffect(() => {
    if (user) {
      const loadAllCloudData = async () => {
        setIsCloudLoading(true);
        setCloudStatusMessage("Sinkronisasi Awan...");
        try {
          const cloudProfile = await loadStateFromCloud("profile");
          const cloudSekolah = await loadStateFromCloud("sekolah");
          const cloudTigab = await loadStateFromCloud("tigab");
          const cloudHarianPM = await loadStateFromCloud("harianPM");
          const cloudMenu = await loadStateFromCloud("menu");
          const cloudFoodCost = await loadStateFromCloud("foodCost");
          const cloudTkpi = await loadStateFromCloud("tkpi");
          const cloudCustomLogo = await loadStateFromCloud("customLogo");

          // Restore existing cloud states
          if (cloudProfile) setProfile(cloudProfile);
          if (cloudSekolah) setSekolahPM(cloudSekolah);
          if (cloudTigab) setTigaBPM(cloudTigab);
          if (cloudHarianPM) setHarianPM(cloudHarianPM);
          if (cloudMenu) setMasterMenu(cloudMenu);
          if (cloudFoodCost) setFoodCostDays(cloudFoodCost);
          if (cloudTkpi) setTkpiList(cloudTkpi);
          if (cloudCustomLogo) setCustomLogo(cloudCustomLogo);
          
          // Seed new cloud database if empty
          if (!cloudProfile) await saveStateToCloud("profile", profile);
          if (!cloudSekolah) await saveStateToCloud("sekolah", sekolahPM);
          if (!cloudTigab) await saveStateToCloud("tigab", tigaBPM);
          if (!cloudHarianPM) await saveStateToCloud("harianPM", harianPM);
          if (!cloudMenu) await saveStateToCloud("menu", masterMenu);
          if (!cloudFoodCost) await saveStateToCloud("foodCost", foodCostDays);
          if (!cloudTkpi) await saveStateToCloud("tkpi", tkpiList);
          if (!cloudCustomLogo) await saveStateToCloud("customLogo", customLogo);
          
          setCloudStatusMessage("Awan Aktif");
        } catch (error) {
          console.error("Gagal sinkronisasi awan:", error);
          setCloudStatusMessage("Gagal Sinkron");
        } finally {
          setIsCloudLoading(false);
        }
      };
      loadAllCloudData();
    } else {
      setCloudStatusMessage("Mode Lokal");
    }
  }, [user]);

  // Save states to local storage and Cloud (with debounce)
  useEffect(() => {
    localStorage.setItem("sisper_custom_logo", customLogo);
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("customLogo", customLogo), 1500);
      return () => clearTimeout(timer);
    }
  }, [customLogo, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_profile", JSON.stringify(profile));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("profile", profile), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_sekolah", JSON.stringify(sekolahPM));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("sekolah", sekolahPM), 1500);
      return () => clearTimeout(timer);
    }
  }, [sekolahPM, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_tigab", JSON.stringify(tigaBPM));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("tigab", tigaBPM), 1500);
      return () => clearTimeout(timer);
    }
  }, [tigaBPM, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_menu", JSON.stringify(masterMenu));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("menu", masterMenu), 1500);
      return () => clearTimeout(timer);
    }
  }, [masterMenu, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_food_cost", JSON.stringify(foodCostDays));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("foodCost", foodCostDays), 1500);
      return () => clearTimeout(timer);
    }
  }, [foodCostDays, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_harian_pm", JSON.stringify(harianPM));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("harianPM", harianPM), 1500);
      return () => clearTimeout(timer);
    }
  }, [harianPM, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_tkpi_list", JSON.stringify(tkpiList));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("tkpi", tkpiList), 1500);
      return () => clearTimeout(timer);
    }
  }, [tkpiList, isCloudActive, isCloudLoading]);

  // Recipient totals (using Day 1 as default baseline display)
  const defaultDayCounts = getCountsForDay(harianPM, 1);
  const totalSekolahSiswa = defaultDayCounts.pmKecilSekolah + defaultDayCounts.pmBesarSekolah;
  const total3BOrang = defaultDayCounts.totalBalita + defaultDayCounts.totalBumil + defaultDayCounts.totalBusui;
  const grandTotalRecipients = totalSekolahSiswa + total3BOrang;

  // Reset demo data
  const handleResetData = () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang data kembali ke setelan default SPPG Muna Barat? Semua perubahan Anda akan dihapus.")) {
      setProfile(INITIAL_SPPG_PROFILE);
      setSekolahPM(INITIAL_SEKOLAH_PM);
      setTigaBPM(INITIAL_TIGAB_PM);
      setHarianPM(INITIAL_HARIAN_PM);
      setMasterMenu(INITIAL_MASTER_MENU);
      setFoodCostDays(INITIAL_FOOD_COST_DAYS);
      setTkpiList(INITIAL_TKPI_DATABASE);
      setCustomLogo("/src/assets/images/logo_sppg_1782256222616.jpg");
      setActiveTab("dashboard");
    }
  };

  // State for adding custom TKPI item manually
  const [newTkpiItem, setNewTkpiItem] = useState<Partial<TKPIItem>>({
    id: "",
    nama: "",
    sumber: "Serealia",
    kategori: "",
    beratStandar: 100,
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
    vit_c: 0,
    air: 0
  });

  const handleAddTkpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTkpiItem.nama) {
      alert("Mohon masukkan nama bahan makanan!");
      return;
    }
    const slug = (newTkpiItem.nama || "").toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
    const finalItem: TKPIItem = {
      id: slug,
      nama: newTkpiItem.nama,
      sumber: newTkpiItem.sumber || "Umum",
      kategori: newTkpiItem.kategori || "",
      beratStandar: Number(newTkpiItem.beratStandar) || 100,
      bdd: Number(newTkpiItem.bdd) || 100,
      energi: Number(newTkpiItem.energi) || 0,
      protein: Number(newTkpiItem.protein) || 0,
      lemak: Number(newTkpiItem.lemak) || 0,
      kh: Number(newTkpiItem.kh) || 0,
      serat: Number(newTkpiItem.serat) || 0,
      abu: Number(newTkpiItem.abu) || 0,
      ca: Number(newTkpiItem.ca) || 0,
      p: Number(newTkpiItem.p) || 0,
      fe: Number(newTkpiItem.fe) || 0,
      na: Number(newTkpiItem.na) || 0,
      k: Number(newTkpiItem.k) || 0,
      cu: Number(newTkpiItem.cu) || 0,
      zn: Number(newTkpiItem.zn) || 0,
      retinol: Number(newTkpiItem.retinol) || 0,
      b_karoten: Number(newTkpiItem.b_karoten) || 0,
      thiamin: Number(newTkpiItem.thiamin) || 0,
      riboflavin: Number(newTkpiItem.riboflavin) || 0,
      niasin: Number(newTkpiItem.niasin) || 0,
      vit_c: Number(newTkpiItem.vit_c) || 0,
      air: Number(newTkpiItem.air) || 0
    };

    setTkpiList([...tkpiList, finalItem]);
    alert("Bahan makanan kustom berhasil ditambahkan ke database lokal!");
    
    // Reset form
    setNewTkpiItem({
      id: "",
      nama: "",
      sumber: "Serealia",
      kategori: "",
      beratStandar: 100,
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
      vit_c: 0,
      air: 0
    });
  };

  const handleDownloadTemplate = () => {
    // Define headers exactly as parsed by handleTkpiUpload
    const headers = [
      "Nama Bahan",
      "Kategori",
      "Sumber",
      "Berat Standar",
      "BDD",
      "Energi",
      "Protein",
      "Lemak",
      "KH",
      "Serat",
      "Abu",
      "Kalsium",
      "Fosfor",
      "Zat Besi",
      "Natrium",
      "Kalium",
      "Tembaga",
      "Seng",
      "Retinol",
      "Beta Karoten",
      "Thiamin",
      "Riboflavin",
      "Niasin",
      "Vit C",
      "Air"
    ];

    const sampleRow = {
      "Nama Bahan": "Susu Kambing Segar",
      "Kategori": "Susu dan Olahannya",
      "Sumber": "Peternak Mubar",
      "Berat Standar": 100,
      "BDD": 100,
      "Energi": 64,
      "Protein": 4.3,
      "Lemak": 2.3,
      "KH": 6.6,
      "Serat": 0,
      "Abu": 0.8,
      "Kalsium": 98,
      "Fosfor": 78,
      "Zat Besi": 2.7,
      "Natrium": 35,
      "Kalium": 145,
      "Tembaga": 0.05,
      "Seng": 0.3,
      "Retinol": 37,
      "Beta Karoten": 0,
      "Thiamin": 0.05,
      "Riboflavin": 0.14,
      "Niasin": 0.2,
      "Vit C": 1,
      "Air": 85.9
    };

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_TKPI");
    XLSX.writeFile(wb, "Template_Database_TKPI.xlsx");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit to prevent localStorage overflow (e.g. 1.5MB)
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar. Silakan unggah gambar di bawah 1.5 MB agar aplikasi tetap ringan.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result;
      if (typeof base64 === "string") {
        setCustomLogo(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTkpiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const parsed: TKPIItem[] = rawData.map((row: any, idx: number) => {
            const nama = row["Nama Bahan"] || row["nama"] || row["NamaBahan"] || "Bahan Baru " + idx;
            const sumber = row["Sumber"] || row["sumber"] || "Lain-lain";
            const kategori = row["Kategori"] || row["kategori"] || "";
            const beratStandar = Number(row["Berat Standar"] || row["berat_standar"] || 100);
            const bdd = Number(row["BDD"] || row["bdd"] || 100);
            const air = Number(row["Air"] || row["air"] || 0);
            
            return {
              id: `tkpi_import_${idx}_${Date.now()}`,
              nama,
              sumber,
              kategori,
              beratStandar,
              bdd,
              energi: Number(row["Energi"] || row["energi"] || 0),
              protein: Number(row["Protein"] || row["protein"] || 0),
              lemak: Number(row["Lemak"] || row["lemak"] || 0),
              kh: Number(row["KH"] || row["kh"] || row["Karbohidrat"] || 0),
              serat: Number(row["Serat"] || row["serat"] || 0),
              abu: Number(row["Abu"] || row["abu"] || 0),
              ca: Number(row["Ca"] || row["Kalsium"] || 0),
              p: Number(row["P"] || row["Fosfor"] || 0),
              fe: Number(row["Fe"] || row["Zat Besi"] || 0),
              na: Number(row["Na"] || row["Natrium"] || 0),
              k: Number(row["K"] || row["Kalium"] || 0),
              cu: Number(row["Cu"] || row["Tembaga"] || 0),
              zn: Number(row["Zn"] || row["Seng"] || 0),
              retinol: Number(row["Retinol"] || 0),
              b_karoten: Number(row["Beta Karoten"] || row["b_karoten"] || 0),
              thiamin: Number(row["Thiamin"] || row["thiamin"] || 0),
              riboflavin: Number(row["Riboflavin"] || row["riboflavin"] || 0),
              niasin: Number(row["Niasin"] || row["niasin"] || 0),
              vit_c: Number(row["Vit C"] || row["vit_c"] || 0),
              air
            };
          });

          setTkpiList([...tkpiList, ...parsed]);
          alert(`Berhasil mengimpor ${parsed.length} bahan makanan baru ke database lokal!`);
        }
      } catch (err) {
        alert("Gagal memproses file. Pastikan kolom memiliki 'Nama Bahan', 'Kategori', 'Sumber', 'BDD', 'Energi', 'Protein', 'Lemak', 'KH' dll.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const deleteTkpiItem = (id: string) => {
    if (INITIAL_TKPI_DATABASE.some((item) => item.id === id)) {
      alert("Bahan makanan bawaan sistem tidak bisa dihapus.");
      return;
    }
    if (confirm("Hapus bahan makanan kustom ini dari database lokal?")) {
      setTkpiList(tkpiList.filter((t) => t.id !== id));
    }
  };

  const filteredTkpiList = tkpiList.filter((item) => {
    if (!tkpiSearchQuery) return true;
    const q = tkpiSearchQuery.toLowerCase();
    const namaMatch = (item.nama || "").toLowerCase().includes(q);
    const sumberMatch = (item.sumber || "").toLowerCase().includes(q);
    const kategoriMatch = (item.kategori || "").toLowerCase().includes(q);
    return namaMatch || sumberMatch || kategoriMatch;
  });

  return (
    <div id="sisper-app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* HEADER BANNER */}
      <header className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md py-5 px-6 shrink-0 relative overflow-hidden">
        {/* Abstract design elements to express high craftsmanship */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-400 shadow-lg cursor-pointer">
              <img
                src={customLogo}
                alt="Logo SPPG"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <label
                htmlFor="logo-uploader"
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] text-white font-bold"
              >
                <Camera className="w-5 h-5 mb-1 text-emerald-400" />
                Ubah Logo
              </label>
              <input
                id="logo-uploader"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-500 text-[20px] font-extrabold px-4 py-1 rounded-full text-slate-950 tracking-wider uppercase">
                  Selamat Datang..
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                SISPERMBG <span className="font-light text-slate-300">| Sistem Perencanaan Makan Bergizi Gratis</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile.namaLembaga} • {profile.alamat}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cloud Sync Status & Login Block */}
            <div className="flex items-center gap-2 bg-slate-900/40 border border-white/10 p-1.5 rounded-xl">
              {isCloudActive ? (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    {isCloudLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline truncate max-w-[120px]" title={user?.email || ""}>
                      {user?.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded-md text-emerald-300 uppercase">
                      {isCloudLoading ? "Sync" : "Awan"}
                    </span>
                  </div>
                  <button
                    id="btn-header-logout"
                    type="button"
                    onClick={signOutUser}
                    title="Keluar / Putuskan Sinkronisasi Awan"
                    className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  id="btn-header-login"
                  type="button"
                  disabled={isCloudLoading}
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg transition border border-white/5 disabled:opacity-50"
                  title="Masuk dengan Google untuk mengaktifkan Sinkronisasi Awan"
                >
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cloud Sync</span>
                </button>
              )}
            </div>

            <button
              id="btn-header-reset"
              type="button"
              onClick={handleResetData}
              className="text-xs bg-white/10 hover:bg-white/15 text-slate-300 font-semibold py-2 px-3.5 rounded-xl border border-white/10 transition flex items-center gap-1.5"
            >
              Setel Ulang Demo
            </button>
            <div className="bg-emerald-500 text-slate-950 font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span>
              {grandTotalRecipients} Penerima Manfaat Aktif
            </div>
          </div>
        </div>
      </header>

      {/* CORE STATS BAR */}
      <section className="bg-white border-b border-slate-200 py-3.5 px-6 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Main Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {[
              { id: "dashboard", label: "Dashboard and Output", icon: Layers, color: "text-indigo-600" },
              { id: "sppg", label: "Profil SPPG", icon: Settings, color: "text-slate-500" },
              { id: "juknis", label: "Rujukan Juknis 2025", icon: BookOpen, color: "text-teal-600" },
              { id: "penerima", label: "Penerima Manfaat", icon: Users, color: "text-cyan-500" },
              { id: "menu", label: "Master Menu", icon: Utensils, color: "text-emerald-500" },
              { id: "foodcost", label: "Food Cost", icon: DollarSign, color: "text-amber-500" },
              { id: "notalogistik", label: "Gabungan Semua Food Cost", icon: FileText, color: "text-orange-500" },
              { id: "cekgizi", label: "Sandbox Gizi", icon: Search, color: "text-purple-500" },
              { id: "tkpi", label: "Database TKPI 2020", icon: Database, color: "text-rose-500" },
              { id: "handbook", label: "Handbook", icon: Book, color: "text-indigo-500" }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${tab.color}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Minimal info */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Siklus 12 Tanggal Aktif</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Sesuai Juknis BGN No. 401.1/2025</span>
            </div>
          </div>

        </div>
      </section>

      {/* ACTIVE SCREEN CONTENT */}
      <main className={`flex-grow p-6 ${activeTab === "notalogistik" ? "max-w-full px-4 md:px-8" : activeTab === "foodcost" ? "max-w-[1600px]" : "max-w-7xl"} w-full mx-auto overflow-y-auto`}>
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <DashboardOutputs
              foodCostDays={foodCostDays}
              tkpiList={tkpiList}
              masterMenu={masterMenu}
              harianPM={harianPM}
            />
          </div>
        )}

        {activeTab === "notalogistik" && (
          <NotaPesananLogistikTab
            profile={profile}
            foodCostDays={foodCostDays}
            tkpiList={tkpiList}
            harianPM={harianPM}
            masterMenu={masterMenu}
          />
        )}

        {activeTab === "sppg" && (
          <SPPGProfileTab profile={profile} onChange={setProfile} />
        )}

        {activeTab === "penerima" && (
          <PenerimaManfaatTab
            harianPM={harianPM}
            onChange={setHarianPM}
          />
        )}

        {activeTab === "menu" && (
          <MasterMenuTab menu={masterMenu} onChange={setMasterMenu} profile={profile} customLogo={customLogo} />
        )}

        {activeTab === "foodcost" && (
          <FoodCostTab
            foodCostDays={foodCostDays}
            tkpiList={tkpiList}
            masterMenu={masterMenu}
            harianPM={harianPM}
            onFoodCostDaysChange={setFoodCostDays}
            profile={profile}
            customLogo={customLogo}
          />
        )}

        {activeTab === "cekgizi" && (
          <CekGiziTab tkpiList={tkpiList} />
        )}

        {activeTab === "juknis" && (
          <RujukanJuknisTab />
        )}

        {activeTab === "tkpi" && (
          <div className="space-y-6" id="tkpi-database-tab">
            {/* TKPI top summary and excel upload */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-rose-500" />
                  Tabel Komposisi Pangan Indonesia (TKPI) 2020 — Lokal
                </h3>
                <p className="text-xs text-slate-500">
                  Data nutrisi per 100 gram bahan makanan. Anda dapat menambahkan bahan secara manual atau mengunggah spreadsheet kustom.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadTemplate}
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  <Download className="w-4 h-4" />
                  Unduh Template Excel
                </button>
                <label className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  Unggah TKPI Excel
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleTkpiUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Form to add item manually */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-fit xl:col-span-4 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-rose-500" />
                  Tambah Bahan Makanan Kustom
                </h4>

                <form onSubmit={handleAddTkpiSubmit} className="space-y-4 text-xs">
                  {/* GROUP 1: Informasi Utama */}
                  <div className="space-y-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">1. Informasi Utama & Klasifikasi</span>
                    
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider block">Nama Bahan Pangan <span className="text-red-500">*</span></label>
                      <input
                        id="form-tkpi-nama"
                        type="text"
                        required
                        value={newTkpiItem.nama || ""}
                        onChange={(e) => setNewTkpiItem({ ...newTkpiItem, nama: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                        placeholder="e.g. Ikan Mas Segar"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider block">Kategori</label>
                        <input
                          id="form-tkpi-kategori"
                          type="text"
                          value={newTkpiItem.kategori || ""}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, kategori: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                          placeholder="e.g. Ikan & Kerang"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider block">(SUMBER)</label>
                        <input
                          id="form-tkpi-sumber"
                          type="text"
                          value={newTkpiItem.sumber || ""}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, sumber: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                          placeholder="e.g. Hewani"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider block">Berat Standar (g)</label>
                        <input
                          id="form-tkpi-beratStandar"
                          type="number"
                          min="1"
                          value={newTkpiItem.beratStandar || ""}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, beratStandar: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono text-right bg-white"
                          placeholder="100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider block">BDD (%)</label>
                        <input
                          id="form-tkpi-bdd"
                          type="number"
                          min="1"
                          max="100"
                          value={newTkpiItem.bdd || ""}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, bdd: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono text-right bg-white"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 2: Proksimat / Makro Gizi */}
                  <div className="space-y-3 bg-amber-50/20 p-3 rounded-xl border border-amber-100/30">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">2. Kandungan Makro & Proksimat</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Energi (kkal)</label>
                        <input
                          id="form-tkpi-energi"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.energi || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, energi: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Protein (g)</label>
                        <input
                          id="form-tkpi-protein"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.protein || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, protein: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Lemak (g)</label>
                        <input
                          id="form-tkpi-lemak"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.lemak || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, lemak: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Karbohidrat (g)</label>
                        <input
                          id="form-tkpi-kh"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.kh || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, kh: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Serat (g)</label>
                        <input
                          id="form-tkpi-serat"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.serat || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, serat: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Abu (g)</label>
                        <input
                          id="form-tkpi-abu"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.abu || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, abu: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-slate-500 block text-[10px]">AIR (g)</label>
                        <input
                          id="form-tkpi-air"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.air || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, air: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: Mineral */}
                  <div className="space-y-3 bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/30">
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">3. Kandungan Mineral</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Kalsium (mg)</label>
                        <input
                          id="form-tkpi-ca"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.ca || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, ca: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Fosfor (mg)</label>
                        <input
                          id="form-tkpi-p"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.p || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, p: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Zat Besi (mg)</label>
                        <input
                          id="form-tkpi-fe"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.fe || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, fe: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Natrium (mg)</label>
                        <input
                          id="form-tkpi-na"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.na || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, na: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Kalium (mg)</label>
                        <input
                          id="form-tkpi-k"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.k || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, k: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Tembaga (mg)</label>
                        <input
                          id="form-tkpi-cu"
                          type="number"
                          step="0.01"
                          value={newTkpiItem.cu || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, cu: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Seng (mg)</label>
                        <input
                          id="form-tkpi-zn"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.zn || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, zn: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 4: Vitamin */}
                  <div className="space-y-3 bg-rose-50/20 p-3 rounded-xl border border-rose-100/30">
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">4. Kandungan Vitamin</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Retinol (mcg)</label>
                        <input
                          id="form-tkpi-retinol"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.retinol || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, retinol: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">β-Karoten (mcg)</label>
                        <input
                          id="form-tkpi-b-karoten"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.b_karoten || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, b_karoten: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Thiamin (mg)</label>
                        <input
                          id="form-tkpi-thiamin"
                          type="number"
                          step="0.01"
                          value={newTkpiItem.thiamin || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, thiamin: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Riboflavin (mg)</label>
                        <input
                          id="form-tkpi-riboflavin"
                          type="number"
                          step="0.01"
                          value={newTkpiItem.riboflavin || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, riboflavin: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Niasin (mg)</label>
                        <input
                          id="form-tkpi-niasin"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.niasin || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, niasin: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block text-[10px]">Vitamin C (mg)</label>
                        <input
                          id="form-tkpi-vit_c"
                          type="number"
                          step="0.1"
                          value={newTkpiItem.vit_c || 0}
                          onChange={(e) => setNewTkpiItem({ ...newTkpiItem, vit_c: Number(e.target.value) })}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-form-tkpi-submit"
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition text-xs shadow-md mt-6"
                  >
                    Simpan Bahan Baru (Lengkap)
                  </button>
                </form>
              </div>

              {/* List of items */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden xl:col-span-8 flex flex-col h-[750px]">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Daftar Bahan Terdaftar ({filteredTkpiList.length})</h4>
                    <span className="text-[10px] text-slate-400 italic font-medium">Bahan kustom memiliki tombol hapus. Geser tabel ke kanan untuk melihat nutrisi lengkap.</span>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="search-tkpi-input"
                      type="text"
                      placeholder="Cari nama, kategori, sumber..."
                      value={tkpiSearchQuery}
                      onChange={(e) => setTkpiSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-xs table-fixed min-w-[2000px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-xs">
                      <tr>
                        <th className="p-3 w-14 text-center">No</th>
                        <th className="p-3 w-40">Kategori</th>
                        <th className="p-3 w-56">Nama Bahan</th>
                        <th className="p-3 w-40">(SUMBER)</th>
                        <th className="p-3 w-28 text-center">Berat Std</th>
                        <th className="p-3 w-24 text-center">BDD (%)</th>
                        <th className="p-3 w-28 text-center">Energi (kkal)</th>
                        <th className="p-3 w-24 text-center">Protein (g)</th>
                        <th className="p-3 w-24 text-center">Lemak (g)</th>
                        <th className="p-3 w-24 text-center">KH (g)</th>
                        <th className="p-3 w-24 text-center">Serat (g)</th>
                        <th className="p-3 w-24 text-center">Abu (g)</th>
                        <th className="p-3 w-28 text-center">Kalsium (mg)</th>
                        <th className="p-3 w-24 text-center">Fosfor (mg)</th>
                        <th className="p-3 w-24 text-center">Zat Besi (mg)</th>
                        <th className="p-3 w-24 text-center">Natrium (mg)</th>
                        <th className="p-3 w-24 text-center">Kalium (mg)</th>
                        <th className="p-3 w-24 text-center">Tembaga (mg)</th>
                        <th className="p-3 w-24 text-center">Seng (mg)</th>
                        <th className="p-3 w-24 text-center">Retinol (mcg)</th>
                        <th className="p-3 w-24 text-center">β-Karoten (mcg)</th>
                        <th className="p-3 w-24 text-center">Thiamin (mg)</th>
                        <th className="p-3 w-24 text-center">Riboflavin (mg)</th>
                        <th className="p-3 w-24 text-center">Niasin (mg)</th>
                        <th className="p-3 w-24 text-center">Vit C (mg)</th>
                        <th className="p-3 w-24 text-center">AIR (g)</th>
                        <th className="p-3 w-20 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredTkpiList.map((t, idx) => {
                        const isSystemItem = INITIAL_TKPI_DATABASE.some((item) => item.id === t.id);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2.5 truncate font-semibold text-rose-800 bg-rose-50/10">
                              {t.kategori || t.sumber || "Umum"}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800 truncate" title={t.nama}>{t.nama}</td>
                            <td className="p-2.5 truncate text-slate-500 font-medium">{t.sumber}</td>
                            <td className="p-2.5 text-center font-mono text-indigo-700 font-medium">
                              {t.beratStandar !== undefined ? t.beratStandar : 100} g
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-600">{t.bdd}%</td>
                            <td className="p-2.5 text-center font-mono text-amber-700 font-extrabold">{t.energi.toFixed(0)}</td>
                            <td className="p-2.5 text-center font-mono text-indigo-700 font-bold">{t.protein.toFixed(1)}g</td>
                            <td className="p-2.5 text-center font-mono text-rose-700 font-bold">{t.lemak.toFixed(1)}g</td>
                            <td className="p-2.5 text-center font-mono text-cyan-700 font-bold">{t.kh.toFixed(1)}g</td>
                            <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{t.serat.toFixed(1)}g</td>
                            <td className="p-2.5 text-center font-mono text-slate-500">{t.abu !== undefined ? t.abu.toFixed(1) : "0.0"}g</td>
                            <td className="p-2.5 text-center font-mono text-teal-700 font-semibold">{t.ca !== undefined ? t.ca : 0}</td>
                            <td className="p-2.5 text-center font-mono text-purple-700">{t.p !== undefined ? t.p : 0}</td>
                            <td className="p-2.5 text-center font-mono text-pink-700 font-semibold">{t.fe !== undefined ? t.fe.toFixed(1) : "0.0"}</td>
                            <td className="p-2.5 text-center font-mono text-blue-700">{t.na !== undefined ? t.na : 0}</td>
                            <td className="p-2.5 text-center font-mono text-orange-700">{t.k !== undefined ? t.k : 0}</td>
                            <td className="p-2.5 text-center font-mono text-yellow-800">{t.cu !== undefined ? t.cu.toFixed(2) : "0.00"}</td>
                            <td className="p-2.5 text-center font-mono text-violet-800">{t.zn !== undefined ? t.zn.toFixed(1) : "0.0"}</td>
                            <td className="p-2.5 text-center font-mono text-red-600">{t.retinol !== undefined ? t.retinol : 0}</td>
                            <td className="p-2.5 text-center font-mono text-orange-600">{t.b_karoten !== undefined ? t.b_karoten : 0}</td>
                            <td className="p-2.5 text-center font-mono text-amber-600 font-medium">{t.thiamin !== undefined ? t.thiamin.toFixed(2) : "0.00"}</td>
                            <td className="p-2.5 text-center font-mono text-lime-600 font-medium">{t.riboflavin !== undefined ? t.riboflavin.toFixed(2) : "0.00"}</td>
                            <td className="p-2.5 text-center font-mono text-indigo-500">{t.niasin !== undefined ? t.niasin.toFixed(1) : "0.0"}</td>
                            <td className="p-2.5 text-center font-mono text-red-500 font-semibold">{t.vit_c !== undefined ? t.vit_c.toFixed(1) : "0.0"}</td>
                            <td className="p-2.5 text-center font-mono text-sky-600 font-semibold bg-sky-50/10">
                              {t.air !== undefined ? t.air.toFixed(1) : "0.0"}g
                            </td>
                            <td className="p-2.5 text-center">
                              {!isSystemItem ? (
                                <button
                                  id={`btn-del-tkpi-${t.id}`}
                                  type="button"
                                  onClick={() => deleteTkpiItem(t.id)}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition inline-flex items-center justify-center"
                                  title="Hapus bahan kustom"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">System</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "handbook" && (
          <HandbookTab />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-5 px-6 text-center mt-auto shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-full">
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-white">Syukri Odhe|Ahli Gizi</span>
          <span>• Sistem Perencanaan Menu Makan Bergizi Gratis</span>
        </div>
        <span className="italic text-[11px] text-slate-500">
          Dirancang untuk {profile.namaLembaga} • Juknis BGN No. 401.1/2025
        </span>
      </footer>
    </div>
  );
}
