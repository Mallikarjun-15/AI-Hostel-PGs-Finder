const admin = require('firebase-admin');

// Ensure you have FIREBASE_SERVICE_ACCOUNT base64 encoded in your .env
// or we can initialize without credentials if running on GCP, but for local we need it.
// For now, we will wrap it in try-catch so the app doesn't crash if it's missing during setup.

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('ascii'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin Initialized with Service Account');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT not found in environment variables. Firebase auth will not work.');
    }
  }
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

module.exports = admin;
