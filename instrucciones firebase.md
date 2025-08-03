# 🔥 Prompt Ultra Detallado: Firebase Local & Nube para HTML + Vite + Node.js

## 1. Variables de Entorno y Configuración

- Crea un archivo `.env.template` con las siguientes variables:
  ```
  VITE_FIREBASE_API_KEY=tu_api_key_aqui
  VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain_aqui
  VITE_FIREBASE_PROJECT_ID=tu_project_id_aqui
  VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket_aqui
  VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id_aqui
  VITE_FIREBASE_APP_ID=tu_app_id_aqui
  VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id_aqui
  VITE_APP_ID=nombre_de_tu_app
  VITE_MODE=demo # demo para local, firebase para nube
  ```
- Copia `.env.template` como `.env.local` y pon tus credenciales reales.
- En producción, configura las variables en el hosting (Netlify, Vercel, etc).

---

## 2. Configuración de Firebase en Vite

- Crea un archivo `src/firebase-config.js` con la siguiente lógica:

  ```js
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
  export const appId = getEnvVar('VITE_APP_ID', 'mi-app');
  export const appMode = getEnvVar('VITE_MODE', 'demo');
  ```

---

## 3. Inicialización de Firebase y Modo Local

- En tu archivo principal JS (por ejemplo, `main.js` o el entry de Vite):

  ```js
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { firebaseConfig, appMode } from './firebase-config';

  let db = null;
  let auth = null;
  let isGuestMode = false;

  if (appMode === 'firebase' && firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isGuestMode = false;
  } else {
    isGuestMode = true;
    // Usar localStorage para persistencia local
  }
  ```

---

## 4. Gestión de Datos: Firestore vs LocalStorage

- **Modo Firebase:** Usa Firestore para guardar y leer datos.
- **Modo Local:** Usa `localStorage` para guardar y leer datos.

  ```js
  function saveData(collectionName, data) {
    if (isGuestMode) {
      localStorage.setItem(collectionName, JSON.stringify(data));
    } else {
      // Guardar en Firestore usando batch, setDoc, etc.
    }
  }

  function loadData(collectionName) {
    if (isGuestMode) {
      return JSON.parse(localStorage.getItem(collectionName) || '[]');
    } else {
      // Leer de Firestore con getDocs, onSnapshot, etc.
    }
  }
  ```

---

## 5. Autenticación

- **Modo Firebase:** Usa `getAuth`, `signInWithPopup` (Google), etc.
- **Modo Local:** Simula usuario invitado con ID fijo.

---

## 6. Listeners y Sincronización

- Implementa listeners para datos en tiempo real:
  - **Firestore:** Usa `onSnapshot`.
  - **Local:** Usa eventos de cambio en `localStorage` o recarga manual.

---

## 7. Repetir Datos del Mes Anterior y Persistencia

- Implementa funciones para copiar datos del mes anterior y arrastrar datos persistentes (deudas/inversiones) al nuevo mes, tanto en local como en Firebase.

---

## 8. Notificaciones y Confirmaciones

- Implementa sistema de notificaciones para informar al usuario sobre el estado de la configuración, errores, y acciones importantes.

---

## 9. Adaptación para Node.js

- Si necesitas persistencia en el backend, puedes usar un archivo JSON o una base de datos local en vez de `localStorage`.
- Para la lógica de frontend, mantén la estructura de listeners y persistencia igual que en React, pero usando vanilla JS y los métodos de DOM.

---

## 10. Variables a Reemplazar

- Solo cambia las variables de entorno y los nombres de las colecciones según tu modelo de datos.
- Mantén la lógica de inicialización, persistencia y listeners igual.

---

## 11. Ejemplo de Estructura de Archivos

```
/src
  firebase-config.js
  main.js
  utils/
    storage.js
.env.template
.env.local
index.html
vite.config.js
```

---

## 12. Resumen de Lógica

| Aspecto         | Modo Local (`demo`)         | Modo Nube (`firebase`)         |
|-----------------|----------------------------|-------------------------------|
| Persistencia    | `localStorage`             | Firestore (Firebase)          |
| Auth            | Simulado (ID fijo)         | Firebase Auth (Google, etc)   |
| Configuración   | Variables de entorno       | Variables de entorno          |
| Listeners       | Manual/localStorage        | `onSnapshot` Firestore        |
| Guardado        | Set en localStorage        | Batch/setDoc en Firestore     |
| Repetir mes     | Copia local                | Query y copia en Firestore    |

---

## 13. Instrucciones para la IA

- Replica la lógica de inicialización, persistencia y listeners de Firebase y localStorage.
- Adapta los nombres de variables y colecciones según el nuevo proyecto.
- Mantén la estructura modular y configurable por variables de entorno.
- Implementa la lógica de modo local y modo nube de forma intercambiable según la variable `VITE_MODE`.

---

## 14. Ejemplos de Código Específicos para HTML/Vite/Node.js

### Ejemplo 1: Configuración de Firebase en Vite

```js
// src/firebase-config.js
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
export const appId = getEnvVar('VITE_APP_ID', 'mi-app');
export const appMode = getEnvVar('VITE_MODE', 'demo');
```

### Ejemplo 2: Inicialización en main.js

```js
// src/main.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig, appMode } from './firebase-config';

let db = null;
let auth = null;
let isGuestMode = false;

if (appMode === 'firebase' && firebaseConfig.apiKey) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  isGuestMode = false;
} else {
  isGuestMode = true;
  // Usar localStorage para persistencia local
}
```

### Ejemplo 3: Guardar y Leer Datos

```js
// src/utils/storage.js
export function saveData(collectionName, data, isGuestMode, db, userId) {
  if (isGuestMode) {
    localStorage.setItem(collectionName, JSON.stringify(data));
  } else {
    // Ejemplo Firestore
    // import { collection, setDoc, doc } from 'firebase/firestore';
    const colRef = collection(db, `users/${userId}/${collectionName}`);
    data.forEach(async (item) => {
      const docRef = doc(colRef);
      await setDoc(docRef, item);
    });
  }
}

export function loadData(collectionName, isGuestMode, db, userId, callback) {
  if (isGuestMode) {
    const data = JSON.parse(localStorage.getItem(collectionName) || '[]');
    callback(data);
  } else {
    // Ejemplo Firestore
    // import { collection, getDocs } from 'firebase/firestore';
    const colRef = collection(db, `users/${userId}/${collectionName}`);
    getDocs(colRef).then(snapshot => {
      const docs = snapshot.docs.map(doc => doc.data());
      callback(docs);
    });
  }
}
```

### Ejemplo 4: Listener de Cambios en LocalStorage

```js
// src/utils/storage.js
export function addLocalStorageListener(collectionName, callback) {
  window.addEventListener('storage', (event) => {
    if (event.key === collectionName) {
      const data = JSON.parse(event.newValue || '[]');
      callback(data);
    }
  });
}
```

### Ejemplo 5: Autenticación con Google (Firebase)

```js
// src/auth.js
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export async function signInWithGoogle(auth, onSuccess, onError) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    onSuccess(result.user);
  } catch (error) {
    onError(error);
  }
}
```

### Ejemplo 6: Notificación Simple en HTML

```html
<!-- index.html -->
<div id="notification" style="display:none;position:fixed;top:10px;right:10px;background:#222;color:#fff;padding:10px;border-radius:5px;z-index:1000;"></div>
<script>
function showNotification(msg, type = 'info', duration = 3000) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = type === 'error' ? '#c00' : '#222';
  setTimeout(() => { el.style.display = 'none'; }, duration);
}
</script>
```

### Ejemplo 7: Estructura de Archivos Recomendada

```
/src
  firebase-config.js
  main.js
  utils/
    storage.js
  auth.js
.env.template
.env.local
index.html
vite.config.js
```

---

Estos ejemplos cubren la configuración, inicialización, persistencia, listeners, autenticación y notificaciones para un proyecto HTML + Vite + Node.js, replicando la lógica del proyecto original. Puedes adaptarlos y expandirlos según tu modelo de datos y necesidades.
