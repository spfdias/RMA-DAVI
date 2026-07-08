import * as admin from 'firebase-admin';

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (admin.apps.length === 0) {
  admin.initializeApp(
    serviceAccount
      ? { credential: admin.credential.cert(serviceAccount) }
      : {}
  );
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
