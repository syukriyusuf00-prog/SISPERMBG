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
  serverTimestamp
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
  refreshUserProfile: () => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  simulateAdminLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUserProfile = async (currentUser: User) => {
    const isMainAdmin = currentUser.email?.toLowerCase() === "syukriyusuf82@gmail.com";
    const userRef = doc(db, "users", currentUser.uid);
    const path = `users/${currentUser.uid}`;

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
              namaLengkap: data.namaLengkap || "Syukri Yusuf",
              profesi: data.profesi || "Administrator Utama",
              namaSPPG: data.namaSPPG || "SPPG Pusat",
              noHp: data.noHp || "081111111111",
              berakhirPada: "2030-12-31",
              updatedAt: serverTimestamp(),
              loginTerakhir: serverTimestamp()
            }, { merge: true });
            const snap = await getDoc(userRef);
            setUserProfile(snap.data());
          } else {
            // Already active ADMIN, just update login timestamp
            await setDoc(userRef, {
              loginTerakhir: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
            const snap = await getDoc(userRef);
            setUserProfile(snap.data());
          }
        } else {
          // Document does not exist yet, create it!
          const adminProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "syukriyusuf82@gmail.com",
            namaLengkap: "Syukri Yusuf",
            profesi: "Administrator Utama",
            namaSPPG: "SPPG Pusat",
            noHp: "081111111111",
            peran: "ADMIN" as const,
            statusPersetujuan: "aktif" as const,
            berakhirPada: "2030-12-31",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            loginTerakhir: serverTimestamp()
          };
          await setDoc(userRef, adminProfile);
          const snap = await getDoc(userRef);
          setUserProfile(snap.data());
        }
      } catch (err) {
        console.error("Error setting up main admin profile:", err);
        // Bulletproof local fallback for main admin to guarantee zero lockouts
        setUserProfile({
          uid: currentUser.uid,
          email: currentUser.email || "syukriyusuf82@gmail.com",
          namaLengkap: "Syukri Yusuf",
          profesi: "Administrator Utama",
          namaSPPG: "SPPG Pusat",
          noHp: "081111111111",
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
        setUserProfile(data);
        
        // Update last login
        await setDoc(userRef, {
          loginTerakhir: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Fetch updated data to include the server timestamp updates
        const updatedSnap = await getDoc(userRef);
        setUserProfile(updatedSnap.data());
      } else {
        // Normal user: Needs registration
        setUserProfile({
          uid: currentUser.uid,
          email: currentUser.email || "",
          isNotRegistered: true
        });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Fallback local setting to prevent lock out in case of rules delay
      setUserProfile({
        uid: currentUser.uid,
        email: currentUser.email || "",
        isNotRegistered: true
      });
    }
  };

  useEffect(() => {
    const simulatedEmail = localStorage.getItem("simulated_user_email");
    if (simulatedEmail === "syukriyusuf82@gmail.com") {
      setUser({
        uid: "syukriyusuf82_simulated_uid",
        email: "syukriyusuf82@gmail.com",
        displayName: "Syukri Yusuf",
        emailVerified: true
      } as any);
      setUserProfile({
        uid: "syukriyusuf82_simulated_uid",
        email: "syukriyusuf82@gmail.com",
        namaLengkap: "Syukri Yusuf",
        profesi: "Administrator Utama",
        namaSPPG: "SPPG Pusat",
        noHp: "081111111111",
        peran: "ADMIN",
        statusPersetujuan: "aktif",
        berakhirPada: "2030-12-31"
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const simulateAdminLogin = () => {
    setLoading(true);
    localStorage.setItem("simulated_user_email", "syukriyusuf82@gmail.com");
    setUser({
      uid: "syukriyusuf82_simulated_uid",
      email: "syukriyusuf82@gmail.com",
      displayName: "Syukri Yusuf",
      emailVerified: true
    } as any);
    setUserProfile({
      uid: "syukriyusuf82_simulated_uid",
      email: "syukriyusuf82@gmail.com",
      namaLengkap: "Syukri Yusuf",
      profesi: "Administrator Utama",
      namaSPPG: "SPPG Pusat",
      noHp: "081111111111",
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
      setAuthError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
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
    
    const isMainAdmin = user.email?.toLowerCase() === "syukriyusuf82@gmail.com";
    
    const profileData = {
      uid: user.uid,
      email: user.email || "",
      namaLengkap: formData.namaLengkap,
      profesi: formData.profesi,
      namaSPPG: formData.namaSPPG,
      noHp: formData.noHp,
      peran: isMainAdmin ? ("ADMIN" as const) : ("USER" as const),
      statusPersetujuan: isMainAdmin ? ("aktif" as const) : ("menunggu" as const),
      berakhirPada: isMainAdmin ? "2030-12-31" : "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      loginTerakhir: serverTimestamp()
    };

    try {
      await setDoc(userRef, profileData);
      const snap = await getDoc(userRef);
      setUserProfile(snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const refreshUserProfile = async () => {
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
    } catch (error) {
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
    } catch (error) {
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
