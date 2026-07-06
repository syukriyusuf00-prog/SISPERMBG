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
    const isMainAdmin = lowerEmail === "syukriyusuf82@gmail.com" || lowerEmail === "sukriyusuf82@gmail.com";
    const userRef = doc(db, "users", currentUser.uid);
    const path = `users/${currentUser.uid}`;
    const mainAdminPhone = lowerEmail === "sukriyusuf82@gmail.com" ? "0822271059251" : "081111111111";

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
              namaLengkap: data.namaLengkap || "Syukri Yusuf (Admin)",
              profesi: data.profesi || "Administrator Utama",
              namaSPPG: data.namaSPPG || "Pusat Gizi SPPG",
              noHp: data.noHp || mainAdminPhone,
              berakhirPada: "2030-12-31",
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
            email: currentUser.email || "sukriyusuf82@gmail.com",
            namaLengkap: "Syukri Yusuf (Admin)",
            profesi: "Administrator Utama",
            namaSPPG: "Pusat Gizi SPPG",
            noHp: mainAdminPhone,
            peran: "ADMIN" as const,
            statusPersetujuan: "aktif" as const,
            berakhirPada: "2030-12-31",
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
        // Bulletproof local fallback for main admin to guarantee zero lockouts
        updateSession(currentUser, {
          uid: currentUser.uid,
          email: currentUser.email || "sukriyusuf82@gmail.com",
          namaLengkap: "Syukri Yusuf (Admin)",
          profesi: "Administrator Utama",
          namaSPPG: "Pusat Gizi SPPG",
          noHp: mainAdminPhone,
          peran: "ADMIN",
          statusPersetujuan: "aktif",
          berakhirPada: "2030-12-31"
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

        // Stale-while-revalidate for saved profile
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
            setLoading(false);
          } catch (e) {
            console.warn("Gagal parsing profil lokal:", e);
          }
        }

        try {
          const userRef = doc(db, "users", customUid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            updateSession({
              uid: customUid,
              email: data.email,
              displayName: data.namaLengkap,
              emailVerified: true
            } as any, data);
          }
        } catch (e) {
          console.warn("Gagal memuat profil awan secara asinkron (menggunakan cache lokal):", e);
        }
        setLoading(false);
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

  const registerThreeRoles = async (data: {
    namaSPPG: string;
    sandi: string;
    roles: Array<{ namaLengkap: string; email: string; noHp: string; profesi: string }>;
  }) => {
    setLoading(true);
    try {
      for (const r of data.roles) {
        const customUid = `custom_user_${r.email.toLowerCase().replace(/[@.]/g, "_")}`;
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
          statusPersetujuan: "aktif" as const,
          berakhirPada: "2030-12-31",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          loginTerakhir: serverTimestamp()
        };

        try {
          await setDoc(userRef, profileData);
        } catch (dbErr: any) {
          console.warn(`Gagal mendaftarkan peran ${r.profesi} di Firestore, menyimpan di localStorage:`, dbErr);
          localStorage.setItem(`offline_user_${customUid}`, JSON.stringify({
            ...profileData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            loginTerakhir: new Date().toISOString()
          }));
        }
      }
    } catch (error) {
      console.error("Gagal mendaftarkan multi peran:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerCustomUser = async (formData: {
    namaLengkap: string;
    email: string;
    profesi: string;
    namaSPPG: string;
    sandi: string;
  }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const lowerEmail = formData.email.toLowerCase().trim();
      const isAdminEmail = lowerEmail === "syukriyusuf82@gmail.com" || lowerEmail === "sukriyusuf82@gmail.com";
      const customUid = isAdminEmail 
        ? (lowerEmail === "sukriyusuf82@gmail.com" ? "admin_sukriyusuf82" : "admin_syukriyusuf82")
        : `custom_user_${lowerEmail.replace(/[@.]/g, "_")}`;
        
      const userRef = doc(db, "users", customUid);
      
      // For Admin registration, we can overwrite or update if requested, otherwise check existence
      if (!isAdminEmail) {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          throw new Error("Email ini sudah terdaftar di sistem.");
        }
      }

      const profileData = {
        uid: customUid,
        email: lowerEmail,
        namaLengkap: isAdminEmail ? "LA ODE MUHAMMAD SUKRI YUSUF" : formData.namaLengkap,
        profesi: isAdminEmail ? "AHLI GIZI" : formData.profesi,
        namaSPPG: isAdminEmail ? "SPPG MUNA BARAT SAWERIGADI ONDOKE" : formData.namaSPPG,
        sandi: isAdminEmail ? "Syukri@123" : formData.sandi,
        peran: isAdminEmail ? ("ADMIN" as const) : ("USER" as const),
        statusPersetujuan: isAdminEmail ? ("aktif" as const) : ("pending" as const), // Automatically active for the admin
        berakhirPada: isAdminEmail ? "2035-12-31" : "", // Expiry set for user or empty
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        loginTerakhir: null
      };

      try {
        await setDoc(userRef, profileData);
      } catch (dbErr) {
        console.warn("Gagal menyimpan pendaftaran di Firestore, menggunakan penyimpanan lokal:", dbErr);
        localStorage.setItem(`offline_user_${customUid}`, JSON.stringify({
          ...profileData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (error: any) {
      console.error("Gagal melakukan registrasi:", error);
      setAuthError(error?.message || String(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, sandi?: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const lowerEmail = email.toLowerCase().trim();
      
      // Override for official Admin credentials requested by user
      if (lowerEmail === "sukriyusuf82@gmail.com" || lowerEmail === "syukriyusuf82@gmail.com") {
        const cleanSandi = sandi ? sandi.trim() : "";
        if (cleanSandi !== "Syukri@123" && cleanSandi !== "Syukri Odhe" && cleanSandi !== "Odhe@1998") {
          throw new Error("Kata sandi admin salah. Silakan masukkan kata sandi yang benar.");
        }
        
        const adminUid = lowerEmail === "sukriyusuf82@gmail.com" ? "admin_sukriyusuf82" : "admin_syukriyusuf82";
        const userRef = doc(db, "users", adminUid);
        
        const profileData = {
          uid: adminUid,
          email: lowerEmail,
          namaLengkap: "LA ODE MUHAMMAD SUKRI YUSUF",
          profesi: "AHLI GIZI",
          namaSPPG: "SPPG MUNA BARAT SAWERIGADI ONDOKE",
          noHp: "0822271059251",
          sandi: cleanSandi,
          peran: "ADMIN" as const,
          statusPersetujuan: "aktif" as const,
          berakhirPada: "2035-12-31",
          updatedAt: serverTimestamp(),
          loginTerakhir: serverTimestamp()
        };

        // Create or update this admin profile in Firestore
        try {
          await setDoc(userRef, profileData, { merge: true });
        } catch (dbErr) {
          console.warn("Gagal setDoc admin di database, menggunakan fallback lokal:", dbErr);
        }
        
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
      
      // Check offline stored user registrations first
      let data: any = null;
      const offlineSavedUser = localStorage.getItem(`offline_user_${customUid}`);
      if (offlineSavedUser) {
        try {
          data = JSON.parse(offlineSavedUser);
        } catch (e) {
          console.warn("Gagal mengurai pengguna offline disimpan:", e);
        }
      }

      if (!data) {
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
          if (userSnap && userSnap.exists()) {
            data = userSnap.data();
          }
        } catch (dbErr: any) {
          console.warn("Gagal getDoc dari database, menggunakan fallback lokal / offline:", dbErr);
        }
      }
      
      if (!data) {
        throw new Error("Email belum terdaftar. Silakan melakukan pendaftaran terlebih dahulu.");
      }

      // 1. Password validation
      const enteredSandi = sandi ? sandi.trim() : "";
      const storedSandi = data.sandi ? data.sandi.trim() : "";
      if (storedSandi && enteredSandi !== storedSandi) {
        throw new Error("Kata sandi salah. Silakan coba lagi.");
      }

      // 2. Status validation
      if (data.statusPersetujuan !== "aktif") {
        throw new Error("Akun Anda belum disetujui oleh admin atau dalam status pending. Silakan hubungi admin GiziSync.");
      }

      // 3. Expiration date validation
      if (data.berakhirPada) {
        const expirationDate = new Date(data.berakhirPada);
        const today = new Date();
        // Reset time parts for accurate day-to-day comparison
        expirationDate.setHours(23, 59, 59, 999);
        today.setHours(0, 0, 0, 0);
        if (today > expirationDate) {
          throw new Error(`Masa aktif akun Anda telah berakhir pada ${data.berakhirPada}. Silakan hubungi admin untuk memperpanjang.`);
        }
      }

      updateSession({
        uid: customUid,
        email: data.email,
        displayName: data.namaLengkap,
        emailVerified: true
      } as any, data);
      
      try {
        await setDoc(userRef, {
          loginTerakhir: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Gagal sinkron login terakhir ke Firestore:", err);
      }
      
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
      await setDoc(stateRef, {
        userId: user.uid,
        stateKey: key,
        data: serializedData,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      const isOfflineOrPerm = error?.message?.includes("offline") || error?.message?.includes("Could not reach") || error?.message?.includes("permission") || error?.message?.includes("Permission");
      if (isOfflineOrPerm) {
        console.warn("Firestore offline/permission error while saving state:", error);
        return; // Silently fallback to offline mode
      }
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const loadStateFromCloud = async (key: string) => {
    if (!user) return null;
    const isApproved = userProfile?.statusPersetujuan === "aktif";
    if (!isApproved) return null;

    const stateRef = doc(db, "users", user.uid, "states", key);
    const path = `users/${user.uid}/states/${key}`;
    try {
      const snap = await getDoc(stateRef);
      if (snap.exists()) {
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
      const isOfflineOrPerm = error?.message?.includes("offline") || error?.message?.includes("Could not reach") || error?.message?.includes("permission") || error?.message?.includes("Permission");
      if (isOfflineOrPerm) {
        console.warn("Firestore offline/permission error while loading state:", error);
        return null; // Gracefully return null to fallback to local state
      }
      handleFirestoreError(error, OperationType.GET, path);
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
