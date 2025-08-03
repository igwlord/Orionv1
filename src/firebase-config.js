// Función para obtener variable de entorno con fallback seguro
const getEnvVar = (key, fallback = '') => {
  const value = import.meta.env[key];
  if (!value && fallback) {
    console.warn(`⚠️ Variable ${key} no encontrada, usando fallback`);
  }
  return value || fallback;
};

export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

export const appId = getEnvVar('VITE_APP_ID', 'orion-v1');
export const appMode = getEnvVar('VITE_MODE', 'demo');

// Solo log en desarrollo
if (import.meta.env.DEV) {
  console.log('🔥 Firebase Config:', {
    appId,
    appMode,
    hasApiKey: !!firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId
  });
}
