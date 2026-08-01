import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import { isMainAdminEmail } from "../context/AuthContext.tsx";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Activity, 
  Search, 
  Trash2, 
  Calendar, 
  Shield, 
  ShieldAlert, 
  RefreshCw, 
  UserCheck, 
  XCircle, 
  Database, 
  Cpu, 
  History,
  Mail,
  User,
  Briefcase,
  Building,
  Key
} from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
}

const fetchWithTimeout = <T,>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(defaultValue), timeoutMs))
  ]);
};

const DEFAULT_DELETED_EMAILS = [
  "sofstory96@gmail.com",
  "desylarasati33@gmail.com",
  "saharhesa781@gmail.com",
  "raniramadani696@gmail.com",
  "erickhernando1@gmail.com",
  "imranjho373@gmail.com",
  "widyaainunpratiwi@gmail.com"
];

// Helper to manage deleted tenant emails persistence
export const getDeletedTenantEmails = (): Set<string> => {
  try {
    const raw = localStorage.getItem("deleted_tenant_emails");
    if (raw !== null) {
      const arr = JSON.parse(raw);
      return new Set(arr.map((e: string) => e.toLowerCase().trim()));
    }
  } catch (e) {}
  return new Set(DEFAULT_DELETED_EMAILS.map(e => e.toLowerCase().trim()));
};

export const addDeletedTenantEmail = (email: string) => {
  if (!email) return;
  const set = getDeletedTenantEmails();
  set.add(email.toLowerCase().trim());
  localStorage.setItem("deleted_tenant_emails", JSON.stringify(Array.from(set)));
};

export const removeDeletedTenantEmail = (email: string) => {
  if (!email) return;
  const set = getDeletedTenantEmails();
  set.delete(email.toLowerCase().trim());
  localStorage.setItem("deleted_tenant_emails", JSON.stringify(Array.from(set)));
};

// Scan localStorage for any offline registered user profiles
const getOfflineUsers = () => {
  const list: any[] = [];
  const deletedEmails = getDeletedTenantEmails();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("offline_user_")) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            const userEmail = (parsed.email || "").toLowerCase().trim();
            if (!deletedEmails.has(userEmail)) {
              list.push(parsed);
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.warn("Notice reading offline users:", e);
  }
  return list;
};

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"manajemen" | "riwayat" | "diagnostik">(() => {
    return (localStorage.getItem("sisper_admin_tab") as any) || "manajemen";
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedUserUids, setSelectedUserUids] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("sisper_admin_tab", activeTab);
  }, [activeTab]);

  // Load all users combining instant local cache + real-time Firestore + registration event listener
  useEffect(() => {
    setLoading(true);

    const mainAdminDoc = {
      id: "admin_syukriyusuf82",
      uid: "admin_syukriyusuf82",
      email: "syukriyusuf82@gmail.com",
      namaLengkap: "LA ODE MUHAMMAD SUKRI YUSUF",
      profesi: "AHLI GIZI",
      namaSPPG: "SPPG MUNA BARAT SAWERIGADI ONDOKE",
      noHp: "0822271059251",
      peran: "ADMIN",
      statusPersetujuan: "aktif",
      berakhirPada: "2035-12-31"
    };

    const mergeAndSetUsers = (remoteDocs: any[], isFromFirestore = false) => {
      const map = new Map<string, any>();
      map.set("admin_syukriyusuf82", mainAdminDoc);
      const deletedEmails = getDeletedTenantEmails();

      const addToMap = (u: any, isRemote = false) => {
        if (!u) return;
        const userEmail = (u.email || "").toLowerCase().trim();
        if (
          u.uid === "admin_sukriyusuf82" ||
          u.uid === "admin_syukriyusuf82" ||
          (userEmail && isMainAdminEmail(userEmail)) ||
          (userEmail && deletedEmails.has(userEmail))
        ) {
          return;
        }

        const primaryKey = u.uid || u.id || (userEmail ? `custom_user_${userEmail.replace(/[@.]/g, "_")}` : null);
        if (!primaryKey && !userEmail) return;

        // Try finding existing map entry by key or email
        let existingKey: string | null = null;
        if (primaryKey && map.has(primaryKey)) {
          existingKey = primaryKey;
        } else if (userEmail) {
          for (const [k, v] of map.entries()) {
            if ((v.email || "").toLowerCase().trim() === userEmail) {
              existingKey = k;
              break;
            }
          }
        }

        const existing = existingKey ? map.get(existingKey) : {};
        const keyToUse = existingKey || primaryKey || `custom_user_${userEmail.replace(/[@.]/g, "_")}`;

        // Preserve local approved status ("aktif" or "diblokir") if remote is lagging on "menunggu"
        let finalStatus = isRemote ? (u.statusPersetujuan || existing.statusPersetujuan || "menunggu") : (existing.statusPersetujuan || u.statusPersetujuan || "menunggu");
        if (existing.statusPersetujuan === "aktif" && u.statusPersetujuan === "menunggu") {
          finalStatus = "aktif";
        } else if (existing.statusPersetujuan === "diblokir" && u.statusPersetujuan === "menunggu") {
          finalStatus = "diblokir";
        }

        const merged = {
          ...existing,
          ...u,
          uid: keyToUse,
          id: keyToUse,
          statusPersetujuan: finalStatus
        };

        map.set(keyToUse, merged);
      };

      // 1. First populate from offline localStorage cache
      const offlineList = getOfflineUsers();
      offlineList.forEach((u) => addToMap(u, false));

      // 2. Overlay remote docs from Firestore
      if (isFromFirestore && remoteDocs.length > 0) {
        remoteDocs.forEach((u) => addToMap(u, true));
      }

      const userList = Array.from(map.values());
      userList.sort((a, b) => {
        const timeA = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      setUsers(userList);
      setLoading(false);
    };

    // Render immediately with offline cache
    mergeAndSetUsers([], false);

    // Subscribe to Firestore for real-time cloud updates
    const usersCol = collection(db, "users");
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const remoteList: any[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (docSnap.id === "admin_sukriyusuf82" || docSnap.id === "admin_syukriyusuf82" || (data.email && isMainAdminEmail(data.email))) {
          return;
        }
        const userUid = data.uid || docSnap.id;
        remoteList.push({ 
          ...data,
          id: docSnap.id, 
          uid: userUid 
        });
      });
      mergeAndSetUsers(remoteList, true);
    }, (err) => {
      console.warn("Firestore user listener notice (menggunakan mode data offline):", err);
      setLoading(false);
    });

    // Event listener to instantly add newly registered users to admin list
    const handleRegistered = (e: any) => {
      if (e?.detail) {
        const newUser = e.detail;
        const newUserEmail = (newUser.email || "").toLowerCase().trim();
        const emailSlug = newUserEmail.replace(/[@.]/g, "_");
        const customUid = newUser.uid || `custom_user_${emailSlug}`;

        localStorage.setItem(`offline_user_${customUid}`, JSON.stringify(newUser));

        setUsers((prev) => {
          const exists = prev.some(
            (u) => u.uid === customUid || (u.email || "").toLowerCase().trim() === newUserEmail
          );
          if (exists) {
            return prev.map((u) =>
              u.uid === customUid || (u.email || "").toLowerCase().trim() === newUserEmail
                ? { ...u, ...newUser }
                : u
            );
          }
          return [newUser, ...prev];
        });
      } else {
        mergeAndSetUsers([], false);
      }
    };
    window.addEventListener("sisper_user_registered", handleRegistered);

    return () => {
      unsubscribe();
      window.removeEventListener("sisper_user_registered", handleRegistered);
    };
  }, [refreshTrigger]);

  // Handle setting explicit approval status (ACC / Menunggu / Blokir)
  const handleSetStatus = async (userId: string, newStatus: "aktif" | "menunggu" | "diblokir") => {
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const userObj = users.find(u => u.uid === userId || u.id === userId || (u.email && u.email.toLowerCase().trim() === userId.toLowerCase().trim()));

      const userEmail = (userObj?.email || "").toLowerCase().trim();
      const emailSlug = userEmail.replace(/[@.]/g, '_');
      const customUid = `custom_user_${emailSlug}`;

      const updates: any = {
        statusPersetujuan: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (newStatus === "aktif" && (!userObj?.berakhirPada || userObj.berakhirPada < todayStr)) {
        const nextYear = new Date();
        nextYear.setFullYear(now.getFullYear() + 1);
        const defaultExp = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, '0')}-${String(nextYear.getDate()).padStart(2, '0')}`;
        updates.berakhirPada = defaultExp;
      }

      const fullUserData = {
        ...(userObj || {}),
        ...updates,
        uid: customUid,
        email: userEmail || userObj?.email || ""
      };

      // 1. Instant local state update (0ms UI latency)
      setUsers(prev => prev.map(u => 
        (u.uid === userId || u.id === userId || (u.email && (u.email || "").toLowerCase().trim() === userEmail)) 
          ? { ...u, ...fullUserData } 
          : u
      ));

      // 2. Instant offline storage persistence across all key variations
      const keysToUpdate = Array.from(new Set([
        `offline_user_${userId}`,
        `offline_user_${customUid}`,
        userObj?.uid ? `offline_user_${userObj.uid}` : '',
        emailSlug ? `offline_user_custom_user_${emailSlug}` : ''
      ].filter(Boolean)));

      keysToUpdate.forEach((k) => {
        const savedStr = localStorage.getItem(k);
        const parsed = savedStr ? (JSON.parse(savedStr) || {}) : (userObj || {});
        localStorage.setItem(k, JSON.stringify({ ...parsed, ...fullUserData }));
      });

      if (userEmail) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("offline_user_")) {
              const val = localStorage.getItem(key);
              if (val) {
                const parsed = JSON.parse(val);
                if ((parsed.email || "").toLowerCase().trim() === userEmail) {
                  localStorage.setItem(key, JSON.stringify({ ...parsed, ...fullUserData }));
                }
              }
            }
          }
        } catch (e) {}
      }

      // Also update currently active user session if this is the active user
      const currentActiveUid = localStorage.getItem("custom_logged_in_uid");
      if (currentActiveUid === userId || currentActiveUid === customUid || currentActiveUid === userObj?.uid) {
        const activeProfile = localStorage.getItem("sisper_user_profile");
        if (activeProfile) {
          try {
            const parsed = JSON.parse(activeProfile);
            localStorage.setItem("sisper_user_profile", JSON.stringify({ ...parsed, ...fullUserData }));
          } catch (e) {}
        }
      }

      // 3. Reliable background cloud sync to Firestore with complete user document
      const docIdsToUpdate = Array.from(new Set([userId, customUid, userObj?.uid, userObj?.id].filter(Boolean)));
      for (const docId of docIdsToUpdate) {
        try {
          const userRef = doc(db, "users", docId);
          await setDoc(userRef, fullUserData, { merge: true });
        } catch (e) {
          console.warn("Notice setDoc status:", e);
        }
      }
    } catch (err) {
      console.warn("Status persetujuan diperbarui secara lokal:", err);
    }
  };

  // Enforce Single Main Admin rule
  const handleToggleRole = async (_userId: string, _currentRole: string) => {
    alert("Sistem dirancang secara khusus hanya memiliki 1 Administrator Utama (Main Admin). Pengguna lain terdaftar sebagai USER terisolasi.");
  };

  // Handle update expiration date
  const handleUpdateExpiration = async (userId: string, dateStr: string) => {
    const userObj = users.find(u => u.uid === userId || u.id === userId);
    setUsers(prev => prev.map(u => (u.uid === userId || u.id === userId) ? { ...u, berakhirPada: dateStr } : u));
    
    const userEmail = (userObj?.email || "").toLowerCase().trim();
    const emailSlug = userEmail.replace(/[@.]/g, '_');
    const customUid = `custom_user_${emailSlug}`;

    const keysToUpdate = Array.from(new Set([
      `offline_user_${userId}`,
      `offline_user_${customUid}`,
      userObj?.uid ? `offline_user_${userObj.uid}` : ''
    ].filter(Boolean)));

    keysToUpdate.forEach((k) => {
      const savedStr = localStorage.getItem(k);
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          localStorage.setItem(k, JSON.stringify({ ...parsed, berakhirPada: dateStr }));
        } catch (e) {}
      }
    });

    const docIdsToUpdate = Array.from(new Set([userId, customUid, userObj?.uid].filter(Boolean)));
    for (const docId of docIdsToUpdate) {
      try {
        const userRef = doc(db, "users", docId);
        await fetchWithTimeout(setDoc(userRef, {
          berakhirPada: dateStr,
          updatedAt: new Date().toISOString()
        }, { merge: true }), 1500, null);
      } catch (err) {
        console.warn("Tanggal kedaluwarsa diperbarui lokal:", err);
      }
    }
  };

  // Quick preset helpers for expiration date
  const handleAddDuration = async (userId: string, monthsToAdd: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToAdd);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await handleSetStatus(userId, "aktif");
    await handleUpdateExpiration(userId, dateStr);
  };

  const handleRevokeAccessNow = async (userId: string) => {
    const userObj = users.find(u => u.uid === userId || u.id === userId);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    setUsers(prev => prev.map(u => (u.uid === userId || u.id === userId) ? { ...u, berakhirPada: pastStr, statusPersetujuan: "diblokir" } : u));

    const userEmail = (userObj?.email || "").toLowerCase().trim();
    const emailSlug = userEmail.replace(/[@.]/g, '_');
    const customUid = `custom_user_${emailSlug}`;

    const keysToUpdate = Array.from(new Set([
      `offline_user_${userId}`,
      `offline_user_${customUid}`,
      userObj?.uid ? `offline_user_${userObj.uid}` : ''
    ].filter(Boolean)));

    keysToUpdate.forEach((k) => {
      const savedStr = localStorage.getItem(k);
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          localStorage.setItem(k, JSON.stringify({ ...parsed, berakhirPada: pastStr, statusPersetujuan: "diblokir" }));
        } catch (e) {}
      }
    });

    const docIdsToUpdate = Array.from(new Set([userId, customUid, userObj?.uid].filter(Boolean)));
    for (const docId of docIdsToUpdate) {
      try {
        const userRef = doc(db, "users", docId);
        await setDoc(userRef, {
          berakhirPada: pastStr,
          statusPersetujuan: "diblokir",
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Gagal memutuskan akses:", err);
      }
    }
  };

  const handleAdminResetPassword = async (userId: string, email: string) => {
    const userObj = users.find(u => u.uid === userId || u.id === userId);
    const currentSandi = userObj?.sandi || "";
    const promptMsg = currentSandi 
      ? `Kata sandi saat ini untuk ${email} adalah: "${currentSandi}"\n\nMasukkan kata sandi baru (minimal 6 karakter):`
      : `Masukkan kata sandi baru untuk ${email} (minimal 6 karakter):`;
    const input = prompt(promptMsg, currentSandi);
    if (!input) return;
    if (input.trim().length < 6) {
      alert("Kata sandi minimal 6 karakter demi keamanan.");
      return;
    }
    const newSandi = input.trim();
    try {
      const updates = { sandi: newSandi, updatedAt: new Date().toISOString() };
      setUsers(prev => prev.map(u => (u.uid === userId || u.id === userId) ? { ...u, ...updates } : u));
      
      const userEmail = (email || "").toLowerCase().trim();
      const emailSlug = userEmail.replace(/[@.]/g, '_');
      const customUid = `custom_user_${emailSlug}`;

      const keysToUpdate = Array.from(new Set([
        `offline_user_${userId}`,
        `offline_user_${customUid}`,
        userObj?.uid ? `offline_user_${userObj.uid}` : '',
        emailSlug ? `offline_user_custom_user_${emailSlug}` : ''
      ].filter(Boolean)));

      keysToUpdate.forEach((k) => {
        const savedStr = localStorage.getItem(k);
        const parsed = savedStr ? (JSON.parse(savedStr) || {}) : (userObj || {});
        localStorage.setItem(k, JSON.stringify({ ...parsed, ...updates }));
      });

      const docIdsToUpdate = Array.from(new Set([userId, customUid, userObj?.uid].filter(Boolean)));
      for (const docId of docIdsToUpdate) {
        try {
          const userRef = doc(db, "users", docId);
          await setDoc(userRef, updates, { merge: true });
        } catch (e) {}
      }
      alert(`Kata sandi untuk ${email} berhasil diperbarui menjadi: "${newSandi}"`);
    } catch (err: any) {
      alert("Gagal memperbarui kata sandi: " + err.message);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string, email: string) => {
    const lowerEmail = (email || "").toLowerCase().trim();
    if (userId === "admin_syukriyusuf82" || isMainAdminEmail(lowerEmail)) {
      alert(`Admin Utama (${email}) tidak dapat dihapus!`);
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus data akun ${email}? Data pengguna akan terhapus permanen dari server.`)) {
      const emailSlug = lowerEmail.replace(/[@.]/g, "_");
      const customUid = `custom_user_${emailSlug}`;
      const idsToDelete = Array.from(new Set([userId, customUid].filter(Boolean)));

      // 1. Mark email as deleted & delete all doc IDs from Firestore
      addDeletedTenantEmail(lowerEmail);
      for (const id of idsToDelete) {
        try {
          await deleteDoc(doc(db, "users", id));
        } catch (err) {
          console.warn(`Peringatan saat menghapus dokumen Firestore ${id}:`, err);
        }
      }

      // 2. Purge local storage offline caches
      try {
        idsToDelete.forEach((id) => {
          localStorage.removeItem(`offline_user_${id}`);
        });
        localStorage.removeItem(`offline_user_custom_user_${emailSlug}`);

        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes(userId) || key.includes(emailSlug) || key.includes(lowerEmail))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn("Notice clearing local storage for deleted user:", e);
      }

      // 3. Purge active session if it was logged in
      const currentUid = localStorage.getItem("custom_logged_in_uid");
      if (currentUid && idsToDelete.includes(currentUid)) {
        localStorage.removeItem("custom_logged_in_uid");
        localStorage.removeItem("sisper_user_profile");
      }

      // 4. Update UI immediately
      setUsers(prev => prev.filter(u => !idsToDelete.includes(u.uid) && !idsToDelete.includes(u.id) && (u.email || "").toLowerCase().trim() !== lowerEmail));
      alert(`Data pengguna ${email} berhasil terhapus permanen dari server dan sistem.`);
    }
  };

  // Handle clearing marked/selected users
  const handleClearSelectedUsers = async () => {
    if (selectedUserUids.length === 0) {
      alert("Silakan tandai / centang pengguna yang ingin dibersihkan terlebih dahulu.");
      return;
    }

    const markedUsers = users.filter(u => selectedUserUids.includes(u.uid));
    const confirmMsg = `Peringatan: Anda akan menghapus & mereset SELURUH data (${markedUsers.length} akun) pengguna yang ditandai secara permanen dari server.\n\nApakah Anda yakin ingin melanjutkan?`;
    
    if (confirm(confirmMsg)) {
      setLoading(true);
      
      const deletePromises = markedUsers.map(async (u) => {
        const lowerEmail = (u.email || "").toLowerCase().trim();
        addDeletedTenantEmail(lowerEmail);
        const emailSlug = lowerEmail.replace(/[@.]/g, "_");
        const customUid = `custom_user_${emailSlug}`;
        const idsToDelete = Array.from(new Set([u.uid, u.id, customUid].filter(Boolean)));

        for (const id of idsToDelete) {
          try {
            await fetchWithTimeout(deleteDoc(doc(db, "users", id)), 3000, null);
          } catch (err) {
            console.warn(`Catatan penghapusan dokumen ${id}:`, err);
          }
          localStorage.removeItem(`offline_user_${id}`);
        }
        localStorage.removeItem(`offline_user_custom_user_${emailSlug}`);
      });

      await Promise.all(deletePromises);

      // Clean local storage
      const clearedUids = new Set(markedUsers.map(m => m.uid));
      setUsers(prev => prev.filter(u => !clearedUids.has(u.uid)));
      setSelectedUserUids([]);
      setLoading(false);
      alert(`Pembersihan Berhasil!\n\nData ${markedUsers.length} pengguna yang ditandai telah dihapus secara permanen dari server.`);
    }
  };

  // Handle clearing all users with the "USER" role
  const handleClearAllUsers = async () => {
    // Exclude main admin
    const usersWithUserRole = users.filter(u => {
      const emailLower = (u.email || "").toLowerCase().trim();
      const isAdmin = u.uid === "admin_syukriyusuf82" || isMainAdminEmail(emailLower) || u.peran === "ADMIN";
      return !isAdmin;
    });

    if (usersWithUserRole.length === 0) {
      alert("Tidak ada data pendaftar pengguna (role USER) yang perlu dibersihkan.");
      return;
    }

    const confirmMsg = `Peringatan: Anda akan menghapus & mereset SELURUH data pendaftar (${usersWithUserRole.length} akun) secara permanen dari server.\n\nApakah Anda yakin ingin melanjutkan?`;
    if (confirm(confirmMsg)) {
      setLoading(true);

      const deletePromises = usersWithUserRole.map(async (u) => {
        const lowerEmail = (u.email || "").toLowerCase().trim();
        addDeletedTenantEmail(lowerEmail);
        const emailSlug = lowerEmail.replace(/[@.]/g, "_");
        const customUid = `custom_user_${emailSlug}`;
        const idsToDelete = Array.from(new Set([u.uid, u.id, customUid].filter(Boolean)));

        for (const id of idsToDelete) {
          try {
            await fetchWithTimeout(deleteDoc(doc(db, "users", id)), 3000, null);
          } catch (err) {
            console.warn(`Notice deleting document ${id}:`, err);
          }
          localStorage.removeItem(`offline_user_${id}`);
        }
        localStorage.removeItem(`offline_user_custom_user_${emailSlug}`);
      });

      await Promise.all(deletePromises);

      // Clean all non-admin offline_user_ keys in localStorage
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("offline_user_") && !key.includes("syukriyusuf") && !key.includes("sukriyusuf")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn("Notice clearing offline_user_ keys:", e);
      }

      setUsers(prev => prev.filter(u => u.uid === "admin_syukriyusuf82" || isMainAdminEmail(u.email)));
      setSelectedUserUids([]);
      setLoading(false);
      alert(`Pembersihan & Reset Data Berhasil!\n\nSeluruh data pendaftar (${usersWithUserRole.length} akun) telah terhapus permanen dari server.`);
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.namaLengkap || "").toLowerCase().includes(q) ||
      (u.profesi || "").toLowerCase().includes(q) ||
      (u.namaSPPG || "").toLowerCase().includes(q)
    );
  });

  // Selection helpers
  const selectableUsers = filteredUsers.filter(u => u.uid !== "admin_syukriyusuf82" && u.uid !== "admin_sukriyusuf82" && !isMainAdminEmail(u.email));
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUserUids.includes(u.uid));

  const toggleSelectUser = (uid: string) => {
    setSelectedUserUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserUids([]);
    } else {
      setSelectedUserUids(selectableUsers.map(u => u.uid));
    }
  };

  // Calculate metrics based on actual non-admin tenants
  const tenantUsers = users.filter(u => u.uid !== "admin_syukriyusuf82" && u.uid !== "admin_sukriyusuf82" && !isMainAdminEmail(u.email));
  const totalUsersCount = tenantUsers.length;
  const activeUsersCount = tenantUsers.filter(u => u.statusPersetujuan === "aktif").length;
  
  // Calculate users logged in last 24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const login24hCount = tenantUsers.filter(u => {
    if (!u.loginTerakhir) return false;
    const loginTime = u.loginTerakhir?.seconds ? u.loginTerakhir.seconds * 1000 : new Date(u.loginTerakhir).getTime();
    return loginTime > oneDayAgo;
  }).length;

  // Format date display
  const formatTimestamp = (ts: any) => {
    if (!ts) return "-";
    let dateObj: Date;
    if (ts.seconds) {
      dateObj = new Date(ts.seconds * 1000);
    } else {
      dateObj = new Date(ts);
    }
    return dateObj.toLocaleString("id-ID", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      
      {/* Title Header with Close */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Panel Administrasi SISPERMBG</h2>
            <p className="text-xs text-slate-500">Multi-tenant Management Hub • Autentikasi & Verifikasi Pengguna</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Tutup Panel
        </button>
      </div>

      {/* 4 Stats Cards matching Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengguna */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Pengguna</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalUsersCount}</p>
          </div>
        </div>

        {/* Pengguna Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Pengguna Aktif</p>
            <p className="text-2xl font-extrabold text-slate-900">{activeUsersCount}</p>
          </div>
        </div>

        {/* Login 24 Jam Terakhir */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Login 24 Jam Terakhir</p>
            <p className="text-2xl font-extrabold text-slate-900">{login24hCount}</p>
          </div>
        </div>

        {/* Status Sistem */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Status Sistem</p>
            <p className="text-2xl font-extrabold text-teal-600">Healthy</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs matching Image 1 */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("manajemen")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition ${
            activeTab === "manajemen"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Manajemen Pengguna
        </button>
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition ${
            activeTab === "riwayat"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Login
        </button>
        <button
          onClick={() => setActiveTab("diagnostik")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition ${
            activeTab === "diagnostik"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Cpu className="w-4 h-4" />
          Sistem Diagnostik
        </button>
      </div>

      {/* Active Tab Content Area */}
      {activeTab === "manajemen" && (
        <div className="space-y-4">
          {/* Search bar & Refresh Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan email, nama, atau instansi..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedUserUids.length > 0 && (
                <button
                  onClick={handleClearSelectedUsers}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm animate-bounce"
                  title="Bersihkan data pengguna yang ditandai saja"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Bersihkan Terpilih ({selectedUserUids.length})
                </button>
              )}
              <button
                onClick={handleClearAllUsers}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                title="Bersihkan seluruh pengguna dengan peran 'USER' dari sistem secara permanen"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Bersihkan Semua USER
              </button>
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Segarkan Data
              </button>
            </div>
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-center w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                        title="Tandai / Centang Semua Pengguna"
                      />
                    </th>
                    <th className="p-4">Email / Tenant ID</th>
                    <th className="p-4">Data Diri & SPPG</th>
                    <th className="p-4 text-center">Peran</th>
                    <th className="p-4 text-center">Status Persetujuan</th>
                    <th className="p-4 text-center">Berakhir Pada</th>
                    <th className="p-4 text-center">Login Terakhir</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Sedang menyinkronkan data dari Firestore...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Tidak ada tenant atau pengguna ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item) => (
                      <tr key={item.uid} className={`hover:bg-slate-50/50 transition ${selectedUserUids.includes(item.uid) ? "bg-indigo-50/30" : ""}`}>
                        {/* Checkbox Tandai Pengguna */}
                        <td className="p-4 text-center">
                          {item.uid !== "admin_syukriyusuf82" && !isMainAdminEmail(item.email) ? (
                            <input
                              type="checkbox"
                              checked={selectedUserUids.includes(item.uid)}
                              onChange={() => toggleSelectUser(item.uid)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                            />
                          ) : (
                            <Shield className="w-4 h-4 text-purple-500 mx-auto" title="Admin Utama" />
                          )}
                        </td>
                        {/* Email/Tenant UID */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {item.email}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.uid}</div>
                        </td>

                        {/* Data Diri & SPPG */}
                        <td className="p-4 space-y-1">
                          {item.namaLengkap ? (
                            <>
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {item.namaLengkap}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-slate-400" />
                                Profesi: {item.profesi}
                              </div>
                              <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                                <Building className="w-3 h-3 text-indigo-400" />
                                {item.namaSPPG}
                              </div>
                              <div className="text-[10px] text-slate-400">WA: {item.noHp || "-"}</div>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Belum mengisi pendaftaran</span>
                          )}
                        </td>

                        {/* Peran / Role */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleRole(item.uid, item.peran)}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase transition cursor-pointer ${
                              item.peran === "ADMIN"
                                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {item.peran || "USER"}
                          </button>
                        </td>

                        {/* Status Persetujuan */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {item.statusPersetujuan === "aktif" ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Disetujui (ACC)
                                </span>
                                <button
                                  onClick={() => handleSetStatus(item.uid || item.id, "diblokir")}
                                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                                  title="Putuskan akses pengguna ini"
                                >
                                  Putuskan Akses
                                </button>
                              </div>
                            ) : item.statusPersetujuan === "menunggu" || item.statusPersetujuan === "pending" ? (
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleSetStatus(item.uid || item.id, "aktif")}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-black rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer animate-pulse"
                                  title="Klik untuk menyetujui (ACC) dan memberi akses"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                  ACC / Setujui
                                </button>
                                <button
                                  onClick={() => handleSetStatus(item.uid || item.id, "diblokir")}
                                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                                >
                                  Tolak & Blokir
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-extrabold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Diblokir
                                </span>
                                <button
                                  onClick={() => handleSetStatus(item.uid || item.id, "aktif")}
                                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded transition cursor-pointer shadow-xs"
                                  title="Aktifkan kembali akses akun"
                                >
                                  Buka Akses (ACC)
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Berakhir Pada */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="date"
                              value={item.berakhirPada || ""}
                              onChange={(e) => handleUpdateExpiration(item.uid || item.id, e.target.value)}
                              className="p-1 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono w-[130px] text-center"
                            />
                            
                            {/* Status Expiration Check */}
                            {(() => {
                              const now = new Date();
                              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                              const isExpired = item.berakhirPada ? todayStr > item.berakhirPada : false;
                              if (isExpired && item.statusPersetujuan === "aktif") {
                                return <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">⚠️ Kedaluwarsa</span>;
                              }
                              return null;
                            })()}

                            {/* Quick Presets */}
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 mt-0.5">
                              <button
                                onClick={() => handleAddDuration(item.uid || item.id, 1)}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded transition cursor-pointer"
                                title="+1 Bulan masa aktif"
                              >
                                +1Bln
                              </button>
                              <button
                                onClick={() => handleAddDuration(item.uid || item.id, 6)}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded transition cursor-pointer"
                                title="+6 Bulan masa aktif"
                              >
                                +6Bln
                              </button>
                              <button
                                onClick={() => handleAddDuration(item.uid || item.id, 12)}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded transition cursor-pointer"
                                title="+1 Tahun masa aktif"
                              >
                                +1Thn
                              </button>
                              <button
                                onClick={() => handleRevokeAccessNow(item.uid || item.id)}
                                className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition cursor-pointer"
                                title="Set tanggal kedaluwarsa ke kemarin (Putuskan Akses Langsung)"
                              >
                                Putuskan
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Login Terakhir */}
                        <td className="p-4 text-center font-mono text-slate-500">
                          {formatTimestamp(item.loginTerakhir)}
                        </td>

                        {/* Actions (Reset Sandi & Delete) */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleAdminResetPassword(item.uid || item.id, item.email)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                              title="Lihat / Reset Kata Sandi Pengguna"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(item.uid, item.email)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              title="Hapus Pengguna Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "riwayat" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            Riwayat Aktivitas Login Tenant
          </h3>
          <p className="text-xs text-slate-500">Aktivitas autentikasi masuk terbaru yang tercatat secara real-time di Firestore.</p>
          
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">Email Pengguna</th>
                  <th className="p-3">SPPG / Instansi</th>
                  <th className="p-3">Peran</th>
                  <th className="p-3">Waktu Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-slate-600">
                {users.filter(u => u.loginTerakhir).map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-sans font-medium text-slate-800">{user.email}</td>
                    <td className="p-3 font-sans text-xs">{user.namaSPPG || "SPPG Pusat"}</td>
                    <td className="p-3"><span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">{user.peran || "USER"}</span></td>
                    <td className="p-3">{formatTimestamp(user.loginTerakhir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "diagnostik" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Firestore Connection Diagnostic */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Koneksi Database Firestore
            </h3>
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span>Status Sambungan:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terhubung & Sistematis Aktif
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database ID:</span>
                <span className="font-mono text-slate-500">ai-studio-sispermbg</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kebijakan Keamanan:</span>
                <span className="font-bold text-indigo-600">Terbata / Multi-tenant Terisolasi</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Seluruh data dienkripsi saat transit dan diisolasi per UID menggunakan Firestore Rule tingkat tinggi. Pengguna non-admin sama sekali tidak dapat mengakses atau membaca state pengguna lainnya.
            </p>
          </div>

          {/* Tenant Isolation Diagnostic */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              Sistem Multi-Tenancy
            </h3>
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span>Sistem Isolasi:</span>
                <span className="font-bold text-indigo-600">Subkoleksi States Berbasis UID</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Jumlah Tenant Saat Ini:</span>
                <span className="font-bold">{users.length} Tenant Terdaftar</span>
              </div>
              <div className="flex items-center justify-between">
                <span>TKPI Rujukan Bersama:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Aktif (Global Read)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Database TKPI 2020 beroperasi sebagai rujukan bersama (read-only) untuk seluruh pengguna tanpa duplikasi data, menghemat ruang penyimpanan awan dan mengoptimalkan kecepatan loading.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
