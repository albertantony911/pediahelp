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

// Initialize App Check only in a browser environment
if (typeof window !== 'undefined') {
  const initializeAppCheckWithRecaptcha = async () => {
    // Wait for the grecaptcha object to be available
    const waitForGrecaptcha = () =>
      new Promise<void>((resolve, reject) => {
        const checkGrecaptcha = () => {
          if (window.grecaptcha) {
            resolve();
          } else {
            setTimeout(checkGrecaptcha, 100); // Check every 100ms
          }
        };
        checkGrecaptcha();

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('reCAPTCHA script failed to load within 10 seconds'));
        }, 10000);
      });

    try {
      await waitForGrecaptcha();
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LfyME4rAAAAAJvshPIPIxqqOCLcNofyerndicyj'),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('App Check initialized successfully with reCAPTCHA v3');
    } catch (error) {
      console.error('App Check initialization failed:', error);
    }
  };

  initializeAppCheckWithRecaptcha();
}

export { app, auth, db };