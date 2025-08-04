import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig, appMode } from './firebase-config.js';

let db = null;
let auth = null;
let isGuestMode = false;

// Verificar si estamos en desarrollo
const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

// Inicialización de Firebase
if (appMode === 'firebase' && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-api-key') {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isGuestMode = false;
    if (isDev) {
      console.log('🔥 Firebase inicializado correctamente');
    }
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    isGuestMode = true;
  }
} else {
  isGuestMode = true;
  if (isDev || window.IS_DEV) {
    console.log('👤 Modo invitado activado - usando localStorage');
  }
}

export { db, auth, isGuestMode };

// Función para cambiar a modo invitado
export const setGuestMode = (guestMode) => {
  isGuestMode = guestMode;
};

// Función para obtener el usuario actual
export const getCurrentUser = () => {
  if (isGuestMode) {
    return {
      uid: 'guest-user',
      email: 'usuario.invitado@local.com',
      displayName: 'Usuario Invitado',
      isGuest: true
    };
  }
  return auth?.currentUser || null;
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => {
  if (isGuestMode) return true;
  return !!auth?.currentUser;
};
