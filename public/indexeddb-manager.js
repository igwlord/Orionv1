// =================================================================================
// ORION INDEXEDDB MANAGER - Data Resilience System
// =================================================================================

class IndexedDBManager {
    constructor() {
        this.dbName = 'OrionDB';
        this.dbVersion = 1;
        this.db = null;
        this.isReady = false;
        this.initPromise = this.init();
    }

    // =================================================================================
    // INICIALIZACIÓN
    // =================================================================================
    async init() {
        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.error('❌ Error abriendo IndexedDB:', request.error);
                    this.isReady = false;
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    this.db = request.result;
                    this.isReady = true;
                    
                    // Detectar cuando la BD se cierra inesperadamente
                    this.db.onclose = () => {
                        console.warn('⚠️ IndexedDB se cerró inesperadamente');
                        this.isReady = false;
                        this.db = null;
                    };
                    
                    // Detectar errores de versión
                    this.db.onversionchange = () => {
                        console.warn('⚠️ Cambio de versión de IndexedDB detectado');
                        this.db.close();
                        this.isReady = false;
                        this.db = null;
                    };
                    
                    if (window.IS_DEV) {
                        console.log('✅ IndexedDB iniciado correctamente');
                    }
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    this.db = event.target.result;
                    this.createStores();
                };
            });
        } catch (error) {
            console.error('❌ Error crítico en IndexedDB:', error);
            throw error;
        }
    }

    // Crear los object stores
    createStores() {
        try {
            // Store para tareas
            if (!this.db.objectStoreNames.contains('tasks')) {
                const taskStore = this.db.createObjectStore('tasks', { keyPath: 'id' });
                taskStore.createIndex('projectId', 'projectId', { unique: false });
                taskStore.createIndex('status', 'status', { unique: false });
                taskStore.createIndex('date', 'date', { unique: false });
                taskStore.createIndex('priority', 'priority', { unique: false });
            }

            // Store para proyectos
            if (!this.db.objectStoreNames.contains('projects')) {
                this.db.createObjectStore('projects', { keyPath: 'id' });
            }

            // Store para sincronización pendiente
            if (!this.db.objectStoreNames.contains('syncQueue')) {
                const syncStore = this.db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncStore.createIndex('type', 'type', { unique: false });
                syncStore.createIndex('status', 'status', { unique: false });
            }

            // Store para configuración de usuario
            if (!this.db.objectStoreNames.contains('userConfig')) {
                this.db.createObjectStore('userConfig', { keyPath: 'key' });
            }

            // Store para cache de datos
            if (!this.db.objectStoreNames.contains('cache')) {
                const cacheStore = this.db.createObjectStore('cache', { keyPath: 'key' });
                cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                cacheStore.createIndex('expiry', 'expiry', { unique: false });
            }

            if (window.IS_DEV) {
                console.log('🏗️ Object stores creados correctamente');
            }
        } catch (error) {
            console.error('❌ Error creando stores:', error);
            throw error;
        }
    }

    // =================================================================================
    // OPERACIONES CRUD GENÉRICAS
    // =================================================================================
    async get(storeName, key) {
        await this.ensureReady();
        return this.executeWithRetry(async () => {
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(key);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    transaction.onerror = () => reject(transaction.error);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async getAll(storeName, indexName = null, indexValue = null) {
        await this.ensureReady();
        return this.executeWithRetry(async () => {
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    
                    let request;
                    if (indexName && indexValue !== null) {
                        const index = store.index(indexName);
                        request = index.getAll(indexValue);
                    } else {
                        request = store.getAll();
                    }
            
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    transaction.onerror = () => reject(transaction.error);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async put(storeName, data) {
        await this.ensureReady();
        return this.executeWithRetry(async () => {
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.put(data);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    transaction.onerror = () => reject(transaction.error);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async delete(storeName, key) {
        await this.ensureReady();
        return this.executeWithRetry(async () => {
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(key);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    transaction.onerror = () => reject(transaction.error);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async clear(storeName) {
        await this.ensureReady();
        return this.executeWithRetry(async () => {
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    transaction.onerror = () => reject(transaction.error);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // =================================================================================
    // MÉTODOS ESPECÍFICOS PARA TAREAS
    // =================================================================================
    async saveTask(task) {
        try {
            // Añadir metadata
            task.lastModified = Date.now();
            task.localVersion = task.localVersion ? task.localVersion + 1 : 1;
            
            await this.put('tasks', task);
            
            if (window.IS_DEV) {
                console.log('💾 Tarea guardada en IndexedDB:', task.name);
            }
            
            return task;
        } catch (error) {
            console.error('❌ Error guardando tarea:', error);
            throw error;
        }
    }

    async getTasks(filters = {}) {
        try {
            let tasks = await this.getAll('tasks');
            
            // Aplicar filtros
            if (filters.projectId && filters.projectId !== 'all') {
                tasks = tasks.filter(task => task.projectId === filters.projectId);
            }
            
            if (filters.status) {
                tasks = tasks.filter(task => task.status === filters.status);
            }
            
            if (filters.date) {
                tasks = tasks.filter(task => task.date === filters.date);
            }
            
            return tasks || [];
        } catch (error) {
            console.error('❌ Error obteniendo tareas:', error);
            
            // Intentar recuperación si es error de BD cerrada
            if (error.message && error.message.includes('closed database')) {
                console.log('🔄 Reintentando obtener tareas tras reconexión...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    let tasks = await this.getAll('tasks');
                    return tasks || [];
                } catch (retryError) {
                    console.error('❌ Error en reintento:', retryError);
                    return [];
                }
            }
            
            return [];
        }
    }

    async deleteTask(taskId) {
        try {
            await this.delete('tasks', taskId);
            
            if (window.IS_DEV) {
                console.log('🗑️ Tarea eliminada de IndexedDB:', taskId);
            }
        } catch (error) {
            console.error('❌ Error eliminando tarea:', error);
            throw error;
        }
    }

    // =================================================================================
    // MÉTODOS ESPECÍFICOS PARA PROYECTOS
    // =================================================================================
    async saveProject(project) {
        try {
            project.lastModified = Date.now();
            project.localVersion = project.localVersion ? project.localVersion + 1 : 1;
            
            await this.put('projects', project);
            
            if (window.IS_DEV) {
                console.log('💾 Proyecto guardado en IndexedDB:', project.name);
            }
            
            return project;
        } catch (error) {
            console.error('❌ Error guardando proyecto:', error);
            throw error;
        }
    }

    async getProjects() {
        try {
            const projects = await this.getAll('projects');
            return projects || [];
        } catch (error) {
            console.error('❌ Error obteniendo proyectos:', error);
            
            // Intentar recuperación si es error de BD cerrada
            if (error.message && error.message.includes('closed database')) {
                console.log('🔄 Reintentando obtener proyectos tras reconexión...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const projects = await this.getAll('projects');
                    return projects || [];
                } catch (retryError) {
                    console.error('❌ Error en reintento:', retryError);
                    return [];
                }
            }
            
            return [];
        }
    }

    // =================================================================================
    // SYNC QUEUE MANAGEMENT
    // =================================================================================
    async addToSyncQueue(operation) {
        try {
            const syncItem = {
                type: operation.type, // 'create', 'update', 'delete'
                entity: operation.entity, // 'task', 'project'
                data: operation.data,
                timestamp: Date.now(),
                status: 'pending', // 'pending', 'syncing', 'completed', 'failed'
                retryCount: 0,
                maxRetries: 3
            };
            
            await this.put('syncQueue', syncItem);
            
            if (window.IS_DEV) {
                console.log('📋 Operación añadida a cola de sincronización:', syncItem);
            }
            
            return syncItem;
        } catch (error) {
            console.error('❌ Error añadiendo a cola de sync:', error);
            throw error;
        }
    }

    async getSyncQueue() {
        try {
            const queue = await this.getAll('syncQueue', 'status', 'pending');
            return queue || [];
        } catch (error) {
            console.error('❌ Error obteniendo cola de sync:', error);
            
            // Intentar recuperación si es error de BD cerrada
            if (error.message && error.message.includes('closed database')) {
                console.log('🔄 Reintentando obtener cola de sync tras reconexión...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const queue = await this.getAll('syncQueue', 'status', 'pending');
                    return queue || [];
                } catch (retryError) {
                    console.error('❌ Error en reintento:', retryError);
                    return [];
                }
            }
            
            return [];
        }
    }

    async markSyncCompleted(syncItemId) {
        try {
            const item = await this.get('syncQueue', syncItemId);
            if (item) {
                item.status = 'completed';
                item.completedAt = Date.now();
                await this.put('syncQueue', item);
            }
        } catch (error) {
            console.error('❌ Error marcando sync como completado:', error);
        }
    }

    async markSyncFailed(syncItemId) {
        try {
            const item = await this.get('syncQueue', syncItemId);
            if (item) {
                item.retryCount++;
                if (item.retryCount >= item.maxRetries) {
                    item.status = 'failed';
                    item.failedAt = Date.now();
                } else {
                    item.status = 'pending';
                    // Incrementar el delay para el próximo intento
                    item.nextRetry = Date.now() + (item.retryCount * 5000);
                }
                await this.put('syncQueue', item);
            }
        } catch (error) {
            console.error('❌ Error marcando sync como fallido:', error);
        }
    }

    // =================================================================================
    // CACHE MANAGEMENT
    // =================================================================================
    async setCache(key, data, ttlMinutes = 60) {
        try {
            const cacheItem = {
                key,
                data,
                timestamp: Date.now(),
                expiry: Date.now() + (ttlMinutes * 60 * 1000)
            };
            
            await this.put('cache', cacheItem);
        } catch (error) {
            console.error('❌ Error guardando en cache:', error);
        }
    }

    async getCache(key) {
        try {
            const item = await this.get('cache', key);
            if (!item) return null;
            
            // Verificar si ha expirado
            if (Date.now() > item.expiry) {
                await this.delete('cache', key);
                return null;
            }
            
            return item.data;
        } catch (error) {
            console.error('❌ Error obteniendo cache:', error);
            
            // Intentar recuperación si es error de BD cerrada
            if (error.message && error.message.includes('closed database')) {
                console.log('🔄 Reintentando obtener cache tras reconexión...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const item = await this.get('cache', key);
                    if (!item) return null;
                    
                    if (Date.now() > item.expiry) {
                        await this.delete('cache', key);
                        return null;
                    }
                    
                    return item.data;
                } catch (retryError) {
                    console.error('❌ Error en reintento:', retryError);
                    return null;
                }
            }
            
            return null;
            return null;
        }
    }

    async clearExpiredCache() {
        try {
            const allCacheItems = await this.getAll('cache');
            const now = Date.now();
            
            for (const item of allCacheItems) {
                if (now > item.expiry) {
                    await this.delete('cache', item.key);
                }
            }
        } catch (error) {
            console.error('❌ Error limpiando cache expirado:', error);
        }
    }

    // =================================================================================
    // UTILIDADES
    // =================================================================================
    async ensureReady() {
        if (!this.isReady || !this.db || this.db.objectStoreNames.length === 0) {
            try {
                await this.initPromise;
                
                // Verificar que la BD realmente esté lista
                if (!this.db || this.db.objectStoreNames.length === 0) {
                    console.warn('⚠️ BD no inicializada correctamente, reintentando...');
                    this.isReady = false;
                    this.initPromise = this.init();
                    await this.initPromise;
                }
            } catch (error) {
                console.error('❌ Error en ensureReady, reintentando:', error);
                this.isReady = false;
                this.initPromise = this.init();
                await this.initPromise;
            }
        }
    }

    // Método para ejecutar operaciones con reintentos automáticos
    async executeWithRetry(operation, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Intento ${attempt} falló:`, error.message);
                
                // Si la BD está cerrada, intentar reconectar
                if (error.message.includes('closed database') || 
                    error.message.includes('transaction') || 
                    error.name === 'InvalidStateError') {
                    
                    console.log('🔄 Reconectando a IndexedDB...');
                    this.isReady = false;
                    this.db = null;
                    this.initPromise = this.init();
                    
                    try {
                        await this.initPromise;
                        continue; // Reintentar con la nueva conexión
                    } catch (initError) {
                        console.error('❌ Error reconectando:', initError);
                    }
                }
                
                // Si no es el último intento, esperar antes de reintentar
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        throw lastError;
    }

    async getStats() {
        try {
            await this.ensureReady();
            
            const stats = {
                tasks: (await this.getAll('tasks')).length,
                projects: (await this.getAll('projects')).length,
                syncQueue: (await this.getAll('syncQueue')).length,
                cacheSize: (await this.getAll('cache')).length,
                dbSize: await this.estimateSize()
            };
            
            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {};
        }
    }

    async estimateSize() {
        try {
            if ('estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    available: estimate.quota,
                    usedMB: Math.round(estimate.usage / 1024 / 1024 * 100) / 100,
                    availableMB: Math.round(estimate.quota / 1024 / 1024 * 100) / 100
                };
            }
            return { message: 'Storage estimate not available' };
        } catch (error) {
            console.error('❌ Error estimando tamaño:', error);
            return {};
        }
    }

    // Backup completo de los datos
    async exportData() {
        try {
            await this.ensureReady();
            
            const data = {
                tasks: await this.getAll('tasks'),
                projects: await this.getAll('projects'),
                userConfig: await this.getAll('userConfig'),
                exportDate: new Date().toISOString(),
                version: this.dbVersion
            };
            
            return data;
        } catch (error) {
            console.error('❌ Error exportando datos:', error);
            throw error;
        }
    }

    // Importar datos desde backup
    async importData(data) {
        try {
            await this.ensureReady();
            
            // Limpiar datos existentes
            await this.clear('tasks');
            await this.clear('projects');
            await this.clear('userConfig');
            
            // Importar nuevos datos
            if (data.tasks) {
                for (const task of data.tasks) {
                    await this.put('tasks', task);
                }
            }
            
            if (data.projects) {
                for (const project of data.projects) {
                    await this.put('projects', project);
                }
            }
            
            if (data.userConfig) {
                for (const config of data.userConfig) {
                    await this.put('userConfig', config);
                }
            }
            
            if (window.IS_DEV) {
                console.log('✅ Datos importados correctamente');
            }
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            throw error;
        }
    }
}

// Crear instancia global
window.IndexedDBManager = new IndexedDBManager();

if (window.IS_DEV) {
    console.log('🗄️ IndexedDB Manager cargado');
}
