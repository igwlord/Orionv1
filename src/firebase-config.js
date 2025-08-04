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

// Configuración de Firebase con valores de fallback para demo
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'demo-api-key'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'orionv1-demo.firebaseapp.com'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'orionv1-demo'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'orionv1-demo.appspot.com'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:123456789:web:demo'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', 'G-DEMO')
};

export const appId = getEnvVar('VITE_APP_ID', 'orion-v1');
export const appMode = getEnvVar('VITE_MODE', 'firebase'); // Volver a firebase por defecto

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
