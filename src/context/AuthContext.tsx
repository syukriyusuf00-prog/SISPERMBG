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
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  isCloudActive: boolean;
  saveStateToCloud: (key: string, data: any) => Promise<void>;
  loadStateFromCloud: (key: string) => Promise<any | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Register/update user profile in firestore safely
        const userRef = doc(db, "users", currentUser.uid);
        const path = `users/${currentUser.uid}`;
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(userRef, {
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out failed:", error);
      throw error;
    }
  };

  const saveStateToCloud = async (key: string, data: any) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/states/${key}`;
    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "states", key);
      await setDoc(docRef, {
        userId: auth.currentUser.uid,
        stateKey: key,
        data: JSON.stringify(data),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const loadStateFromCloud = async (key: string): Promise<any | null> => {
    if (!auth.currentUser) return null;
    const path = `users/${auth.currentUser.uid}/states/${key}`;
    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "states", key);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const docData = snap.data();
        if (docData && docData.data) {
          return JSON.parse(docData.data);
        }
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  };

  const isCloudActive = user !== null;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signOutUser,
      isCloudActive,
      saveStateToCloud,
      loadStateFromCloud
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
