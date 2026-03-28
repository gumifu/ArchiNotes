import admin from "firebase-admin";

function initAdmin(): void {
  if (admin.apps.length > 0) return;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) return;
  try {
    const cred = JSON.parse(json) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(cred),
    });
  } catch {
    /* ignore — isFirebaseAdminConfigured() stays false */
  }
}

initAdmin();

export function isFirebaseAdminConfigured(): boolean {
  return admin.apps.length > 0;
}

export function getAdminFirestore(): admin.firestore.Firestore {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin が未設定です。FIREBASE_SERVICE_ACCOUNT_JSON を設定してください。",
    );
  }
  return admin.firestore();
}
