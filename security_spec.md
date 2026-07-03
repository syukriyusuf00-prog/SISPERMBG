# Security Specification: SISPERMBG Database

## 1. Data Invariants
- **Authentication**: A user must be logged in to read or write any data.
- **Relational Ownership**: Users can only read and write their own profile (`/users/{userId}`) and their own state documents (`/users/{userId}/states/{stateKey}`). No cross-user access is allowed.
- **Document ID Poisoning Protection**: The `userId` and `stateKey` path variables must be valid alphanumeric strings of bounded length.
- **Type and Range Enforcements**:
  - `UserProfile` must contain exact fields on creation, and only owner can write.
  - `AppState` must have `userId` matching `request.auth.uid`, `stateKey` must match the URL path variable, and `data` must be a valid JSON-like string of maximum size (e.g. 500KB) to prevent Denial of Wallet.

---

## 2. The "Dirty Dozen" Payloads (Exploit/Robustness Scenarios)
All of these payloads must return `PERMISSION_DENIED` under our security rules:

1. **Anonymous / Unauthenticated Read**: Attempt to read `/users/alice_uid` without a valid token.
2. **Anonymous / Unauthenticated Write**: Attempt to create `/users/alice_uid` without a valid token.
3. **Cross-User Hijacking (Read)**: Logged-in user `Bob` (uid: `bob_123`) attempts to read `Alice`'s profile `/users/alice_456`.
4. **Cross-User Hijacking (Write)**: Logged-in user `Bob` attempts to overwrite `Alice`'s profile `/users/alice_456`.
5. **State Data Forgery (Cross-User Write)**: Logged-in user `Bob` attempts to write state to `/users/alice_456/states/profile`.
6. **State Key Tampering**: Logged-in user `Bob` attempts to write state to `/users/bob_123/states/profile` but sets the `stateKey` in the payload to `sekolah`.
7. **Identity Spoofing**: Logged-in user `Bob` attempts to write state to `/users/bob_123/states/profile` but sets the payload `userId` field to `alice_456`.
8. **Malicious ID Poisoning (Long ID)**: Attempt to create a state with a 10KB string as the `stateKey` (e.g., `/users/bob_123/states/HUGE_STRING_HERE...`).
9. **Denial of Wallet (Payload Bloat)**: Attempt to write a state `data` property exceeding 800KB.
10. **Admin Spoofing**: User `Bob` attempts to set a custom claim/field `role: "admin"` in their own profile or states to escalate privileges.
11. **Timestamp Forgery**: User `Bob` attempts to create a state with a client-side hardcoded timestamp in `updatedAt` rather than `request.time`.
12. **Immutability Breach**: Logged-in user `Bob` attempts to modify their profile `createdAt` field after creation.

---

## 3. Rules Implementation Plan
We will draft a set of fortress rules in `firestore.rules` containing:
- Global default deny.
- Bounded input check on IDs (`isValidId`).
- Strong helper functions (`isSignedIn`, `isOwner`, `isValidUserProfile`, `isValidAppState`).
- Explicit whitelisted actions and keys.
