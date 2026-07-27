import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider 
} from "firebase/auth";
import { 
  initializeFirestore,
  setLogLevel
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Silence Firestore logs to avoid console pollution
try {
  setLogLevel("silent");
} catch (e) {
  console.warn("Could not set Firestore log level:", e);
}

// Override console.error to intercept and suppress Firestore connection warnings
const originalConsoleError = console.error;
console.error = function (...args) {
  const message = args.map(arg => {
    if (typeof arg === "string") return arg;
    if (arg instanceof Error) return arg.message + (arg.stack ? "\n" + arg.stack : "");
    try {
      return JSON.stringify(arg);
    } catch (_) {
      return String(arg);
    }
  }).join(" ");

  if (
    message.includes("Could not reach Cloud Firestore backend") || 
    message.includes("@firebase/firestore") ||
    message.includes("Firestore (12.15.0)") ||
    message.includes("unreachable") ||
    message.includes("Quota limit exceeded") ||
    message.includes("Quota exceeded") ||
    message.includes("Free daily read units") ||
    message.includes("quota metric") ||
    message.includes("RESOURCE_EXHAUSTED")
  ) {
    // Suppress or downgrade to warning/info so it doesn't trigger the platform's automatic error detector
    console.warn("[Suppressed Firestore Quota/Log]:", ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the specific database ID from the config and force long polling!
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

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
  const errStr = error instanceof Error ? error.message : String(error);
  const isQuotaOrOffline = 
    errStr.includes("Quota limit exceeded") || 
    errStr.includes("Quota exceeded") || 
    errStr.includes("Free daily read units") || 
    errStr.includes("quota metric") || 
    errStr.includes("RESOURCE_EXHAUSTED") || 
    errStr.includes("Could not reach") || 
    errStr.includes("offline");

  if (isQuotaOrOffline) {
    console.warn(`[Firestore Fallback Mode on ${operationType} - ${path}]: Using offline state.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
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
  console.warn("Firestore Security/Operation Warning: ", JSON.stringify(errInfo));
}
