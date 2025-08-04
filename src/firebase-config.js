// Función para obtener variable de entorno con fallback seguro
const getEnvVar = (key, fallback = '') => {
  let value;
  
  // 1. Verificar si import.meta.env está disponible (Vite en desarrollo)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    value = import.meta.env[key];
  }
  
  // 2. Verificar si estamos en producción y tenemos configuración global
  if (!value && typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
    // En producción, las variables se inyectan como constantes
    const configKey = key.replace('VITE_FIREBASE_', '').toLowerCase();
    if (configKey === 'api_key') value = window.FIREBASE_CONFIG.apiKey;
    if (configKey === 'auth_domain') value = window.FIREBASE_CONFIG.authDomain;
    if (configKey === 'project_id') value = window.FIREBASE_CONFIG.projectId;
    if (configKey === 'storage_bucket') value = window.FIREBASE_CONFIG.storageBucket;
    if (configKey === 'messaging_sender_id') value = window.FIREBASE_CONFIG.messagingSenderId;
    if (configKey === 'app_id') value = window.FIREBASE_CONFIG.appId;
    if (configKey === 'measurement_id') value = window.FIREBASE_CONFIG.measurementId;
  }
  
  // 3. Verificar configuración de app global
  if (!value && typeof window !== 'undefined' && window.APP_CONFIG) {
    if (key === 'VITE_APP_ID') value = window.APP_CONFIG.appId;
    if (key === 'VITE_MODE') value = window.APP_CONFIG.mode;
  }
  
  // 4. Detectar si estamos en producción por URL
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('orionv2.netlify.app'));
  
  // Si estamos en producción y no tenemos valor real, NO usar fallback demo
  if (isProduction && !value && key.startsWith('VITE_FIREBASE_')) {
    console.warn(`🚨 Variable de producción ${key} no encontrada`);
    return null; // Retornar null para indicar que no hay configuración válida
  }
  
  // En desarrollo, usar fallback si no hay valor
  if (!value && fallback) {
    console.warn(`⚠️ Variable ${key} no encontrada, usando fallback para desarrollo`);
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
