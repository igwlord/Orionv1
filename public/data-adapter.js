// =================================================================================
// ORION DATA ADAPTER - Bridge between App and Data Layer
// =================================================================================

class DataAdapter {
    constructor() {
        this.useFirebase = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // ✨ Esperar a que IndexedDBManager esté disponible con reintentos
            await this.waitForIndexedDBManager();
            
            // Verificar si podemos usar Firebase
            this.useFirebase = this.canUseFirebase();
            
            if (window.IS_DEV) {
                console.log(`📊 Data Adapter iniciado - Firebase: ${this.useFirebase}`);
            }
        } catch (error) {
            console.error('❌ Error inicializando Data Adapter:', error);
            // No re-lanzar el error para evitar romper la cadena de inicialización
        }
    }

    // ✨ NUEVO: Esperar a que IndexedDBManager esté disponible
    async waitForIndexedDBManager(maxAttempts = 30, delay = 150) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            // Verificar que IndexedDBManager existe y está inicializado
            if (window.IndexedDBManager && 
                typeof window.IndexedDBManager === 'object' &&
                window.IndexedDBManager.initPromise) {
                
                try {
                    await window.IndexedDBManager.initPromise;
                    
                    // Verificación adicional de que los métodos están disponibles
                    if (typeof window.IndexedDBManager.get === 'function') {
                        if (window.IS_DEV) {
                            console.log(`✅ IndexedDBManager verificado (intento ${attempt})`);
                        }
                        return;
                    }
                } catch (error) {
                    if (window.IS_DEV) {
                        console.warn(`⚠️ Error esperando IndexedDBManager (intento ${attempt}):`, error);
                    }
                }
            }
            
            if (window.IS_DEV && attempt % 5 === 0) {
                console.log(`⏳ Esperando IndexedDBManager... (intento ${attempt}/${maxAttempts})`);
                console.log(`🔍 Estado actual:`, {
                    exists: !!window.IndexedDBManager,
                    type: typeof window.IndexedDBManager,
                    hasInitPromise: !!(window.IndexedDBManager?.initPromise)
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.warn('⚠️ IndexedDBManager no disponible después de esperar, continuando sin él...');
        // No lanzar error, solo advertir
    }

    canUseFirebase() {
        return window.authManager && 
               window.authManager.isAuthenticated && 
               window.authManager.isAuthenticated() &&
               window.dataManager &&
               navigator.onLine;
    }

    // ✨ Helper para verificar disponibilidad de IndexedDBManager
    isIndexedDBReady() {
        return window.IndexedDBManager && 
               typeof window.IndexedDBManager === 'object' &&
               typeof window.IndexedDBManager.get === 'function';
    }

    // =================================================================================
    // MÉTODOS DE TAREAS
    // =================================================================================
    async saveTarea(taskData) {
        try {
            await this.initPromise;
            
            // Asegurar que tenga ID
            if (!taskData.id) {
                taskData.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Usar Data Sync Manager para guardado optimista
            if (window.DataSyncManager) {
                return await window.DataSyncManager.saveTaskOptimistic(taskData);
            } else if (this.isIndexedDBReady()) {
                // Fallback directo a IndexedDB si está disponible
                return await window.IndexedDBManager.saveTask(taskData);
            } else {
                console.warn('⚠️ No hay sistemas de almacenamiento disponibles');
                return taskData; // Retornar datos sin guardar
            }
        } catch (error) {
            console.error('❌ Error guardando tarea:', error);
            throw error;
        }
    }

    async obtenerTareas(filters = {}) {
        try {
            await this.initPromise;
            
            // Verificar que IndexedDB esté disponible
            if (this.isIndexedDBReady()) {
                return await window.IndexedDBManager.getTasks(filters);
            } else {
                console.warn('⚠️ IndexedDBManager no disponible para obtener tareas');
                return [];
            }
        } catch (error) {
            console.error('❌ Error obteniendo tareas:', error);
            return [];
        }
    }

    async eliminarTarea(taskId) {
        try {
            await this.initPromise;
            
            if (window.DataSyncManager) {
                return await window.DataSyncManager.deleteTaskOptimistic(taskId);
            } else if (this.isIndexedDBReady()) {
                return await window.IndexedDBManager.deleteTask(taskId);
            } else {
                console.warn('⚠️ No hay sistemas de almacenamiento disponibles para eliminar');
                return false;
            }
        } catch (error) {
            console.error('❌ Error eliminando tarea:', error);
            throw error;
        }
    }

    async actualizarTarea(taskId, updates) {
        try {
            await this.initPromise;
            
            // Obtener tarea actual
            const currentTask = await window.IndexedDBManager.get('tasks', taskId);
            if (!currentTask) {
                throw new Error(`Tarea ${taskId} no encontrada`);
            }
            
            // Fusionar cambios
            const updatedTask = { ...currentTask, ...updates, lastModified: Date.now() };
            
            return await this.saveTarea(updatedTask);
        } catch (error) {
            console.error('❌ Error actualizando tarea:', error);
            throw error;
        }
    }

    // =================================================================================
    // MÉTODOS DE PROYECTOS
    // =================================================================================
    async guardarProyecto(projectData) {
        try {
            await this.initPromise;
            
            if (!projectData.id) {
                projectData.id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            if (window.DataSyncManager) {
                return await window.DataSyncManager.saveProjectOptimistic(projectData);
            } else {
                return await window.IndexedDBManager.saveProject(projectData);
            }
        } catch (error) {
            console.error('❌ Error guardando proyecto:', error);
            throw error;
        }
    }

    async obtenerProyectos() {
        try {
            await this.initPromise;
            return await window.IndexedDBManager.getProjects();
        } catch (error) {
            console.error('❌ Error obteniendo proyectos:', error);
            return [];
        }
    }

    async eliminarProyecto(projectId) {
        try {
            await this.initPromise;
            
            // Eliminar el proyecto
            await window.IndexedDBManager.delete('projects', projectId);
            
            // Añadir a cola de sync si no es temporal
            if (!projectId.startsWith('temp_') && window.IndexedDBManager) {
                await window.IndexedDBManager.addToSyncQueue({
                    type: 'delete',
                    entity: 'project',
                    data: { id: projectId }
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error eliminando proyecto:', error);
            throw error;
        }
    }

    // =================================================================================
    // MÉTODOS DE CONFIGURACIÓN
    // =================================================================================
    async guardarConfiguracion(key, value) {
        try {
            await this.initPromise;
            
            if (this.isIndexedDBReady()) {
                const config = { key, value, lastModified: Date.now() };
                await window.IndexedDBManager.put('userConfig', config);
                return config;
            } else {
                console.warn('⚠️ IndexedDBManager no disponible para guardar configuración');
                return { key, value, lastModified: Date.now() };
            }
        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
            throw error;
        }
    }

    async obtenerConfiguracion(key) {
        try {
            await this.initPromise;
            
            if (this.isIndexedDBReady()) {
                const config = await window.IndexedDBManager.get('userConfig', key);
                return config ? config.value : null;
            } else {
                console.warn('⚠️ IndexedDBManager no disponible para obtener configuración');
                return null;
            }
        } catch (error) {
            console.error('❌ Error obteniendo configuración:', error);
            return null;
        }
    }

    // =================================================================================
    // MÉTODOS DE EXPORTACIÓN/IMPORTACIÓN
    // =================================================================================
    async exportarDatos() {
        try {
            await this.initPromise;
            return await window.IndexedDBManager.exportData();
        } catch (error) {
            console.error('❌ Error exportando datos:', error);
            throw error;
        }
    }

    async importarDatos(data) {
        try {
            await this.initPromise;
            await window.IndexedDBManager.importData(data);
            
            // Trigger refresh de la UI
            if (window.App && window.App.refreshData) {
                await window.App.refreshData();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            throw error;
        }
    }

    // =================================================================================
    // MÉTODOS DE ESTADÍSTICAS
    // =================================================================================
    async obtenerEstadisticas() {
        try {
            await this.initPromise;
            
            const dbStats = await window.IndexedDBManager.getStats();
            const syncStats = window.DataSyncManager ? await window.DataSyncManager.getStats() : {};
            
            return {
                ...dbStats,
                ...syncStats,
                useFirebase: this.useFirebase,
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {};
        }
    }

    // =================================================================================
    // MÉTODOS DE SINCRONIZACIÓN
    // =================================================================================
    async forzarSincronizacion() {
        try {
            if (window.DataSyncManager) {
                await window.DataSyncManager.forceSyncNow();
                return { success: true, message: 'Sincronización completada' };
            } else {
                throw new Error('Data Sync Manager no disponible');
            }
        } catch (error) {
            console.error('❌ Error en sincronización forzada:', error);
            throw error;
        }
    }

    async obtenerColaSincronizacion() {
        try {
            await this.initPromise;
            return await window.IndexedDBManager.getSyncQueue();
        } catch (error) {
            console.error('❌ Error obteniendo cola de sincronización:', error);
            return [];
        }
    }

    // =================================================================================
    // MÉTODOS DE MIGRACIÓN DESDE LOCALSTORAGE
    // =================================================================================
    async migrarDesdeLocalStorage() {
        try {
            // Verificar si hay datos en localStorage
            const localTasks = localStorage.getItem('orion_tasks');
            const localProjects = localStorage.getItem('orion_projects');
            const localConfig = localStorage.getItem('orion_user_config');
            
            if (!localTasks && !localProjects && !localConfig) {
                return { migrated: false, message: 'No hay datos para migrar' };
            }
            
            let migratedCount = 0;
            
            // Migrar tareas
            if (localTasks) {
                try {
                    const tasks = JSON.parse(localTasks);
                    for (const task of tasks) {
                        await window.IndexedDBManager.saveTask(task);
                        migratedCount++;
                    }
                } catch (e) {
                    console.warn('Error migrando tareas:', e);
                }
            }
            
            // Migrar proyectos
            if (localProjects) {
                try {
                    const projects = JSON.parse(localProjects);
                    for (const project of projects) {
                        await window.IndexedDBManager.saveProject(project);
                        migratedCount++;
                    }
                } catch (e) {
                    console.warn('Error migrando proyectos:', e);
                }
            }
            
            // Migrar configuración
            if (localConfig) {
                try {
                    const config = JSON.parse(localConfig);
                    for (const [key, value] of Object.entries(config)) {
                        await this.guardarConfiguracion(key, value);
                        migratedCount++;
                    }
                } catch (e) {
                    console.warn('Error migrando configuración:', e);
                }
            }
            
            if (window.IS_DEV) {
                console.log(`✅ Migración completada: ${migratedCount} elementos`);
            }
            
            return { 
                migrated: true, 
                count: migratedCount,
                message: `Se migraron ${migratedCount} elementos desde localStorage`
            };
        } catch (error) {
            console.error('❌ Error en migración:', error);
            return { migrated: false, error: error.message };
        }
    }

    // =================================================================================
    // MÉTODOS DE CACHE
    // =================================================================================
    async setCache(key, data, ttlMinutes = 60) {
        try {
            await this.initPromise;
            await window.IndexedDBManager.setCache(key, data, ttlMinutes);
        } catch (error) {
            console.error('❌ Error guardando en cache:', error);
        }
    }

    async getCache(key) {
        try {
            await this.initPromise;
            return await window.IndexedDBManager.getCache(key);
        } catch (error) {
            console.error('❌ Error obteniendo cache:', error);
            return null;
        }
    }
}

// Crear instancia global
window.DataAdapter = new DataAdapter();

// Auto-migrar desde localStorage al cargar
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const result = await window.DataAdapter.migrarDesdeLocalStorage();
        if (result.migrated && window.IS_DEV) {
            console.log('📦 Migración desde localStorage:', result.message);
        }
    } catch (error) {
        console.warn('Migración automática falló:', error);
    }
});

if (window.IS_DEV) {
    console.log('🔗 Data Adapter cargado');
}
