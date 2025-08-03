// =================================================================================
// ORION DATA SYNC MANAGER - Background Sync & Conflict Resolution
// =================================================================================

class DataSyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.conflictResolver = new ConflictResolver();
        this.retryTimeouts = new Map();
        
        this.setupEventListeners();
        this.startPeriodicSync();
    }

    // =================================================================================
    // INICIALIZACIÓN Y EVENT LISTENERS
    // =================================================================================
    setupEventListeners() {
        // Monitorear cambios de conectividad
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionRestored();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onConnectionLost();
        });

        // Escuchar mensajes del service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'BACKGROUND_SYNC') {
                    this.handleBackgroundSync(event.data);
                }
            });
        }
    }

    onConnectionRestored() {
        if (window.IS_DEV) {
            console.log('🟢 Conexión restaurada - iniciando sincronización');
        }
        
        // Mostrar indicador de sincronización
        this.showSyncIndicator();
        
        // Intentar sincronizar inmediatamente
        setTimeout(() => {
            this.syncPendingOperations();
        }, 1000);
    }

    onConnectionLost() {
        if (window.IS_DEV) {
            console.log('🔴 Conexión perdida - modo offline activado');
        }
        
        this.hideSyncIndicator();
    }

    // =================================================================================
    // OPERACIONES DE SINCRONIZACIÓN
    // =================================================================================
    async syncPendingOperations() {
        if (this.syncInProgress || !this.isOnline) {
            return;
        }

        try {
            this.syncInProgress = true;
            
            const pendingOperations = await window.IndexedDBManager.getSyncQueue();
            
            if (pendingOperations.length === 0) {
                if (window.IS_DEV) {
                    console.log('✅ No hay operaciones pendientes de sincronización');
                }
                this.hideSyncIndicator();
                return;
            }

            if (window.IS_DEV) {
                console.log(`🔄 Sincronizando ${pendingOperations.length} operaciones pendientes`);
            }

            for (const operation of pendingOperations) {
                await this.syncOperation(operation);
            }

            this.hideSyncIndicator();
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            this.showSyncError();
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncOperation(operation) {
        try {
            // Marcar como en progreso
            operation.status = 'syncing';
            await window.IndexedDBManager.put('syncQueue', operation);

            let result;
            
            switch (operation.entity) {
                case 'task':
                    result = await this.syncTask(operation);
                    break;
                case 'project':
                    result = await this.syncProject(operation);
                    break;
                default:
                    throw new Error(`Tipo de entidad desconocido: ${operation.entity}`);
            }

            // Marcar como completado
            await window.IndexedDBManager.markSyncCompleted(operation.id);
            
            if (window.IS_DEV) {
                console.log('✅ Operación sincronizada:', operation.type, operation.entity);
            }

        } catch (error) {
            console.error('❌ Error sincronizando operación:', error);
            
            // Marcar como fallido e incrementar retry count
            await window.IndexedDBManager.markSyncFailed(operation.id);
            
            // Programar retry si no se han agotado los intentos
            if (operation.retryCount < operation.maxRetries) {
                this.scheduleRetry(operation);
            }
        }
    }

    async syncTask(operation) {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            // Si no hay autenticación, marcar como completado localmente
            return { success: true, local: true };
        }

        const { type, data } = operation;

        switch (type) {
            case 'create':
            case 'update':
                return await this.uploadTaskToFirestore(data);
            case 'delete':
                return await this.deleteTaskFromFirestore(data.id);
            default:
                throw new Error(`Tipo de operación desconocido: ${type}`);
        }
    }

    async syncProject(operation) {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            return { success: true, local: true };
        }

        const { type, data } = operation;

        switch (type) {
            case 'create':
            case 'update':
                return await this.uploadProjectToFirestore(data);
            case 'delete':
                return await this.deleteProjectFromFirestore(data.id);
            default:
                throw new Error(`Tipo de operación desconocido: ${type}`);
        }
    }

    // =================================================================================
    // OPERACIONES ESPECÍFICAS DE FIRESTORE
    // =================================================================================
    async uploadTaskToFirestore(task) {
        try {
            if (!window.dataManager) {
                throw new Error('DataManager no disponible');
            }

            // Verificar si ya existe en Firestore
            const existingTask = await window.dataManager.getTask(task.id);
            
            if (existingTask) {
                // Resolver conflictos si existe
                const resolvedTask = await this.conflictResolver.resolveTaskConflict(task, existingTask);
                await window.dataManager.updateTask(resolvedTask.id, resolvedTask);
                
                // Actualizar también en IndexedDB con la versión resuelta
                await window.IndexedDBManager.saveTask(resolvedTask);
                
                return { success: true, resolved: true, task: resolvedTask };
            } else {
                // Crear nueva tarea
                await window.dataManager.createTask(task);
                return { success: true, created: true };
            }
        } catch (error) {
            console.error('❌ Error subiendo tarea a Firestore:', error);
            throw error;
        }
    }

    async uploadProjectToFirestore(project) {
        try {
            if (!window.dataManager) {
                throw new Error('DataManager no disponible');
            }

            const existingProject = await window.dataManager.getProject(project.id);
            
            if (existingProject) {
                const resolvedProject = await this.conflictResolver.resolveProjectConflict(project, existingProject);
                await window.dataManager.updateProject(resolvedProject.id, resolvedProject);
                await window.IndexedDBManager.saveProject(resolvedProject);
                
                return { success: true, resolved: true, project: resolvedProject };
            } else {
                await window.dataManager.createProject(project);
                return { success: true, created: true };
            }
        } catch (error) {
            console.error('❌ Error subiendo proyecto a Firestore:', error);
            throw error;
        }
    }

    async deleteTaskFromFirestore(taskId) {
        try {
            if (!window.dataManager) {
                throw new Error('DataManager no disponible');
            }

            await window.dataManager.deleteTask(taskId);
            return { success: true, deleted: true };
        } catch (error) {
            console.error('❌ Error eliminando tarea de Firestore:', error);
            throw error;
        }
    }

    async deleteProjectFromFirestore(projectId) {
        try {
            if (!window.dataManager) {
                throw new Error('DataManager no disponible');
            }

            await window.dataManager.deleteProject(projectId);
            return { success: true, deleted: true };
        } catch (error) {
            console.error('❌ Error eliminando proyecto de Firestore:', error);
            throw error;
        }
    }

    // =================================================================================
    // OPERACIONES OPTIMISTAS
    // =================================================================================
    async saveTaskOptimistic(task) {
        try {
            // 1. Guardar inmediatamente en IndexedDB
            const savedTask = await window.IndexedDBManager.saveTask(task);
            
            // 2. Añadir a cola de sincronización
            await window.IndexedDBManager.addToSyncQueue({
                type: task.id.startsWith('temp_') ? 'create' : 'update',
                entity: 'task',
                data: savedTask
            });
            
            // 3. Intentar sincronizar si estamos online
            if (this.isOnline) {
                // No esperar - sincronizar en background
                setTimeout(() => this.syncPendingOperations(), 100);
            }
            
            return savedTask;
        } catch (error) {
            console.error('❌ Error en guardado optimista de tarea:', error);
            throw error;
        }
    }

    async saveProjectOptimistic(project) {
        try {
            const savedProject = await window.IndexedDBManager.saveProject(project);
            
            await window.IndexedDBManager.addToSyncQueue({
                type: project.id.startsWith('temp_') ? 'create' : 'update',
                entity: 'project',
                data: savedProject
            });
            
            if (this.isOnline) {
                setTimeout(() => this.syncPendingOperations(), 100);
            }
            
            return savedProject;
        } catch (error) {
            console.error('❌ Error en guardado optimista de proyecto:', error);
            throw error;
        }
    }

    async deleteTaskOptimistic(taskId) {
        try {
            // 1. Obtener la tarea antes de eliminarla
            const task = await window.IndexedDBManager.get('tasks', taskId);
            
            // 2. Eliminar de IndexedDB
            await window.IndexedDBManager.deleteTask(taskId);
            
            // 3. Añadir eliminación a cola de sincronización
            if (task && !task.id.startsWith('temp_')) {
                await window.IndexedDBManager.addToSyncQueue({
                    type: 'delete',
                    entity: 'task',
                    data: { id: taskId }
                });
                
                if (this.isOnline) {
                    setTimeout(() => this.syncPendingOperations(), 100);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error en eliminación optimista de tarea:', error);
            throw error;
        }
    }

    // =================================================================================
    // MANEJO DE RETRY Y TIMEOUTS
    // =================================================================================
    scheduleRetry(operation) {
        const retryDelay = Math.min(1000 * Math.pow(2, operation.retryCount), 30000); // Exponential backoff, max 30s
        
        const timeoutId = setTimeout(() => {
            this.syncOperation(operation);
            this.retryTimeouts.delete(operation.id);
        }, retryDelay);
        
        this.retryTimeouts.set(operation.id, timeoutId);
        
        if (window.IS_DEV) {
            console.log(`⏰ Retry programado para operación ${operation.id} en ${retryDelay}ms`);
        }
    }

    // =================================================================================
    // SINCRONIZACIÓN PERIÓDICA
    // =================================================================================
    startPeriodicSync() {
        // Sincronizar cada 5 minutos si estamos online
        setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.syncPendingOperations();
            }
        }, 5 * 60 * 1000);

        // Limpiar cache expirado cada hora
        setInterval(() => {
            window.IndexedDBManager.clearExpiredCache();
        }, 60 * 60 * 1000);
    }

    // =================================================================================
    // UI INDICATORS
    // =================================================================================
    showSyncIndicator() {
        let indicator = document.getElementById('sync-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'sync-indicator';
            indicator.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2';
            indicator.innerHTML = `
                <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span class="text-sm">Sincronizando...</span>
            `;
            document.body.appendChild(indicator);
        }
    }

    hideSyncIndicator() {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showSyncError() {
        let errorIndicator = document.getElementById('sync-error');
        if (!errorIndicator) {
            errorIndicator = document.createElement('div');
            errorIndicator.id = 'sync-error';
            errorIndicator.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2';
            errorIndicator.innerHTML = `
                <i data-feather="alert-circle" class="w-4 h-4"></i>
                <span class="text-sm">Error de sincronización</span>
                <button onclick="this.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">×</button>
            `;
            document.body.appendChild(errorIndicator);
            
            if (window.IconUtils) {
                window.IconUtils.safeFeatherReplace(errorIndicator);
            }
            
            // Auto-remove después de 5 segundos
            setTimeout(() => {
                if (errorIndicator.parentNode) {
                    errorIndicator.remove();
                }
            }, 5000);
        }
    }

    // =================================================================================
    // BACKGROUND SYNC HANDLER
    // =================================================================================
    handleBackgroundSync(data) {
        if (data.action === 'sync-data') {
            this.syncPendingOperations();
        }
    }

    // =================================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================================
    async getStats() {
        try {
            const dbStats = await window.IndexedDBManager.getStats();
            const syncQueue = await window.IndexedDBManager.getSyncQueue();
            
            return {
                ...dbStats,
                pendingSync: syncQueue.length,
                isOnline: this.isOnline,
                syncInProgress: this.syncInProgress
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de sync:', error);
            return {};
        }
    }

    async forceSyncNow() {
        if (this.isOnline) {
            this.showSyncIndicator();
            await this.syncPendingOperations();
        } else {
            throw new Error('No hay conexión disponible para sincronizar');
        }
    }
}

// =================================================================================
// CONFLICT RESOLVER
// =================================================================================
class ConflictResolver {
    async resolveTaskConflict(localTask, remoteTask) {
        if (window.IS_DEV) {
            console.log('🔄 Resolviendo conflicto de tarea:', localTask.name);
        }

        // Estrategia: El más reciente gana (Last Write Wins)
        const localTime = localTask.lastModified || 0;
        const remoteTime = remoteTask.lastModified || 0;

        if (localTime > remoteTime) {
            // La versión local es más reciente
            return { ...localTask, remoteVersion: remoteTask.remoteVersion };
        } else if (remoteTime > localTime) {
            // La versión remota es más reciente
            return { ...remoteTask, localVersion: localTask.localVersion };
        } else {
            // Mismo timestamp - fusionar cambios importantes
            return this.mergeTaskChanges(localTask, remoteTask);
        }
    }

    async resolveProjectConflict(localProject, remoteProject) {
        if (window.IS_DEV) {
            console.log('🔄 Resolviendo conflicto de proyecto:', localProject.name);
        }

        const localTime = localProject.lastModified || 0;
        const remoteTime = remoteProject.lastModified || 0;

        if (localTime > remoteTime) {
            return { ...localProject, remoteVersion: remoteProject.remoteVersion };
        } else {
            return { ...remoteProject, localVersion: localProject.localVersion };
        }
    }

    mergeTaskChanges(localTask, remoteTask) {
        // Fusionar cambios de manera inteligente
        return {
            ...remoteTask,
            // Preservar cambios locales importantes
            status: localTask.status !== remoteTask.status ? localTask.status : remoteTask.status,
            priority: localTask.priority || remoteTask.priority,
            description: localTask.description || remoteTask.description,
            lastModified: Math.max(localTask.lastModified || 0, remoteTask.lastModified || 0),
            conflictResolved: true,
            conflictResolvedAt: Date.now()
        };
    }
}

// Crear instancia global
window.DataSyncManager = new DataSyncManager();

if (window.IS_DEV) {
    console.log('🔄 Data Sync Manager cargado');
}
