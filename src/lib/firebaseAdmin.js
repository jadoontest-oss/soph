import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    // Optional but recommended to be explicit:
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // e.g. my-project.appspot.com
  });
}

export const db = admin.firestore();
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
export const bucket = admin.storage().bucket(); // default bucket or the one from env
