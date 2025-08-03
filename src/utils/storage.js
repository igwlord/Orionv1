import { collection, getDocs, setDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, auth, isGuestMode, getCurrentUser } from '../firebase-init.js';

// Sistema de almacenamiento dual: Firebase/LocalStorage
export class DataManager {
  constructor() {
    this.listeners = new Map();
    this.migrationCompleted = false;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.eventListeners = new Map(); // Sistema de eventos
    
    // Detectar cambios de conexión
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Sistema de eventos para notificar cambios
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }

  // Cola de sincronización para modo offline
  addToSyncQueue(operation) {
    if (!this.isOnline && !isGuestMode) {
      this.syncQueue.push(operation);
      localStorage.setItem('orion_sync_queue', JSON.stringify(this.syncQueue));
      this.emit('syncQueueChange', this.syncQueue.length);
    }
  }

  // Procesar cola de sincronización cuando vuelve la conexión
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    if (import.meta.env.DEV) {
      console.log('🔄 Procesando cola de sincronización...');
    }
    
    for (const operation of this.syncQueue) {
      try {
        if (operation.operation === 'delete') {
          await this.deleteData(operation.collection, operation.docId);
        } else {
          await this.saveData(operation.collection, operation.data, operation.docId);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error sincronizando:', error);
        }
      }
    }
    
    this.syncQueue = [];
    localStorage.removeItem('orion_sync_queue');
    localStorage.setItem('orion_last_sync', new Date().toISOString());
    this.emit('syncQueueChange', 0);
    if (import.meta.env.DEV) {
      console.log('✅ Sincronización completada');
    }
  }

  // Eliminar datos específicos
  async deleteData(collectionName, docId) {
    const user = getCurrentUser();
    
    if (!user || !user.uid) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No hay usuario disponible para eliminar datos');
      }
      return false;
    }
    
    if (isGuestMode) {
      // Modo local - eliminar del localStorage
      const existingData = this.loadDataSync(collectionName);
      if (Array.isArray(existingData)) {
        const updatedData = existingData.filter(item => item.id !== docId);
        localStorage.setItem(`${user.uid}_${collectionName}`, JSON.stringify(updatedData));
      } else if (existingData && existingData.id === docId) {
        localStorage.removeItem(`${user.uid}_${collectionName}`);
      }
      
      localStorage.setItem(`${user.uid}_${collectionName}_modified`, new Date().toISOString());
      if (import.meta.env.DEV) {
        console.log(`🗑️ Elemento eliminado en modo local: ${collectionName}/${docId}`);
      }
      return true;
    } else {
      // Modo Firebase
      try {
        if (!this.isOnline) {
          // Agregar operación de eliminación a la cola
          this.addToSyncQueue({
            operation: 'delete',
            collection: collectionName,
            docId: docId,
            timestamp: Date.now()
          });
          
          if (import.meta.env.DEV) {
            console.log('📡 Sin conexión - eliminación agregada a cola de sincronización');
          }
          return true;
        }

        const { deleteDoc, doc } = await import('firebase/firestore');
        const docRef = doc(db, `users/${user.uid}/${collectionName}`, docId);
        
        await deleteDoc(docRef);
        if (import.meta.env.DEV) {
          console.log(`🗑️ Elemento eliminado de Firebase: ${collectionName}/${docId}`);
        }
        return true;
        
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`❌ Error eliminando ${collectionName}/${docId} de Firebase:`, error);
        }
        
        // Agregar a cola de sincronización como fallback
        this.addToSyncQueue({
          operation: 'delete',
          collection: collectionName,
          docId: docId,
          timestamp: Date.now()
        });
        
        return true;
      }
    }
  }

  // Guardar datos con manejo inteligente de errores
  async saveData(collectionName, data, docId = null) {
    const user = getCurrentUser();
    
    if (!user || !user.uid) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No hay usuario disponible para guardar datos');
      }
      return false;
    }
    
    if (isGuestMode) {
      // Modo local - usar localStorage
      const existingData = this.loadDataSync(collectionName);
      if (Array.isArray(data)) {
        localStorage.setItem(`${user.uid}_${collectionName}`, JSON.stringify(data));
      } else {
        const updatedData = { ...existingData, ...data };
        localStorage.setItem(`${user.uid}_${collectionName}`, JSON.stringify(updatedData));
      }
      
      // Registrar fecha de modificación
      localStorage.setItem(`${user.uid}_${collectionName}_modified`, new Date().toISOString());
      
      // Disparar listeners locales
      this.notifyListeners(collectionName, this.loadDataSync(collectionName));
      if (import.meta.env.DEV) {
        console.log(`💾 Datos guardados en modo local: ${collectionName}`);
      }
      return true;
    } else {
      // Modo Firebase con manejo de offline
      try {
        if (!this.isOnline) {
          // Guardar en localStorage como backup y agregar a cola
          const backupKey = `${user.uid}_${collectionName}_backup`;
          localStorage.setItem(backupKey, JSON.stringify(data));
          
          this.addToSyncQueue({
            collection: collectionName,
            data: data,
            docId: docId,
            timestamp: Date.now()
          });
          
          if (import.meta.env.DEV) {
            console.log('📡 Sin conexión - datos guardados localmente para sincronizar');
          }
          return true;
        }

        const userCollectionRef = collection(db, `users/${user.uid}/${collectionName}`);
        
        if (Array.isArray(data)) {
          // Si es un array, usar batch para mejor rendimiento
          const { writeBatch } = await import('firebase/firestore');
          const batch = writeBatch(db);
          
          data.forEach((item, index) => {
            const id = item.id || docId || `doc_${index}_${Date.now()}`;
            const docRef = doc(userCollectionRef, id);
            batch.set(docRef, { ...item, id, lastModified: Date.now() });
          });
          
          await batch.commit();
          if (import.meta.env.DEV) {
            console.log(`✅ ${collectionName} guardado en Firebase`);
          }
        } else {
          // Si es un objeto, guardar como documento único
          const id = docId || 'main';
          await setDoc(doc(userCollectionRef, id), { 
            ...data, 
            lastModified: Date.now() 
          });
          if (import.meta.env.DEV) {
            console.log(`✅ ${collectionName} guardado en Firebase`);
          }
        }
        
        // Limpiar backup local si existe
        const backupKey = `${user.uid}_${collectionName}_backup`;
        localStorage.removeItem(backupKey);
        
        return true;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`❌ Error guardando ${collectionName} en Firebase:`, error);
        }
        
        // Fallback a localStorage
        const backupKey = `${user.uid}_${collectionName}_backup`;
        localStorage.setItem(backupKey, JSON.stringify(data));
        
        this.addToSyncQueue({
          collection: collectionName,
          data: data,
          docId: docId,
          timestamp: Date.now()
        });
        
        if (import.meta.env.DEV) {
          console.log(`💾 ${collectionName} guardado localmente para sincronizar después`);
        }
        return true; // Devolver true porque se guardó localmente
      }
    }
  }

  // Cargar datos (síncrono para localStorage)
  loadDataSync(collectionName) {
    const user = getCurrentUser();
    if (!user || !user.uid) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No hay usuario disponible para cargar datos');
      }
      return null;
    }
    const key = `${user.uid}_${collectionName}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // Cargar datos con cache inteligente
  async loadData(collectionName) {
    const user = getCurrentUser();
    
    if (!user || !user.uid) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No hay usuario disponible para cargar datos');
      }
      return null;
    }
    
    if (isGuestMode) {
      if (import.meta.env.DEV) {
        console.log(`📱 Cargando ${collectionName} en modo local`);
      }
      return this.loadDataSync(collectionName);
    } else {
      try {
        // Intentar cargar desde Firebase
        if (this.isOnline && auth?.currentUser) {
          const userCollectionRef = collection(db, `users/${user.uid}/${collectionName}`);
          const snapshot = await getDocs(userCollectionRef);
          const docs = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          const data = docs.length === 1 && docs[0].id === 'main' ? docs[0] : docs;
          
          // Actualizar cache local
          const cacheKey = `${user.uid}_${collectionName}_cache`;
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
          }));
          
          if (import.meta.env.DEV) {
            console.log(`☁️ ${collectionName} cargado desde Firebase`);
          }
          return data;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Error cargando ${collectionName} desde Firebase:`, error.message);
        }
      }
      
      // Fallback a cache local
      if (import.meta.env.DEV) {
        console.log(`📱 Usando cache local para ${collectionName}`);
      }
      return this.loadFromCache(collectionName);
    }
  }

  // Cargar desde cache local
  loadFromCache(collectionName) {
    try {
      const user = getCurrentUser();
      const cacheKey = `${user.uid}_${collectionName}_cache`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        return data;
      }
      
      // Si no hay cache, intentar cargar backup
      const backupKey = `${user.uid}_${collectionName}_backup`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        return JSON.parse(backupData);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error cargando desde cache:', error);
      }
    }
    
    return null;
  }

  // Escuchar cambios en tiempo real
  listenToData(collectionName, callback) {
    const user = getCurrentUser();
    
    if (!user || !user.uid) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No hay usuario disponible para configurar listeners');
      }
      return;
    }
    
    if (isGuestMode) {
      // Para modo local, simular listener con storage events
      const storageListener = (event) => {
        if (event.key === `${user.uid}_${collectionName}`) {
          const data = event.newValue ? JSON.parse(event.newValue) : null;
          callback(data);
        }
      };
      
      window.addEventListener('storage', storageListener);
      this.listeners.set(collectionName, { 
        type: 'localStorage', 
        listener: storageListener 
      });
      
      // Llamar callback inicial con datos existentes
      const initialData = this.loadDataSync(collectionName);
      if (initialData) callback(initialData);
      
    } else {
      // Modo Firebase - listener en tiempo real
      this.setupFirebaseListener(collectionName, callback);
    }
  }

  // Configurar listener de Firebase
  setupFirebaseListener(collectionName, callback) {
    const user = getCurrentUser();
    
    if (!user || !user.uid || !auth?.currentUser) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Usuario no autenticado en Firebase, usando modo local');
      }
      return;
    }
    
    try {
      const userCollectionRef = collection(db, `users/${user.uid}/${collectionName}`);
      
      const unsubscribe = onSnapshot(
        userCollectionRef, 
        (snapshot) => {
          try {
            const docs = snapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            }));
            const data = docs.length === 1 && docs[0].id === 'main' ? docs[0] : docs;
            
            // Actualizar cache local
            const cacheKey = `${user.uid}_${collectionName}_cache`;
            localStorage.setItem(cacheKey, JSON.stringify({
              data: data,
              timestamp: Date.now()
            }));
            
            callback(data);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Error procesando snapshot:', error);
            }
          }
        },
        (error) => {
          // Manejo silencioso de errores y fallback a datos locales
          if (import.meta.env.DEV) {
            console.log(`💾 Usando datos locales para ${collectionName}`);
          }
          const cachedData = this.loadFromCache(collectionName);
          if (cachedData) {
            callback(cachedData);
          }
        }
      );
      
      this.listeners.set(collectionName, { 
        type: 'firebase', 
        listener: unsubscribe 
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error configurando listener de Firebase:', error);
      }
      
      // Fallback inmediato a datos locales
      const cachedData = this.loadFromCache(collectionName);
      if (cachedData) {
        callback(cachedData);
      }
    }
  }

  // Notificar a listeners locales
  notifyListeners(collectionName, data) {
    // Simular evento de cambio para listeners locales
    const event = new StorageEvent('storage', {
      key: `${getCurrentUser().uid}_${collectionName}`,
      newValue: JSON.stringify(data)
    });
    window.dispatchEvent(event);
  }

  // Obtener estadísticas detalladas de almacenamiento
  getStorageStats() {
    const user = getCurrentUser();
    const stats = {
      mode: isGuestMode ? 'local' : 'cloud',
      isOnline: this.isOnline,
      syncQueueSize: this.syncQueue.length,
      lastSync: localStorage.getItem('orion_last_sync') || 'Nunca',
      collections: {},
      localStorageUsage: 0,
      totalItems: 0
    };

    // Calcular estadísticas por colección
    const collections = ['tasks', 'projects', 'user_config'];
    
    collections.forEach(collection => {
      const data = this.loadDataSync(collection);
      const dataStr = JSON.stringify(data || {});
      
      stats.collections[collection] = {
        itemCount: Array.isArray(data) ? data.length : (data ? Object.keys(data).length : 0),
        sizeBytes: new Blob([dataStr]).size,
        lastModified: localStorage.getItem(`${user?.uid}_${collection}_modified`) || 'Desconocido'
      };
      
      stats.localStorageUsage += stats.collections[collection].sizeBytes;
      stats.totalItems += stats.collections[collection].itemCount;
    });

    return stats;
  }

  // Crear datos de ejemplo si no existen
  async createSampleData() {
    const user = getCurrentUser();
    if (!user || !user.uid) return;

    // Verificar si ya hay datos
    const existingTasks = await this.loadData('tasks');
    const existingProjects = await this.loadData('projects');
    
    if (!existingTasks || existingTasks.length === 0) {
      const sampleTasks = [
        {
          id: 'sample_1',
          title: '¡Bienvenido a Orion!',
          description: 'Explora las funcionalidades de tu nueva aplicación de productividad',
          priority: 'alta',
          completed: false,
          status: 'todo',
          project: 'Primeros pasos',
          dueDate: new Date().toISOString().split('T')[0],
          createdAt: Date.now(),
          completedAt: null
        },
        {
          id: 'sample_2',
          title: 'Configurar tu primer proyecto',
          description: 'Organiza tus tareas en proyectos para mayor productividad',
          priority: 'media',
          completed: false,
          status: 'todo',
          project: 'Primeros pasos',
          dueDate: null,
          createdAt: Date.now(),
          completedAt: null
        }
      ];
      
      await this.saveData('tasks', sampleTasks);
      if (import.meta.env.DEV) {
        console.log('📝 Tareas de ejemplo creadas');
      }
    }
    
    if (!existingProjects || existingProjects.length === 0) {
      const sampleProjects = [
        {
          id: 'primeros_pasos',
          name: 'Primeros pasos',
          color: '#3B82F6',
          description: 'Conoce tu nueva aplicación de productividad',
          createdAt: Date.now()
        }
      ];
      
      await this.saveData('projects', sampleProjects);
      if (import.meta.env.DEV) {
        console.log('📂 Proyectos de ejemplo creados');
      }
    }

    // Configuración inicial del usuario
    const existingConfig = await this.loadData('user_config');
    if (!existingConfig) {
      const defaultConfig = {
        theme: 'dark',
        notifications: true,
        startOfWeek: 1, // Lunes
        kaizenGoal: 1,
        completedKaizenToday: 0,
        lastKaizenDate: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };
      
      await this.saveData('user_config', defaultConfig);
      if (import.meta.env.DEV) {
        console.log('⚙️ Configuración inicial creada');
      }
    }
  }

  // Migrar datos desde localStorage general al usuario específico
  async migrateUserData() {
    const user = getCurrentUser();
    if (!user || !user.uid) return;

    const collections = ['tasks', 'projects', 'user_config'];
    let migrationCount = 0;

    for (const collection of collections) {
      // Buscar datos en el localStorage general (sin uid)
      const generalData = localStorage.getItem(collection);
      const userSpecificKey = `${user.uid}_${collection}`;
      const userSpecificData = localStorage.getItem(userSpecificKey);

      // Si hay datos generales pero no específicos del usuario, migrar
      if (generalData && !userSpecificData) {
        try {
          localStorage.setItem(userSpecificKey, generalData);
          localStorage.setItem(`${userSpecificKey}_modified`, new Date().toISOString());
          migrationCount++;
          
          // Si no estamos en modo invitado, sincronizar a Firebase
          if (!isGuestMode) {
            const data = JSON.parse(generalData);
            await this.saveData(collection, data);
          }
          
          if (import.meta.env.DEV) {
            console.log(`📦 Migrado ${collection} al usuario ${user.uid}`);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error(`❌ Error migrando ${collection}:`, error);
          }
        }
      }
    }

    if (migrationCount > 0) {
      if (import.meta.env.DEV) {
        console.log(`✅ Migración completada: ${migrationCount} colecciones`);
      }
      // Marcar migración como completada
      localStorage.setItem(`${user.uid}_migration_completed`, new Date().toISOString());
    }
  }

  // Inicializar sistema de almacenamiento
  async initialize() {
    try {
      // Verificar que hay un usuario disponible
      const user = getCurrentUser();
      if (!user || !user.uid) {
        if (import.meta.env.DEV) {
          console.log('⏳ Esperando usuario para inicializar almacenamiento...');
        }
        return false;
      }
      
      // Ejecutar migración de datos si es necesario
      const migrationCompleted = localStorage.getItem(`${user.uid}_migration_completed`);
      if (!migrationCompleted) {
        await this.migrateUserData();
      }
      
      // Crear datos de ejemplo si es necesario
      await this.createSampleData();
      
      // Cargar cola de sincronización pendiente
      const savedQueue = localStorage.getItem('orion_sync_queue');
      if (savedQueue) {
        this.syncQueue = JSON.parse(savedQueue);
      }
      
      // Procesar cola de sincronización si hay conexión
      if (this.isOnline && !isGuestMode) {
        await this.processSyncQueue();
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Sistema de almacenamiento inicializado');
      }
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error inicializando sistema de almacenamiento:', error);
      }
      return false;
    }
  }
}

// Instancia global del manejador de datos
export const dataManager = new DataManager();
