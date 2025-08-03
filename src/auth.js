import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, isGuestMode, setGuestMode } from './firebase-init.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.setupAuthStateListener();
  }

  // Configurar listener de estado de autenticación
  setupAuthStateListener() {
    if (!isGuestMode && auth) {
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.notifyAuthStateListeners(user);
      });
    }
  }

  // Iniciar sesión con Google
  async signInWithGoogle() {
    if (isGuestMode) {
      console.log('👤 Modo invitado - no se requiere autenticación con Google');
      return this.createGuestUser();
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      this.currentUser = result.user;
      
      console.log('✅ Inicio de sesión exitoso:', {
        name: result.user.displayName,
        email: result.user.email,
        uid: result.user.uid
      });
      
      return {
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          isGuest: false
        }
      };
    } catch (error) {
      console.error('❌ Error en inicio de sesión:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Iniciar sesión como invitado
  signInAsGuest() {
    setGuestMode(true);
    const guestUser = this.createGuestUser();
    this.currentUser = guestUser;
    this.notifyAuthStateListeners(guestUser);
    
    console.log('👤 Iniciado como usuario invitado');
    return {
      success: true,
      user: guestUser
    };
  }

  // Crear usuario invitado
  createGuestUser() {
    return {
      uid: 'guest-user',
      email: 'usuario.invitado@local.com',
      displayName: 'Usuario Invitado',
      photoURL: null,
      isGuest: true
    };
  }

  // Cerrar sesión
  async signOut() {
    try {
      if (!isGuestMode && auth) {
        await signOut(auth);
      }
      this.currentUser = null;
      this.notifyAuthStateListeners(null);
      console.log('👋 Sesión cerrada');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  async signOut() {
    try {
      if (isGuestMode) {
        // Modo invitado: solo limpiar estado local
        setGuestMode(false);
        this.currentUser = null;
        this.notifyAuthStateListeners(null);
        console.log('👋 Sesión de invitado cerrada');
        return { success: true };
      } else {
        // Modo Firebase: cerrar sesión real
        await signOut(auth);
        this.currentUser = null;
        console.log('👋 Sesión cerrada');
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener usuario actual
  getCurrentUser() {
    if (isGuestMode) {
      return this.currentUser || this.createGuestUser();
    }
    return this.currentUser;
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  // Agregar listener de cambios de autenticación
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // Llamar inmediatamente con el estado actual
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      callback(currentUser);
    }
  }

  // Remover listener de cambios de autenticación
  removeAuthStateListener(callback) {
    const index = this.authStateListeners.indexOf(callback);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  // Notificar a todos los listeners
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(callback => {
      callback(user);
    });
  }

  // Obtener mensaje de error amigable
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/popup-closed-by-user': 'Has cerrado la ventana de inicio de sesión',
      'auth/popup-blocked': 'El popup fue bloqueado por el navegador',
      'auth/cancelled-popup-request': 'Solicitud de popup cancelada',
      'auth/network-request-failed': 'Error de conexión. Revisa tu internet',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/operation-not-allowed': 'Operación no permitida'
    };
    
    return errorMessages[errorCode] || 'Error desconocido en la autenticación';
  }
}

// Instancia global del manejador de autenticación
export const authManager = new AuthManager();
