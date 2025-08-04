// Función para obtener variable de entorno con fallback seguro
const getEnvVar = (key, fallback = '') => {
  // Verificar si import.meta.env está disponible (Vite)
  let value;
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    value = import.meta.env[key];
  }
  
  // Si no hay valor y tenemos fallback, usar fallback
  if (!value && fallback) {
    console.warn(`⚠️ Variable ${key} no encontrada, usando fallback`);
    return fallback;
  }
  
  return value || fallback;
};

// Configuración de Firebase - sin fallbacks por defecto
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
export const appMode = getEnvVar('VITE_MODE', 'guest'); // Cambiar a 'guest' por defecto

// Verificar si Firebase está configurado correctamente
export const isFirebaseConfigured = firebaseConfig.apiKey && 
                                   firebaseConfig.authDomain && 
                                   firebaseConfig.projectId &&
                                   !firebaseConfig.apiKey.includes('demo');

// Verificar si estamos en desarrollo
const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

// Solo log en desarrollo
if (isDev) {
  console.log('🔥 Firebase Config:', {
    appId,
    appMode,
    hasApiKey: !!firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId
  });
}
