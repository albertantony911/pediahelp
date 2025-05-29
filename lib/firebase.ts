import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Validate environment variables and create config
const createFirebaseConfig = (): FirebaseConfig => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const missingKeys = Object.entries(config)
    .filter(([key, value]) => key !== 'measurementId' && !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase config keys: ${missingKeys.join(', ')}`);
  }

  return config as FirebaseConfig;
};

const firebaseConfig = createFirebaseConfig();
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize App Check with standard reCAPTCHA v3 in browser
if (typeof window !== 'undefined') {
  const v3Key = process.env.NEXT_PUBLIC_RECAPTCHA_V3_KEY;

  if (!v3Key) {
    console.error('Missing environment variable NEXT_PUBLIC_RECAPTCHA_V3_KEY');
    throw new Error('Missing environment variable NEXT_PUBLIC_RECAPTCHA_V3_KEY');
  }

  try {
    console.log('Initializing Firebase App Check with standard reCAPTCHA v3, siteKey:', v3Key);
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(v3Key),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('Firebase App Check initialized successfully with standard reCAPTCHA v3');
  } catch (error) {
    console.error('Failed to initialize Firebase App Check with standard reCAPTCHA v3:', error);
  }
}

export { app, auth, db };