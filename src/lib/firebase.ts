import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider 
} from "firebase/auth";
import { 
  getFirestore 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the specific database ID from the config!
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Standardize operation types for our security monitoring
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

// Structuring error details so security rule violations can be diagnosed
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Robust error handling middleware for Firestore.
 * Conforms to the JSON payload structure required by the system.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Security/Operation Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
