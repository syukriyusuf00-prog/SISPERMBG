import React, { useState } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  Settings, 
  Users, 
  Utensils, 
  DollarSign, 
  Layers, 
  FileText, 
  Search, 
  Database, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  Book,
  ClipboardList,
  Flame,
  Award
} from "lucide-react";

interface HandbookSection {
  id: string;
  title: string;
  category: "umum" | "panduan_fitur" | "gizi_standar";
  icon: any;
  content: React.ReactNode;
}

export default function HandbookTab() {
  const [activeSection, setActiveSection] = useState<string>("pengenalan");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const sections: HandbookSection[] = [
    {
      id: "pengenalan",
      title: "Pengenalan Sispber MBG",
      category: "umum",
      icon: Book,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
            <Award className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Sistem Informasi Perencanaan & Pengendalian Anggaran (Sispber MBG)</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Platform digital terintegrasi yang dirancang khusus untuk mendukung Satuan Pelayanan Program Gizi (SPPG) seluruh Indonesia dalam merencanakan menu, menghitung kebutuhan gizi, mengestimasi unit cost porsi, dan menghasilkan nota logistik pengadaan bahan pangan kotor secara presisi 100% berdasarkan petunjuk teknis resmi.
              </p>
            </div>
          </div>

          <h4 className="font-extrabold text-slate-800 text-sm border-b pb-1.5">🎯 Visi Utama Program</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Menyediakan makanan bergizi seimbang secara rutin untuk meningkatkan kualitas kesehatan anak sekolah, balita, ibu hamil, dan ibu menyusui guna menekan angka stunting nasional serta mempersiapkan generasi unggul Indonesia Emas 2045.
          </p>

          <h4 className="font-extrabold text-slate-800 text-sm border-b pb-1.5 mt-4">📋 3 Pilar Utama Sispber</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">01. Perencanaan Gizi</span>
              <p className="text-xs font-bold text-slate-800">Sesuai AKG Kemenkes</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Validasi kandungan makronutrien dan mikronutrien otomatis berdasarkan TKPI 2020.</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">02. Pengendalian Food Cost</span>
              <p className="text-xs font-bold text-slate-800">Efisiensi Anggaran</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Estimasi biaya porsi bersih vs kotor, termasuk buffer penyusutan logistik secara transparan.</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">03. Integrasi Logistik</span>
              <p className="text-xs font-bold text-slate-800">Otomatisasi Dokumen</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Ekspor Nota Pesanan Logistik dalam hitungan detik untuk kebutuhan dapur per hari atau gabungan.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "juknis_standar",
      title: "Standar & Juknis Gizi",
      category: "gizi_standar",
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Sesuai petunjuk teknis Badan Gizi Nasional No. 401.1/2025, setiap kelompok penerima manfaat memiliki target Angka Kecukupan Gizi (AKG) dan standar pemenuhan bahan makanan pokok yang telah disesuaikan:
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">Kelompok Penerima</th>
                  <th className="p-3">Energi (Kcal)</th>
                  <th className="p-3">Protein (gr)</th>
                  <th className="p-3">Lemak (gr)</th>
                  <th className="p-3">Karbohidrat (gr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600 font-mono">
                <tr>
                  <td className="p-3 font-sans font-extrabold text-slate-800">Usia Sekolah (Porsi Besar)</td>
                  <td className="p-3">650 - 850</td>
                  <td className="p-3">22 - 32</td>
                  <td className="p-3">18 - 28</td>
                  <td className="p-3">90 - 110</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-extrabold text-slate-800">Usia Sekolah (Porsi Kecil)</td>
                  <td className="p-3">450 - 550</td>
                  <td className="p-3">14 - 20</td>
                  <td className="p-3">12 - 18</td>
                  <td className="p-3">60 - 80</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-extrabold text-slate-800">Balita 3B (MP-ASI / Kecil)</td>
                  <td className="p-3">300 - 450</td>
                  <td className="p-3">8 - 12</td>
                  <td className="p-3">9 - 14</td>
                  <td className="p-3">40 - 55</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-extrabold text-slate-800">Ibu Hamil / Menyusui (3B Besar)</td>
                  <td className="p-3">750 - 950</td>
                  <td className="p-3">25 - 35</td>
                  <td className="p-3">22 - 32</td>
                  <td className="p-3">100 - 125</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-1.5">
            <h5 className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600" /> Catatan Penting Mengenai BDD & Berat Kotor (BK)
            </h5>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Dapur SPPG memesan bahan pangan dalam bentuk kotor (misalnya ayam utuh dengan tulang, wortel dengan ujung kulit). Perhitungan logistik menggunakan rumus: <br />
              <strong className="font-mono text-xs bg-white px-1 py-0.5 rounded border border-amber-200 mt-1 inline-block">Berat Kotor (BK) = Berat Bersih (BB) / (BDD%)</strong><br />
              Sispber secara otomatis menarik persentase BDD dari database TKPI 2020 Kemenkes namun tetap memberikan fleksibilitas kustomisasi di tabel Food Cost jika diperlukan.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "alur_aplikasi",
      title: "Panduan Fitur & Alur Kerja",
      category: "panduan_fitur",
      icon: ClipboardList,
      content: (
        <div className="space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Untuk merancang anggaran harian SPPG secara terstruktur, ikuti langkah-langkah di bawah ini:
          </p>

          <div className="space-y-4">
            <div className="relative pl-6 border-l-2 border-indigo-200 space-y-1">
              <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center">1</div>
              <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-500" /> Atur Profil & Tanggal Siklus
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Gunakan tab <strong>Profil SPPG</strong> untuk mendefinisikan identitas satuan pelayanan Anda, kapasitas produksi, dan tanggal mulai siklus menu. Tanggal pada laporan cetak akan otomatis sinkron dengan kalender siklus ini.
              </p>
            </div>

            <div className="relative pl-6 border-l-2 border-indigo-200 space-y-1">
              <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center">2</div>
              <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-500" /> Tentukan Jumlah Penerima Manfaat
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Di tab <strong>Penerima Manfaat</strong>, masukkan jumlah penerima riil (Sekolah, Balita, Bumil/Busui) di wilayah Anda. Data ini menjadi basis pengali kuantitas logistik harian.
              </p>
            </div>

            <div className="relative pl-6 border-l-2 border-indigo-200 space-y-1">
              <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center">3</div>
              <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-500" /> Periksa Master Menu 10 Hari Kerja
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Buka <strong>Master Menu</strong> untuk mengamati komponen karbohidrat, lauk hewani, lauk nabati, sayur, dan buah/susu untuk setiap hari. Anda bisa menyesuaikannya kapan saja.
              </p>
            </div>

            <div className="relative pl-6 border-l-2 border-indigo-200 space-y-1">
              <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center">4</div>
              <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-500" /> Susun Anggaran pada Food Cost
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Di tab <strong>Food Cost</strong>, Anda bisa memetakan bahan makanan ke basis data TKPI. <br />
                <span className="text-indigo-600 font-bold">✨ Fitur Unggulan:</span> Gunakan tombol <strong>"Salin ke Food Costing"</strong> untuk memetakan isi Master Menu secara otomatis ke bahan TKPI beserta berat rujukan porsinya. Hemat waktu hingga 95%!
              </p>
            </div>

            <div className="relative pl-6 border-l-2 border-indigo-200 space-y-1">
              <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center">5</div>
              <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-500" /> Cetak Nota Pesanan Logistik
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Laporan gabungan kebutuhan semua penerima manfaat harian atau akumulatif 10 hari kerja dapat diakses lewat tab <strong>Gabungan Semua Food Cost</strong>. Format cetak telah dioptimalkan agar presisi 100% dan rapi saat diekspor ke Excel maupun PDF.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "panduan_sppg",
      title: "Profil & Penerima Manfaat",
      category: "panduan_fitur",
      icon: Users,
      content: (
        <div className="space-y-3">
          <h4 className="font-extrabold text-slate-800 text-sm">Penyusunan Kapasitas SPPG</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data profil SPPG mencakup nama penanggung jawab, kontak, alamat, serta detail rekening bank. Selain itu, tab ini juga mengelola <strong>Kapasitas Dapur Utama</strong> untuk mengukur efisiensi kerja.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Jumlah Penerima Manfaat diatur secara terpisah untuk:
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1 leading-relaxed">
            <li><strong>Usia Sekolah</strong>: Porsi Besar (Siswa SD Kelas Tinggi, SMP, SMA) dan Porsi Kecil (Siswa PAUD, SD Kelas Rendah).</li>
            <li><strong>Kelompok 3B (Bumil, Busui, Balita)</strong>: Porsi Besar untuk Ibu Hamil & Menyusui, serta Porsi Kecil untuk Balita (usia MP-ASI).</li>
          </ul>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl mt-3">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase block">Kiat Cepat:</span>
            <p className="text-xs text-indigo-800 font-medium leading-relaxed">
              Jika ada perubahan jumlah sasaran penerima manfaat di hari tertentu (misalnya ada agenda kunjungan atau hari libur sebagian), Anda dapat menyesuaikan jumlah porsi sasaran khusus hari tersebut langsung pada input kustom di menu <strong>Food Cost</strong> tanpa mengubah basis data master profil!
            </p>
          </div>
        </div>
      )
    },
    {
      id: "nutrisi_tkpi",
      title: "TKPI & Sandbox Gizi",
      category: "gizi_standar",
      icon: Search,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Basis data pangan utama yang ditanamkan dalam aplikasi berasal dari <strong>Tabel Komposisi Pangan Indonesia (TKPI) Kemenkes RI</strong>.
          </p>

          <h4 className="font-extrabold text-slate-800 text-sm border-b pb-1">🔬 Fitur Database TKPI 2020</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Anda dapat melihat kandungan energi, protein, lemak, karbohidrat, besi (Fe), kalsium, vitamin A, vitamin C, dan serat untuk tiap 100g berat dapat dimakan (BDD) bahan makanan. Ada opsi kustomisasi harga per kilogram serta impor template Excel untuk pembaharuan massal.
          </p>

          <h4 className="font-extrabold text-slate-800 text-sm border-b pb-1">🧪 Kegunaan Sandbox Gizi</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sandbox Gizi adalah laboratorium uji coba menu bebas. Didesain agar ahli gizi SPPG dapat memasukkan berbagai bahan makanan dan porsinya secara acak untuk melihat total kalori dan kandungan makronutrien secara instan sebelum menu tersebut dipublikasikan ke Master Menu resmi.
          </p>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSec = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="space-y-6" id="handbook-tab-container">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center pointer-events-none pr-10">
          <Book className="w-48 h-48" />
        </div>
        <div className="max-w-xl relative z-10 space-y-1.5">
          <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider border border-indigo-400/20">
            Pusat Edukasi & Dokumentasi
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight font-sans">
            Buku Panduan & Petunjuk Teknis SPPG
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Panduan komparatif, alur navigasi fitur, regulasi zat gizi mikro/makro, dan langkah operasional penggunaan aplikasi Sispber MBG.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left sidebar navigation */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4 no-print">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold uppercase text-slate-400">Pencarian</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari topik panduan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-slate-400">Kategori Topik</h3>
            <div className="space-y-1.5">
              {filteredSections.map((sec) => {
                const IconComponent = sec.icon;
                const isSelected = sec.id === activeSection;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                      isSelected 
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" 
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-indigo-600 group-hover:scale-110 transition"}`} />
                      <span className="text-xs font-extrabold truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? "text-white rotate-90" : "text-slate-400 group-hover:translate-x-0.5"}`} />
                  </button>
                );
              })}
              {filteredSections.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Topik tidak ditemukan.</p>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Butuh bantuan teknis?</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">Jika menemui kendala dalam operasional, silakan hubungi tim IT BGN atau Pengawas SPPG Wilayah.</p>
            <a 
              href="https://bgn.go.id" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              Kunjungi Situs Resmi BGN <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              {React.createElement(selectedSec.icon, { className: "w-5 h-5" })}
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                {selectedSec.category === "umum" ? "Informasi Umum" : selectedSec.category === "panduan_fitur" ? "Panduan Operasional Fitur" : "Petunjuk Standar Gizi"}
              </span>
              <h3 className="text-base font-extrabold text-slate-800">
                {selectedSec.title}
              </h3>
            </div>
          </div>

          <div className="text-slate-700 leading-relaxed font-sans text-xs">
            {selectedSec.content}
          </div>
        </div>
      </div>
    </div>
  );
}
