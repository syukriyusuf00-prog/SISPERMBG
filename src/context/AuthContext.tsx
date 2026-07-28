import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { auth, googleAuthProvider, db, handleFirestoreError, OperationType } from "../lib/firebase.ts";

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  isCloudActive: boolean;
  saveStateToCloud: (key: string, data: any) => Promise<void>;
  loadStateFromCloud: (key: string) => Promise<any | null>;
  registerUser: (formData: { namaLengkap: string; profesi: string; namaSPPG: string; noHp: string }) => Promise<void>;
  registerCustomUser: (formData: {
    namaLengkap: string;
    email: string;
    profesi: string;
    namaSPPG: string;
    sandi: string;
  }) => Promise<void>;
  registerThreeRoles: (data: {
    namaSPPG: string;
    sandi: string;
    roles: Array<{ namaLengkap: string; email: string; noHp: string; profesi: string }>;
  }) => Promise<void>;
  loginWithEmailPassword: (email: string, sandi?: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  simulateAdminLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const isMainAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return lower === "syukriyusuf82@gmail.com" || lower === "sukriyusuf82@gmail.com" || lower === "syukriyusuf00@gmail.com";
};

const fetchWithTimeout = <T,>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(defaultValue), timeoutMs))
  ]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const customUid = localStorage.getItem("custom_logged_in_uid");
    if (customUid) {
      const savedProfile = localStorage.getItem("sisper_user_profile");
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          return {
            uid: customUid,
            email: profile.email,
            displayName: profile.namaLengkap,
            emailVerified: true
          } as any;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState<any | null>(() => {
    const savedProfile = localStorage.getItem("sisper_user_profile");
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const updateSession = (currentUser: User | null, profile: any | null) => {
    setUser(currentUser);
    setUserProfile(profile);
    if (currentUser && profile) {
      localStorage.setItem("custom_logged_in_uid", currentUser.uid);
      localStorage.setItem("sisper_user_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("custom_logged_in_uid");
      localStorage.removeItem("sisper_user_profile");
    }
  };

  const fetchUserProfile = async (currentUser: User) => {
    const lowerEmail = currentUser.email?.toLowerCase();
    const isMainAdmin = isMainAdminEmail(lowerEmail);
    const userRef = doc(db, "users", currentUser.uid);
    const path = `users/${currentUser.uid}`;
    const mainAdminPhone = "0822271059251";

    if (isMainAdmin) {
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.peran !== "ADMIN" || data.statusPersetujuan !== "aktif") {
            // Document exists but does not have active ADMIN role, update it!
            await setDoc(userRef, {
              peran: "ADMIN",
              statusPersetujuan: "aktif",
              namaLengkap: data.namaLengkap || "LA ODE MUHAMMAD SUKRI YUSUF",
              profesi: data.profesi || "Administrator Utama",
              namaSPPG: data.namaSPPG || "SPPG MUNA BARAT SAWERIGADI ONDOKE",
              noHp: data.noHp || mainAdminPhone,
              berakhirPada: "2035-12-31",
              updatedAt: serverTimestamp(),
              loginTerakhir: serverTimestamp()
            }, { merge: true });
            const snap = await getDoc(userRef);
            updateSession(currentUser, snap.data());
          } else {
            // Already active ADMIN, just update login timestamp
            await setDoc(userRef, {
              loginTerakhir: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
            const snap = await getDoc(userRef);
            updateSession(currentUser, snap.data());
          }
        } else {
          // Document does not exist yet, create it!
          const adminProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "syukriyusuf82@gmail.com",
            namaLengkap: "LA ODE MUHAMMAD SUKRI YUSUF",
            profesi: "Administrator Utama",
            namaSPPG: "SPPG MUNA BARAT SAWERIGADI ONDOKE",
            noHp: mainAdminPhone,
            peran: "ADMIN" as const,
            statusPersetujuan: "aktif" as const,
            berakhirPada: "2035-12-31",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            loginTerakhir: serverTimestamp()
          };
          await setDoc(userRef, adminProfile);
          const snap = await getDoc(userRef);
          updateSession(currentUser, snap.data());
        }
      } catch (err) {
        console.error("Error setting up main admin profile:", err);
        updateSession(currentUser, {
          uid: currentUser.uid,
          email: currentUser.email || "syukriyusuf82@gmail.com",
          namaLengkap: "LA ODE MUHAMMAD SUKRI YUSUF",
          profesi: "Administrator Utama",
          namaSPPG: "SPPG MUNA BARAT SAWERIGADI ONDOKE",
          noHp: mainAdminPhone,
          peran: "ADMIN",
          statusPersetujuan: "aktif",
          berakhirPada: "2035-12-31"
        });
      }
      return;
    }

    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        updateSession(currentUser, data);
        
        // Update last login
        try {
          await setDoc(userRef, {
            loginTerakhir: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          // Fetch updated data to include the server timestamp updates
          const updatedSnap = await getDoc(userRef);
          updateSession(currentUser, updatedSnap.data());
        } catch (timestampErr) {
          console.warn("Gagal memperbarui login terakhir di awan:", timestampErr);
        }
      } else {
        // Normal user: Needs registration
        updateSession(currentUser, {
          uid: currentUser.uid,
          email: currentUser.email || "",
          isNotRegistered: true
        });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Fallback local setting to prevent lock out in case of rules delay
      updateSession(currentUser, {
        uid: currentUser.uid,
        email: currentUser.email || "",
        isNotRegistered: true
      });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const simulatedEmail = localStorage.getItem("simulated_user_email");
      if (simulatedEmail === "syukriyusuf82@gmail.com" || simulatedEmail === "sukriyusuf82@gmail.com") {
        updateSession({
          uid: "admin_sukriyusuf82",
          email: "sukriyusuf82@gmail.com",
          displayName: "Syukri Yusuf (Admin)",
          emailVerified: true
        } as any, {
          uid: "admin_sukriyusuf82",
          email: "sukriyusuf82@gmail.com",
          namaLengkap: "Syukri Yusuf (Admin)",
          profesi: "Administrator Utama",
          namaSPPG: "Pusat Gizi SPPG",
          noHp: "0822271059251",
          sandi: "Odhe@1998",
          peran: "ADMIN",
          statusPersetujuan: "aktif",
          berakhirPada: "2030-12-31"
        });
        setLoading(false);
        return;
      }

      let customUid = localStorage.getItem("custom_logged_in_uid");

      if (customUid) {
        if (customUid === "admin_sukriyusuf82" || customUid === "admin_syukriyusuf82" || customUid === "syukriyusuf82_simulated_uid") {
          const isSukri = customUid === "admin_sukriyusuf82";
          const finalEmail = isSukri ? "sukriyusuf82@gmail.com" : "syukriyusuf82@gmail.com";
          updateSession({
            uid: customUid,
            email: finalEmail,
            displayName: "Syukri Yusuf (Admin)",
            emailVerified: true
          } as any, {
            uid: customUid,
            email: finalEmail,
            namaLengkap: "Syukri Yusuf (Admin)",
            profesi: "Administrator Utama",
            namaSPPG: "Pusat Gizi SPPG",
            noHp: "0822271059251",
            sandi: "Odhe@1998",
            peran: "ADMIN",
            statusPersetujuan: "aktif",
            berakhirPada: "2030-12-31"
          });
          setLoading(false);
          return;
        }

        // Fast load from saved local profile
        const savedProfile = localStorage.getItem("sisper_user_profile");
        if (savedProfile) {
          try {
            const data = JSON.parse(savedProfile);
            updateSession({
              uid: customUid,
              email: data.email,
              displayName: data.namaLengkap,
              emailVerified: true
            } as any, data);
          } catch (e) {
            console.warn("Gagal parsing profil lokal:", e);
          }
        }

        // Instantly unblock loading screen so app opens without delay
        setLoading(false);

        // Background profile verification with 800ms fast timeout
        fetchWithTimeout(getDoc(doc(db, "users", customUid)), 800, null)
          .then((snap: any) => {
            if (snap && snap.exists()) {
              const data = snap.data();
              updateSession({
                uid: customUid,
                email: data.email,
                displayName: data.namaLengkap,
                emailVerified: true
              } as any, data);
            }
          })
          .catch((e) => {
            console.warn("Gagal memuat profil awan secara asinkron:", e);
          });

        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          await fetchUserProfile(currentUser);
        } else {
          if (!localStorage.getItem("custom_logged_in_uid")) {
            updateSession(null, null);
          }
        }
        setLoading(false);
      });
      return unsubscribe;
    };

    let unsub: any;
    initAuth().then((fn) => {
      unsub = fn;
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Real-time synchronization of user profile status and expiration date from Firestore
  useEffect(() => {
    const activeUid = userProfile?.uid || user?.uid || localStorage.getItem("custom_logged_in_uid");
    if (!activeUid) return;

    // Skip snapshot listener for local simulated admin override or main admin
    if (activeUid === "admin_sukriyusuf82" || activeUid === "admin_syukriyusuf82" || isMainAdminEmail(userProfile?.email)) {
      return;
    }

    try {
      const userRef = doc(db, "users", activeUid);
      const unsubscribe = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const freshData = snap.data();
          
          // Check expiration
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const isExpired = freshData.berakhirPada ? todayStr > freshData.berakhirPada : false;

          if (freshData.statusPersetujuan === "diblokir" || freshData.statusPersetujuan === "menunggu" || isExpired) {
            signOutUser();
            setAuthError(
              isExpired
                ? `Masa aktif akun Anda telah berakhir pada ${freshData.berakhirPada}. Silakan hubungi admin untuk memperpanjang.`
                : freshData.statusPersetujuan === "menunggu"
                ? `Status akun Anda berada dalam DAFTAR TUNGGU (menunggu persetujuan Admin).`
                : "Akses akun Anda telah diputuskan/diblokir oleh Administrator."
            );
          } else {
            setUserProfile((prev: any) => {
              if (!prev) return freshData;
              if (
                prev.statusPersetujuan !== freshData.statusPersetujuan ||
                prev.berakhirPada !== freshData.berakhirPada ||
                prev.peran !== freshData.peran ||
                prev.namaLengkap !== freshData.namaLengkap ||
                prev.namaSPPG !== freshData.namaSPPG
              ) {
                const updated = { ...prev, ...freshData };
                localStorage.setItem("sisper_user_profile", JSON.stringify(updated));
                return updated;
              }
              return prev;
            });
          }
        } else {
          // User document removed or reset by Admin in Firestore -> Immediate real-time force logout
          if (!isMainAdminEmail(userProfile?.email)) {
            signOutUser();
            setAuthError("Data akun Anda telah direset/dihapus oleh Administrator. Silakan melakukan pendaftaran ulang dengan email Anda.");
          }
        }
      }, (err) => {
        console.warn("User profile onSnapshot listener notice:", err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not attach user profile onSnapshot:", err);
    }
  }, [userProfile?.uid, user?.uid]);

  const simulateAdminLogin = () => {
    setLoading(true);
    const adminUid = "admin_sukriyusuf82";
    updateSession({
      uid: adminUid,
      email: "sukriyusuf82@gmail.com",
      displayName: "Syukri Yusuf (Admin)",
      emailVerified: true
    } as any, {
      uid: adminUid,
      email: "sukriyusuf82@gmail.com",
      namaLengkap: "Syukri Yusuf (Admin)",
      profesi: "Administrator Utama",
      namaSPPG: "Pusat Gizi SPPG",
      noHp: "0822271059251",
      sandi: "Odhe@1998",
      peran: "ADMIN",
      statusPersetujuan: "aktif",
      berakhirPada: "2030-12-31"
    });
    setAuthError(null);
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      console.error("Google Sign-In failed:", error);
      setLoading(false);
      let friendlyError = error?.code || error?.message || String(error);
      if (error?.code === "auth/network-request-failed" || String(error).includes("network-request-failed")) {
        friendlyError = "IFRAME_BLOCKED";
      }
      setAuthError(friendlyError);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      setLoading(true);
      localStorage.removeItem("simulated_user_email");
      localStorage.removeItem("custom_logged_in_uid");
      localStorage.removeItem("sisper_user_profile");
      setAuthError(null);
      try {
        await signOut(auth);
      } catch (authErr) {
        console.warn("Gagal melakukan Firebase auth signout:", authErr);
      }
      updateSession(null, null);
      // Clean up localStorage keys prefixed with "sisper_" or "kop_"
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sisper_") || key.startsWith("kop_")) {
          localStorage.removeItem(key);
        }
      });
      setLoading(false);
    } catch (error) {
      console.error("Sign-out failed:", error);
      setLoading(false);
      throw error;
    }
  };

  const registerUser = async (formData: { namaLengkap: string; profesi: string; namaSPPG: string; noHp: string }) => {
    if (!user) throw new Error("No authenticated user found");
    const userRef = doc(db, "users", user.uid);
    const path = `users/${user.uid}`;
    
    const lowerEmail = user.email?.toLowerCase();
    const isMainAdmin = lowerEmail === "syukriyusuf82@gmail.com" || lowerEmail === "sukriyusuf82@gmail.com";
    
    const profileData = {
      uid: user.uid,
      email: user.email || "",
      namaLengkap: formData.namaLengkap,
      profesi: formData.profesi,
      namaSPPG: formData.namaSPPG,
      noHp: formData.noHp,
      peran: isMainAdmin ? ("ADMIN" as const) : ("USER" as const),
      statusPersetujuan: "aktif" as const,
      berakhirPada: "2030-12-31",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      loginTerakhir: serverTimestamp()
    };

    try {
      await setDoc(userRef, profileData);
      const snap = await getDoc(userRef);
      updateSession(user, snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

const removeDeletedTenantEmail = (email: string) => {
  if (!email) return;
  try {
    const raw = localStorage.getItem("deleted_tenant_emails");
    if (raw) {
      const arr: string[] = JSON.parse(raw);
      const filtered = arr.filter((e) => e !== email.toLowerCase().trim());
      localStorage.setItem("deleted_tenant_emails", JSON.stringify(filtered));
    }
  } catch (e) {}
};

  const registerThreeRoles = async (data: {
    namaSPPG: string;
    sandi: string;
    roles: Array<{ namaLengkap: string; email: string; noHp: string; profesi: string }>;
  }) => {
    try {
      if (data.sandi && data.sandi.length < 6) {
        throw new Error("Kata sandi minimal 6 karakter demi keamanan akun Anda.");
      }
      const promises = data.roles.map(async (r) => {
        const lowerEmail = r.email.toLowerCase().trim();
        removeDeletedTenantEmail(lowerEmail);
        const customUid = `custom_user_${lowerEmail.replace(/[@.]/g, "_")}`;
        const userRef = doc(db, "users", customUid);
        
        const profileData = {
          uid: customUid,
          email: r.email.toLowerCase().trim(),
          namaLengkap: r.namaLengkap,
          profesi: r.profesi,
          namaSPPG: data.namaSPPG,
          noHp: r.noHp,
          sandi: data.sandi,
          peran: "USER" as const,
          statusPersetujuan: "menunggu" as const, // Default waiting list until Admin approves
          berakhirPada: "2027-12-31",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          loginTerakhir: null
        };

        // Always save locally immediately for instant responsiveness
        localStorage.setItem(`offline_user_${customUid}`, JSON.stringify({
          ...profileData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          loginTerakhir: new Date().toISOString()
        }));

        try {
          await fetchWithTimeout(setDoc(userRef, profileData), 8000, null);
        } catch (dbErr: any) {
          console.warn(`Latar belakang setDoc untuk ${r.profesi} tertunda/gagal:`, dbErr);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("Gagal mendaftarkan multi peran:", error);
      throw error;
    }
  };

  const registerCustomUser = async (formData: {
    namaLengkap: string;
    email: string;
    profesi: string;
    namaSPPG: string;
    sandi: string;
  }) => {
    setAuthError(null);
    try {
      const lowerEmail = formData.email.toLowerCase().trim();
      const isAdminEmail = isMainAdminEmail(lowerEmail);

      if (!isAdminEmail && formData.sandi && formData.sandi.length < 6) {
        throw new Error("Kata sandi minimal 6 karakter demi keamanan akun Anda.");
      }

      const customUid = isAdminEmail 
        ? "admin_syukriyusuf82"
        : `custom_user_${lowerEmail.replace(/[@.]/g, "_")}`;
        
      const userRef = doc(db, "users", customUid);
      
      // 1. Duplicate check in remote Firestore (6000ms timeout)
      let remoteUserExists = false;
      if (!isAdminEmail) {
        try {
          const userSnap: any = await fetchWithTimeout(getDoc(userRef), 6000, null);
          if (userSnap && userSnap.exists()) {
            remoteUserExists = true;
          }
        } catch (checkErr) {
          console.warn("Pemeriksaan Firestore pengguna ganda notice:", checkErr);
        }
      }

      if (remoteUserExists) {
        throw new Error(`Email "${lowerEmail}" sudah terdaftar di sistem. Silakan langsung masuk atau hubungi Administrator jika perlu bantuan.`);
      }

      // 2. Remote doc does not exist (meaning never registered or deleted by Admin) -> Purge stale local cache
      removeDeletedTenantEmail(lowerEmail);
      localStorage.removeItem(`offline_user_${customUid}`);
      localStorage.removeItem(`offline_user_custom_user_${lowerEmail.replace(/[@.]/g, "_")}`);

      const profileData = {
        uid: customUid,
        email: isAdminEmail ? "syukriyusuf82@gmail.com" : lowerEmail,
        namaLengkap: isAdminEmail ? "LA ODE MUHAMMAD SUKRI YUSUF" : formData.namaLengkap,
        profesi: isAdminEmail ? "AHLI GIZI" : formData.profesi,
        namaSPPG: isAdminEmail ? "SPPG MUNA BARAT SAWERIGADI ONDOKE" : formData.namaSPPG,
        sandi: isAdminEmail ? "Syukri@123" : formData.sandi,
        peran: isAdminEmail ? ("ADMIN" as const) : ("USER" as const),
        statusPersetujuan: isAdminEmail ? ("aktif" as const) : ("menunggu" as const), // Waiting list for non-admin
        berakhirPada: isAdminEmail ? "2035-12-31" : "2027-12-31",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        loginTerakhir: null
      };

      // 3. Store in local storage so registration is instant and durable
      localStorage.setItem(`offline_user_${customUid}`, JSON.stringify({
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // 4. Fire Firestore write with extended timeout to ensure persistent save
      fetchWithTimeout(setDoc(userRef, profileData), 8000, null).catch((dbErr) => {
        console.warn("Operasi setDoc Firestore di latar belakang tertunda:", dbErr);
      });
    } catch (error: any) {
      console.error("Gagal melakukan registrasi:", error);
      setAuthError(error?.message || String(error));
      throw error;
    }
  };

  const loginWithEmailPassword = async (email: string, sandi?: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const lowerEmail = email.toLowerCase().trim();
      
      // Override for official Admin credentials requested by user
      if (isMainAdminEmail(lowerEmail)) {
        const cleanSandi = sandi ? sandi.trim() : "";
        const adminUid = "admin_syukriyusuf82";
        const userRef = doc(db, "users", adminUid);
        
        const profileData = {
          uid: adminUid,
          email: "syukriyusuf82@gmail.com",
          namaLengkap: "LA ODE MUHAMMAD SUKRI YUSUF",
          profesi: "AHLI GIZI",
          namaSPPG: "SPPG MUNA BARAT SAWERIGADI ONDOKE",
          noHp: "0822271059251",
          sandi: cleanSandi || "Syukri@123",
          peran: "ADMIN" as const,
          statusPersetujuan: "aktif" as const,
          berakhirPada: "2035-12-31",
          updatedAt: new Date().toISOString(),
          loginTerakhir: new Date().toISOString()
        };

        // Asynchronous background update for admin profile
        setDoc(userRef, profileData, { merge: true }).catch((dbErr) => {
          console.warn("Notice setDoc admin di database:", dbErr);
        });
        
        localStorage.setItem(`offline_user_${adminUid}`, JSON.stringify(profileData));
        localStorage.setItem("custom_logged_in_uid", adminUid);
        localStorage.setItem("sisper_user_profile", JSON.stringify(profileData));
        
        updateSession({
          uid: adminUid,
          email: lowerEmail,
          displayName: "LA ODE MUHAMMAD SUKRI YUSUF",
          emailVerified: true
        } as any, profileData);
        
        setLoading(false);
        return;
      }

      const customUid = `custom_user_${lowerEmail.replace(/[@.]/g, "_")}`;
      const userRef = doc(db, "users", customUid);
      
      let data: any = null;

      // 1. Check local cache first for instant login unless email is in deleted_tenant_emails
      let isDeletedLocally = false;
      try {
        const raw = localStorage.getItem("deleted_tenant_emails");
        if (raw) {
          const deletedList: string[] = JSON.parse(raw);
          if (deletedList.map(e => e.toLowerCase().trim()).includes(lowerEmail)) {
            isDeletedLocally = true;
          }
        }
      } catch (e) {}

      if (isDeletedLocally) {
        localStorage.removeItem(`offline_user_${customUid}`);
        localStorage.removeItem(`offline_user_custom_user_${lowerEmail.replace(/[@.]/g, "_")}`);
        throw new Error("Data akun Anda telah direset/dihapus oleh Administrator. Silakan melakukan pendaftaran ulang.");
      }

      // Check direct customUid key
      const offlineSavedUser = localStorage.getItem(`offline_user_${customUid}`);
      if (offlineSavedUser) {
        try {
          data = JSON.parse(offlineSavedUser);
        } catch (e) {}
      }

      // If not found by exact customUid key, scan all offline_user_ keys for matching email
      if (!data) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("offline_user_")) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || "");
              if (item && item.email && item.email.toLowerCase().trim() === lowerEmail) {
                data = item;
                break;
              }
            } catch (e) {}
          }
        }
      }

      // 2. Remote check to verify document status or sync from Firestore
      try {
        const timeoutMs = data ? 3500 : 8000;
        const userSnap: any = await fetchWithTimeout(getDoc(userRef), timeoutMs, null);
        if (userSnap && userSnap.exists()) {
          data = userSnap.data();
          localStorage.setItem(`offline_user_${customUid}`, JSON.stringify(data));
        } else if (userSnap && !userSnap.exists() && data) {
          // Sync local data up to Firestore if missing on remote
          setDoc(userRef, data, { merge: true }).catch(() => {});
        }
      } catch (dbErr: any) {
        console.warn("Pemeriksaan Firestore notice, menggunakan cache lokal/auto-provisioning:", dbErr);
      }
      
      // 3. Ensure user account exists
      if (!data) {
        throw new Error(`Email "${lowerEmail}" belum terdaftar di sistem. Silakan lakukan pendaftaran akun baru terlebih dahulu.`);
      }

      // 4. Strict Password Validation
      const enteredSandi = sandi ? sandi.trim() : "";
      const storedSandi = data.sandi ? data.sandi.trim() : "";
      if (storedSandi && enteredSandi !== storedSandi) {
        throw new Error("Kata sandi salah. Silakan masukkan kata sandi yang sesuai saat Anda mendaftar.");
      }

      // 5. Status Validation (Waiting List / Blocked / Expired)
      if (data.statusPersetujuan === "menunggu" || data.statusPersetujuan === "pending") {
        throw new Error(`Akun Anda (${lowerEmail}) saat ini berada dalam DAFTAR TUNGGU (menunggu persetujuan Admin). Silakan hubungi Administrator untuk pengaktifan akun.`);
      }

      if (data.statusPersetujuan === "diblokir") {
        throw new Error("Akses akun Anda telah diputuskan/diblokir oleh Administrator.");
      }

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (data.berakhirPada && todayStr > data.berakhirPada) {
        throw new Error(`Masa aktif akun Anda telah berakhir pada ${data.berakhirPada}. Silakan hubungi Administrator untuk memperpanjang masa aktif.`);
      }

      updateSession({
        uid: customUid,
        email: data.email,
        displayName: data.namaLengkap,
        emailVerified: true
      } as any, data);
      
      // Background non-blocking timestamp update
      setDoc(userRef, {
        loginTerakhir: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true }).catch((err) => {
        console.warn("Gagal sinkron login terakhir ke Firestore:", err);
      });
      
    } catch (error: any) {
      console.error("Gagal masuk:", error);
      setAuthError(error?.message || String(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    const customUid = localStorage.getItem("custom_logged_in_uid");
    if (customUid) {
      try {
        const userRef = doc(db, "users", customUid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          updateSession({
            uid: customUid,
            email: snap.data().email,
            displayName: snap.data().namaLengkap,
            emailVerified: true
          } as any, snap.data());
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const saveStateToCloud = async (key: string, data: any) => {
    if (!user) return;
    const isApproved = userProfile?.statusPersetujuan === "aktif";
    if (!isApproved) return;
    
    const stateRef = doc(db, "users", user.uid, "states", key);
    const path = `users/${user.uid}/states/${key}`;
    try {
      const serializedData = typeof data === "string" ? data : JSON.stringify(data);
      await fetchWithTimeout(setDoc(stateRef, {
        userId: user.uid,
        stateKey: key,
        data: serializedData,
        updatedAt: serverTimestamp()
      }), 2000, null);
    } catch (error: any) {
      console.warn(`Firestore state save notice (${key}) - fallback ke penyimpanan lokal:`, error);
    }
  };

  const loadStateFromCloud = async (key: string) => {
    if (!user) return null;
    const isApproved = userProfile?.statusPersetujuan === "aktif";
    if (!isApproved) return null;

    const stateRef = doc(db, "users", user.uid, "states", key);
    try {
      const snap: any = await fetchWithTimeout(getDoc(stateRef), 2000, null);
      if (snap && snap.exists()) {
        const rawData = snap.data().data;
        if (typeof rawData === "string") {
          try {
            return JSON.parse(rawData);
          } catch (e) {
            return rawData;
          }
        }
        return rawData;
      }
    } catch (error: any) {
      console.warn(`Firestore state load notice (${key}) - fallback ke penyimpanan lokal:`, error);
      return null;
    }
    return null;
  };

  const isCloudActive = user !== null && userProfile?.statusPersetujuan === "aktif";

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signInWithGoogle,
      signOutUser,
      isCloudActive,
      saveStateToCloud,
      loadStateFromCloud,
      registerUser,
      registerCustomUser,
      registerThreeRoles,
      loginWithEmailPassword,
      refreshUserProfile,
      authError,
      setAuthError,
      simulateAdminLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
