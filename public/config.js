// Configuración inyectada durante el build de Netlify
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

window.APP_CONFIG = {
  appId: "orion-v1",
  mode: "firebase"
};

console.log('🔥 Configuración de producción cargada:', {
  hasApiKey: !!window.FIREBASE_CONFIG.apiKey,
  projectId: window.FIREBASE_CONFIG.projectId,
  mode: window.APP_CONFIG.mode
});