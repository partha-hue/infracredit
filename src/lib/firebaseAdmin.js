import admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!admin.apps.length) {
      admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
      });
}

export const adminDb = admin.firestore();
