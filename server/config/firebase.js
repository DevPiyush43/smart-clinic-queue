let admin = null;
let firebaseInitialized = false;

const initFirebase = () => {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('⚠️  Firebase credentials not set — FCM push notifications disabled (stub mode)');
    return null;
  }

  try {
    const firebaseAdmin = require('firebase-admin');

    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }

    admin = firebaseAdmin;
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK initialized');
    return firebaseAdmin;
  } catch (err) {
    console.error('❌ Firebase init error:', err.message);
    return null;
  }
};

const getAdmin = () => admin;
const isFirebaseReady = () => firebaseInitialized;

module.exports = { initFirebase, getAdmin, isFirebaseReady };
