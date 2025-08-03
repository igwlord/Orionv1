import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig, appMode } from './firebase-config.js';

let db = null;
let auth = null;
let isGuestMode = false;

// Inicialización de Firebase
if (appMode === 'firebase' && firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isGuestMode = false;
    if (import.meta.env.DEV) {
      console.log('🔥 Firebase inicializado correctamente');
    }
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    isGuestMode = true;
  }
} else {
  isGuestMode = true;
  if (import.meta.env.DEV) {
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
