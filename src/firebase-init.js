import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig, appMode } from './firebase-config.js';

let db = null;
let auth = null;
let isGuestMode = false;

console.log('🔧 Inicializando Firebase...');
console.log('🔧 Modo de la app:', appMode);

// Inicialización de Firebase basada en el appMode
if (appMode === 'firebase') {
  try {
    console.log('🔥 Inicializando Firebase con configuración:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isGuestMode = false;
    console.log('✅ Firebase inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    isGuestMode = true;
    console.log('🔄 Cambiando a modo invitado');
  }
} else {
  isGuestMode = true;
  console.log('👤 Modo invitado activado');
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
