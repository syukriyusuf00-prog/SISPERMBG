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
import AdminPanel from "./components/AdminPanel";

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
  Clock,
  Lock,
  LogOut,
  AlertCircle,
  Zap
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

  // Synchronized KOP Surat & Logos
  const [kopLine1, setKopLine1] = useState(() => localStorage.getItem("kop_line1") || "BADAN GIZI NASIONAL");
  const [kopLine2, setKopLine2] = useState(() => localStorage.getItem("kop_line2") || "SATUAN PELAYANAN PEMENUHAN GIZI");
  const [kopLine3, setKopLine3] = useState(() => localStorage.getItem("kop_line3") || "SPPG MUNA BARAT SAWERIGADI ONDOKE");
  const [kopLine4, setKopLine4] = useState(() => localStorage.getItem("kop_line4") || "Alamat : Jln. Poros Lagadi-Tondasi, Desa Ondoke, Kec. Sawerigadi, Kab. Muna Barat");
  const [kopLeftLogo, setKopLeftLogo] = useState(() => localStorage.getItem("kop_left_logo") || "/src/assets/images/logo_sppg_1782256222616.jpg");
  const [kopRightLogo, setKopRightLogo] = useState(() => localStorage.getItem("kop_right_logo") || "");

  // Synchronized Sandbox Gizi (Cek Gizi) items
  const [cekGiziItems, setCekGiziItems] = useState<any[]>(() => {
    const saved = localStorage.getItem("sisper_cek_gizi_items");
    return saved ? JSON.parse(saved) : [
      { id: "item_1", namaMenu: "Menu Uji Coba", tkpiId: "beras_giling", berat: 80, urt: "1 piring" },
      { id: "item_2", namaMenu: "Menu Uji Coba", tkpiId: "daging_ayam_tanpa_kulit", berat: 60, urt: "1 potong" },
      { id: "item_3", namaMenu: "Menu Uji Coba", tkpiId: "wortel_segar", berat: 30, urt: "1/2 gelas" }
    ];
  });

  const { 
    user, 
    userProfile,
    loading,
    isCloudActive, 
    saveStateToCloud, 
    loadStateFromCloud, 
    signInWithGoogle, 
    signOutUser,
    registerUser,
    refreshUserProfile,
    authError,
    setAuthError,
    simulateAdminLogin
  } = useAuth();

  // Registration Form States
  const [regNama, setRegNama] = useState("");
  const [regProfesi, setRegProfesi] = useState("Ahli Gizi");
  const [regNamaSPPG, setRegNamaSPPG] = useState("");
  const [regNoHp, setRegNoHp] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Admin Panel states
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

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
          const cloudKopLine1 = await loadStateFromCloud("kopLine1");
          const cloudKopLine2 = await loadStateFromCloud("kopLine2");
          const cloudKopLine3 = await loadStateFromCloud("kopLine3");
          const cloudKopLine4 = await loadStateFromCloud("kopLine4");
          const cloudKopLeftLogo = await loadStateFromCloud("kopLeftLogo");
          const cloudKopRightLogo = await loadStateFromCloud("kopRightLogo");
          const cloudCekGiziItems = await loadStateFromCloud("cekGiziItems");

          // Restore existing cloud states
          if (cloudProfile) setProfile(cloudProfile);
          if (cloudSekolah) setSekolahPM(cloudSekolah);
          if (cloudTigab) setTigaBPM(cloudTigab);
          if (cloudHarianPM) setHarianPM(cloudHarianPM);
          if (cloudMenu) setMasterMenu(cloudMenu);
          if (cloudFoodCost) setFoodCostDays(cloudFoodCost);
          if (cloudTkpi) setTkpiList(cloudTkpi);
          if (cloudCustomLogo) setCustomLogo(cloudCustomLogo);
          if (cloudKopLine1) setKopLine1(cloudKopLine1);
          if (cloudKopLine2) setKopLine2(cloudKopLine2);
          if (cloudKopLine3) setKopLine3(cloudKopLine3);
          if (cloudKopLine4) setKopLine4(cloudKopLine4);
          if (cloudKopLeftLogo) setKopLeftLogo(cloudKopLeftLogo);
          if (cloudKopRightLogo) setKopRightLogo(cloudKopRightLogo);
          if (cloudCekGiziItems) setCekGiziItems(cloudCekGiziItems);
          
          // Seed new cloud database if empty
          if (!cloudProfile) await saveStateToCloud("profile", profile);
          if (!cloudSekolah) await saveStateToCloud("sekolah", sekolahPM);
          if (!cloudTigab) await saveStateToCloud("tigab", tigaBPM);
          if (!cloudHarianPM) await saveStateToCloud("harianPM", harianPM);
          if (!cloudMenu) await saveStateToCloud("menu", masterMenu);
          if (!cloudFoodCost) await saveStateToCloud("foodCost", foodCostDays);
          if (!cloudTkpi) await saveStateToCloud("tkpi", tkpiList);
          if (!cloudCustomLogo) await saveStateToCloud("customLogo", customLogo);
          if (!cloudKopLine1) await saveStateToCloud("kopLine1", kopLine1);
          if (!cloudKopLine2) await saveStateToCloud("kopLine2", kopLine2);
          if (!cloudKopLine3) await saveStateToCloud("kopLine3", kopLine3);
          if (!cloudKopLine4) await saveStateToCloud("kopLine4", kopLine4);
          if (!cloudKopLeftLogo) await saveStateToCloud("kopLeftLogo", kopLeftLogo);
          if (!cloudKopRightLogo) await saveStateToCloud("kopRightLogo", kopRightLogo);
          if (!cloudCekGiziItems) await saveStateToCloud("cekGiziItems", cekGiziItems);
          
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

  useEffect(() => {
    localStorage.setItem("kop_line1", kopLine1);
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("kopLine1", kopLine1), 1500);
      return () => clearTimeout(timer);
    }
  }, [kopLine1, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("kop_line2", kopLine2);
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("kopLine2", kopLine2), 1500);
      return () => clearTimeout(timer);
    }
  }, [kopLine2, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("kop_line3", kopLine3);
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("kopLine3", kopLine3), 1500);
      return () => clearTimeout(timer);
    }
  }, [kopLine3, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("kop_line4", kopLine4);
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("kopLine4", kopLine4), 1500);
      return () => clearTimeout(timer);
    }
  }, [kopLine4, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("kop_left_logo", kopLeftLogo);
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("kopLeftLogo", kopLeftLogo), 1500);
      return () => clearTimeout(timer);
    }
  }, [kopLeftLogo, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("kop_right_logo", kopRightLogo);
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("kopRightLogo", kopRightLogo), 1500);
      return () => clearTimeout(timer);
    }
  }, [kopRightLogo, isCloudActive, isCloudLoading]);

  useEffect(() => {
    localStorage.setItem("sisper_cek_gizi_items", JSON.stringify(cekGiziItems));
    if (isCloudActive && !isCloudLoading) {
      const timer = setTimeout(() => saveStateToCloud("cekGiziItems", cekGiziItems), 1500);
      return () => clearTimeout(timer);
    }
  }, [cekGiziItems, isCloudActive, isCloudLoading]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400"></div>
        <p className="mt-4 text-xs font-semibold text-slate-400">Memuat Sistem GiziSync...</p>
      </div>
    );
  }

  // If user is not logged in, show beautiful GiziSync / SISPERMBG Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        {/* Decorative ambient backgrounds */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Logo brand matching Gambar Nomor 3 */}
          <div className="bg-white px-5 py-2.5 rounded-full inline-flex items-center shadow-lg font-sans text-[20px] font-black tracking-wide">
            <span className="text-[#0D6D41] font-bold">Gizi</span>
            <span className="text-[#2088C2] font-bold">Sync</span>
            <span className="text-[#A2B4FF] mx-1.5 font-normal">|</span>
            <span className="text-[#0D6D41] text-[15px] font-bold">Nutrition</span>
            <span className="text-[#626FFF] text-[15px] ml-1 font-bold">Synchronized</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-extrabold tracking-tight text-white">Sistem Perencanaan Makan</h1>
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Bergizi Gratis (SISPERMBG)</p>
          </div>

          <div className="w-full border-t border-slate-800 my-2"></div>

          <div className="text-slate-400 text-xs text-left space-y-3.5 w-full">
            <div className="flex items-start gap-3">
              <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md font-bold text-[10px] shrink-0">✓</span>
              <p><strong>Akses Multi-Tenant Terisolasi</strong>: Data harian, menu, dan rancangan pangan Anda aman terisolasi.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md font-bold text-[10px] shrink-0">✓</span>
              <p><strong>Rujukan TKPI 2020 Bersama</strong>: Akses database pangan terpadu nasional siap pakai.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md font-bold text-[10px] shrink-0">✓</span>
              <p><strong>Otomatisasi Juknis 2025</strong>: Sesuai regulasi terbaru porsi gizi Satuan Pelayanan.</p>
            </div>
          </div>

          <div className="w-full pt-2">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl transition duration-150 shadow-md flex items-center justify-center gap-2.5 border border-slate-200 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </button>

            <button
              type="button"
              onClick={simulateAdminLogin}
              className="w-full mt-3 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl transition duration-150 text-xs border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-[#E6004C]" />
              <span>Gunakan Sesi Demo (Bypass Login)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user profile is not registered in Firestore, show Registration Form
  if (userProfile?.isNotRegistered) {
    const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!regNama || !regNamaSPPG || !regNoHp) {
        alert("Mohon lengkapi seluruh kolom pendaftaran!");
        return;
      }
      setIsRegistering(true);
      try {
        await registerUser({
          namaLengkap: regNama,
          profesi: regProfesi,
          namaSPPG: regNamaSPPG,
          noHp: regNoHp
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsRegistering(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-white">Formulir Pendaftaran</h2>
            <p className="text-xs text-slate-400">Lengkapi data di bawah untuk memproses verifikasi tenant Anda</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs text-slate-200">
            <div className="space-y-1 text-left">
              <label className="font-bold text-slate-400">Email Akun (Google):</label>
              <input
                type="text"
                disabled
                value={user.email || ""}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 font-semibold focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="font-bold text-slate-300">Nama Lengkap (Sesuai KTP/Profesi):</label>
              <input
                type="text"
                required
                value={regNama}
                onChange={(e) => setRegNama(e.target.value)}
                placeholder="Contoh: dr. Syukri Yusuf, M.Gizi"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="font-bold text-slate-300">Profesi / Jabatan Anda:</label>
              <select
                value={regProfesi}
                onChange={(e) => setRegProfesi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Ahli Gizi">Ahli Gizi / Nutritionist</option>
                <option value="Pengelola SPPG">Pengelola Satuan Pelayanan (SPPG)</option>
                <option value="Kepala SPPG">Kepala Satuan Pelayanan</option>
                <option value="Tenaga Akuntansi">Tenaga Akuntansi / Keuangan</option>
                <option value="Staf Operasional">Staf Operasional Lapangan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1 text-left">
              <label className="font-bold text-slate-300">Nama SPPG / Instansi Anda:</label>
              <input
                type="text"
                required
                value={regNamaSPPG}
                onChange={(e) => setRegNamaSPPG(e.target.value)}
                placeholder="Contoh: SPPG Muna Barat Sawerigadi"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="font-bold text-slate-300">No. WhatsApp / Handphone Aktif:</label>
              <input
                type="text"
                required
                value={regNoHp}
                onChange={(e) => setRegNoHp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={signOutUser}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isRegistering}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl transition cursor-pointer shadow-md shadow-emerald-500/10 disabled:opacity-50"
              >
                {isRegistering ? "Memproses..." : "Daftar & Ajukan Verifikasi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Check if active period has expired
  const isExpired = (() => {
    if (!userProfile?.berakhirPada) return false;
    try {
      const now = new Date();
      const localYear = now.getFullYear();
      const localMonth = String(now.getMonth() + 1).padStart(2, '0');
      const localDay = String(now.getDate()).padStart(2, '0');
      const todayStr = `${localYear}-${localMonth}-${localDay}`;
      return todayStr > userProfile.berakhirPada;
    } catch (e) {
      console.error(e);
      return false;
    }
  })();

  // If user profile access has expired
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans select-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full inline-block mx-auto animate-pulse">
            <Clock className="w-10 h-10 text-rose-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Masa Login Berakhir</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mohon maaf, masa login/aktif akun Anda dengan email <strong className="text-rose-400">{user.email}</strong> telah berakhir pada <strong className="text-rose-400">{userProfile.berakhirPada}</strong>.
            </p>
          </div>

          <div className="bg-rose-950/30 p-3.5 border border-rose-900 rounded-xl text-[10px] text-rose-300 leading-relaxed">
            Akses Anda telah dinonaktifkan secara otomatis. Silakan hubungi Administrator Utama di email <strong className="text-white">Syukriyusuf82@gmail.com</strong> untuk melakukan perpanjangan masa aktif atau aktivasi ulang tenant Anda.
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={signOutUser}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs flex-1"
            >
              Keluar & Ganti Akun
            </button>
            <button
              onClick={refreshUserProfile}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer text-xs flex-1 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Segarkan Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is pending approval
  if (userProfile?.statusPersetujuan === "menunggu") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 bg-amber-500/10 text-amber-400 rounded-full inline-block mx-auto animate-pulse">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Menunggu Verifikasi Admin</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pendaftaran Anda dengan email <strong className="text-amber-400">{user.email}</strong> berhasil disimpan. Akun Anda sedang menunggu persetujuan dan pengaktifan oleh Admin Utama agar data Anda dapat terisolasi dengan aman.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-left text-[11px] space-y-1.5 text-slate-300">
            <div><span className="font-bold text-slate-500">Nama Lengkap:</span> {userProfile.namaLengkap}</div>
            <div><span className="font-bold text-slate-500">Profesi:</span> {userProfile.profesi}</div>
            <div><span className="font-bold text-slate-500">SPPG/Instansi:</span> {userProfile.namaSPPG}</div>
            <div><span className="font-bold text-slate-500">No. HP:</span> {userProfile.noHp}</div>
          </div>

          <div className="bg-indigo-950/50 p-3.5 border border-indigo-900 rounded-xl text-[10px] text-indigo-300 leading-relaxed">
            Silakan hubungi Admin Utama di email <strong className="text-white">Syukriyusuf82@gmail.com</strong> untuk mempercepat aktivasi Satuan Pelayanan Anda.
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={signOutUser}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
            >
              Keluar Akun
            </button>
            <button
              onClick={refreshUserProfile}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is blocked / diblokir
  if (userProfile?.statusPersetujuan === "diblokir") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6">
          <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full inline-block mx-auto">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Akses Akun Dinonaktifkan</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mohon maaf, akun Anda dengan email <strong className="text-rose-400">{user.email}</strong> saat ini ditangguhkan atau dinonaktifkan oleh Administrator Utama.
            </p>
          </div>

          <div className="bg-rose-950/30 p-3.5 border border-rose-900 rounded-xl text-[10px] text-rose-300 leading-relaxed">
            Silakan hubungi Admin Utama di email <strong className="text-white">Syukriyusuf82@gmail.com</strong> untuk informasi pengaktifan kembali tenant Anda.
          </div>

          <div className="pt-2">
            <button
              onClick={signOutUser}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
            >
              Keluar & Ganti Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <div className="bg-white px-3.5 py-1.5 rounded-full inline-flex items-center shadow-md font-sans text-[15px] font-black tracking-wide leading-none select-none">
                  <span className="text-[#0D6D41] font-extrabold">Gizi</span>
                  <span className="text-[#2088C2] font-extrabold">Sync</span>
                  <span className="text-[#A2B4FF] mx-1 font-normal text-sm">|</span>
                  <span className="text-[#0D6D41] text-[11px] font-extrabold">Nutrition</span>
                  <span className="text-[#626FFF] text-[11px] ml-0.5 font-extrabold">Synchronized</span>
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                SISPERMBG <span className="font-light text-slate-300">| Sistem Perencanaan Makan Bergizi Gratis</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile.namaLembaga} • {profile.alamat}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isCloudActive ? (
              <div className="flex flex-col items-end relative select-none">
                <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase leading-none mb-1">
                  PENGGUNA AKTIF
                </span>
                <div className="flex items-center gap-2 bg-rose-50/90 border border-rose-100/80 px-3 py-1.5 rounded-2xl shadow-sm">
                  {/* Avatar with Dentist/Nutritionist emoji */}
                  <div className="w-6 h-6 rounded-full bg-[#E5F6F0] border border-[#CBEFE3] flex items-center justify-center text-xs shrink-0 select-none shadow-inner">
                    👩‍⚕️
                  </div>
                  <span className="text-[#E6004C] font-extrabold text-xs tracking-tight">
                    {user?.email?.split("@")[0] || "syukriyusuf82"}
                  </span>
                  <button
                    type="button"
                    onClick={signOutUser}
                    title="Keluar Akun"
                    className="p-1 hover:bg-rose-100/60 rounded-lg text-[#E6004C] transition duration-150 ml-0.5 inline-flex items-center justify-center"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end relative select-none">
                <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase leading-none mb-1">
                  SINKRONISASI
                </span>
                <button
                  type="button"
                  disabled={isCloudLoading}
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm text-xs text-slate-700 font-extrabold transition disabled:opacity-50"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#3B4FEB] animate-pulse" />
                  <span>Masuk dengan Google</span>
                </button>
              </div>
            )}
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
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsAdminPanelOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                    activeTab === tab.id && !isAdminPanelOpen
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${tab.color}`} />
                  {tab.label}
                </button>
              );
            })}

            {userProfile?.peran === "ADMIN" && (
              <button
                id="tab-nav-admin"
                onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 border ${
                  isAdminPanelOpen
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100 hover:border-rose-200"
                }`}
              >
                <Lock className={`w-4 h-4 ${isAdminPanelOpen ? "text-white" : "text-rose-500 animate-pulse"}`} />
                Panel Admin
              </button>
            )}
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
      <main className={`flex-grow p-6 ${isAdminPanelOpen ? "max-w-full" : activeTab === "notalogistik" ? "max-w-full px-4 md:px-8" : activeTab === "foodcost" ? "max-w-[1600px]" : "max-w-7xl"} w-full mx-auto overflow-y-auto`}>
        {isAdminPanelOpen ? (
          <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
        ) : (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <DashboardOutputs
                  foodCostDays={foodCostDays}
                  tkpiList={tkpiList}
                  masterMenu={masterMenu}
                  harianPM={harianPM}
                  kopLine1={kopLine1}
                  setKopLine1={setKopLine1}
                  kopLine2={kopLine2}
                  setKopLine2={setKopLine2}
                  kopLine3={kopLine3}
                  setKopLine3={setKopLine3}
                  kopLine4={kopLine4}
                  setKopLine4={setKopLine4}
                  leftLogo={kopLeftLogo}
                  setLeftLogo={setKopLeftLogo}
                  rightLogo={kopRightLogo}
                  setRightLogo={setKopRightLogo}
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
            kopLine1={kopLine1}
            setKopLine1={setKopLine1}
            kopLine2={kopLine2}
            setKopLine2={setKopLine2}
            kopLine3={kopLine3}
            setKopLine3={setKopLine3}
            kopLine4={kopLine4}
            setKopLine4={setKopLine4}
            leftLogo={kopLeftLogo}
            setLeftLogo={setKopLeftLogo}
            rightLogo={kopRightLogo}
            setRightLogo={setKopRightLogo}
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
          <MasterMenuTab 
            menu={masterMenu} 
            onChange={setMasterMenu} 
            profile={profile} 
            customLogo={customLogo} 
            kopLine1={kopLine1}
            setKopLine1={setKopLine1}
            kopLine2={kopLine2}
            setKopLine2={setKopLine2}
            kopLine3={kopLine3}
            setKopLine3={setKopLine3}
            kopLine4={kopLine4}
            setKopLine4={setKopLine4}
            leftLogo={kopLeftLogo}
            setLeftLogo={setKopLeftLogo}
            rightLogo={kopRightLogo}
            setRightLogo={setKopRightLogo}
          />
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
            kopLine1={kopLine1}
            setKopLine1={setKopLine1}
            kopLine2={kopLine2}
            setKopLine2={setKopLine2}
            kopLine3={kopLine3}
            setKopLine3={setKopLine3}
            kopLine4={kopLine4}
            setKopLine4={setKopLine4}
            leftLogo={kopLeftLogo}
            setLeftLogo={setKopLeftLogo}
            rightLogo={kopRightLogo}
            setRightLogo={setKopRightLogo}
          />
        )}

        {activeTab === "cekgizi" && (
          <CekGiziTab 
            tkpiList={tkpiList} 
            items={cekGiziItems}
            setItems={setCekGiziItems}
            kopLine1={kopLine1}
            setKopLine1={setKopLine1}
            kopLine2={kopLine2}
            setKopLine2={setKopLine2}
            kopLine3={kopLine3}
            setKopLine3={setKopLine3}
            kopLine4={kopLine4}
            setKopLine4={setKopLine4}
            leftLogo={kopLeftLogo}
            setLeftLogo={setKopLeftLogo}
            rightLogo={kopRightLogo}
            setRightLogo={setKopRightLogo}
          />
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
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-4 px-6 mt-auto shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 max-w-full shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)] select-none">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
            <span className="font-extrabold text-slate-950">Syukri Odhe | Ahli Gizi</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">Sistem Perencanaan Menu Makan Bergizi Gratis</span>
          </div>
          <span className="italic text-[10px] text-slate-400">
            Dirancang untuk {profile.namaLembaga} • Juknis BGN No. 401.1/2025
          </span>
        </div>
      </footer>

      {/* AUTH ERROR IFRAME WARNING MODAL */}
      {authError && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-sans select-none">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100/60 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-snug">Otentikasi Google Terkendala</h3>
                <p className="text-[10px] text-rose-500 font-extrabold tracking-wider uppercase">Kebijakan Proteksi Iframe Browser</p>
              </div>
            </div>

            <div className="space-y-4 text-slate-600 text-xs leading-relaxed">
              <p>
                Browser Anda memblokir Google Sign-In pop-up karena aplikasi berjalan di dalam <strong>Iframe Google AI Studio</strong> (proteksi keamanan pihak ketiga).
              </p>

              <div className="bg-[#FFF4F7]/80 border border-rose-100/50 p-3.5 rounded-2xl text-slate-700">
                <p className="font-bold text-[#E6004C] mb-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E6004C]"></span>
                  Solusi Utama (Sangat Direkomendasikan):
                </p>
                <p className="text-[11px] text-slate-600 pl-3 leading-snug">
                  Klik tombol <strong>"Buka di Tab Baru" (Open in New Tab)</strong> di sudut kanan atas layar pratinjau AI Studio Anda untuk menjalankan sistem secara mandiri dengan lancar.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  Bypass Sesi Demo (Instan):
                </p>
                <p className="text-[11px] mb-3 text-slate-500 pl-3 leading-snug">
                  Gunakan simulasi admin lokal jika Anda hanya ingin menguji panel kontrol, sinkronisasi menu, dan database dengan cepat di dalam iframe.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    simulateAdminLogin();
                  }}
                  className="w-full py-2.5 px-3 bg-[#E6004C] hover:bg-[#c0003f] text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Aktifkan Sesi Demo syukriyusuf82</span>
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
