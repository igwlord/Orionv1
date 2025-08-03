// =================================================================================
// ORION PWA MANAGER - Web-First Approach
// =================================================================================

window.PWAManager = {
    // Registrar Service Worker
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            if (window.IS_DEV) {
                console.log('🔧 Service Worker registrado:', registration.scope);
            }
            
            // Manejar updates del service worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nueva versión disponible
                        this.showUpdateNotification();
                    }
                });
            });
            
            // Listen para mensajes del service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event.data);
            });
            
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    },

    // Mostrar notificación de update
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <i data-feather="download-cloud" class="w-5 h-5"></i>
                <span>Nueva versión disponible</span>
                <button onclick="window.location.reload()" class="bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium">
                    Actualizar
                </button>
            </div>
        `;
        document.body.appendChild(notification);
        if (window.IconUtils) {
            window.IconUtils.safeFeatherReplace(notification);
        }
        
        // Auto-remove después de 10 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    },

    // Monitorear estado de red
    setupNetworkMonitoring() {
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            document.body.classList.toggle('offline', !isOnline);
            
            if (!isOnline) {
                this.showOfflineIndicator();
            } else {
                this.hideOfflineIndicator();
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    },

    // Indicador offline
    showOfflineIndicator() {
        let indicator = document.getElementById('offline-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50';
            indicator.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <i data-feather="wifi-off" class="w-4 h-4"></i>
                    <span>Modo offline - Los cambios se sincronizarán cuando vuelvas a estar conectado</span>
                </div>
            `;
            document.body.appendChild(indicator);
            if (window.IconUtils) {
                window.IconUtils.safeFeatherReplace(indicator);
            }
        }
    },

    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    // Monitorear cache status
    setupCacheMonitoring() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            setInterval(() => {
                this.checkCacheHealth();
            }, 300000); // Check cada 5 minutos
        }
    },

    async checkCacheHealth() {
        try {
            if (navigator.serviceWorker.controller) {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    const cacheStatus = event.data;
                    if (window.IS_DEV) {
                        console.log('📊 Cache Status:', cacheStatus);
                    }
                };
                
                navigator.serviceWorker.controller.postMessage({
                    type: 'GET_CACHE_STATUS'
                }, [messageChannel.port2]);
            }
        } catch (error) {
            console.warn('Cache health check failed:', error);
        }
    },

    // Manejar mensajes del service worker
    handleServiceWorkerMessage(message) {
        if (message.type === 'BACKGROUND_SYNC') {
            if (message.action === 'sync-data') {
                this.syncPendingData();
            } else if (message.action === 'emergency-sync') {
                this.handleEmergencySync();
            }
        } else if (message.type === 'PERIODIC_SYNC') {
            if (message.action === 'maintenance-sync') {
                this.handleMaintenanceSync();
            }
        }
    },

    // Sincronizar datos pendientes
    async syncPendingData() {
        try {
            if (window.IS_DEV) {
                console.log('🔄 Sincronizando datos pendientes desde SW...');
            }
            
            // Usar el Data Sync Manager si está disponible
            if (window.DataSyncManager) {
                await window.DataSyncManager.syncPendingOperations();
            } else {
                // Fallback - recargar datos de Firebase
                if (window.App && window.App.refreshData) {
                    await window.App.refreshData();
                }
            }
        } catch (error) {
            console.warn('Data sync failed:', error);
        }
    },

    // Manejar sincronización de emergencia
    async handleEmergencySync() {
        try {
            if (window.IS_DEV) {
                console.log('🚨 Ejecutando sincronización de emergencia...');
            }
            
            if (window.DataSyncManager) {
                await window.DataSyncManager.forceSyncNow();
            }
        } catch (error) {
            console.warn('Emergency sync failed:', error);
        }
    },

    // Manejar sincronización de mantenimiento
    async handleMaintenanceSync() {
        try {
            if (window.IS_DEV) {
                console.log('🧹 Ejecutando sincronización de mantenimiento...');
            }
            
            // Limpiar cache expirado
            if (window.IndexedDBManager) {
                await window.IndexedDBManager.clearExpiredCache();
            }
            
            // Sincronizar datos pendientes
            if (window.DataSyncManager) {
                await window.DataSyncManager.syncPendingOperations();
            }
        } catch (error) {
            console.warn('Maintenance sync failed:', error);
        }
    },

    // Registrar background sync
    async registerBackgroundSync(tag = 'orion-data-sync') {
        try {
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register(tag);
                
                if (window.IS_DEV) {
                    console.log(`📋 Background sync registrado: ${tag}`);
                }
            }
        } catch (error) {
            console.warn('Background sync registration failed:', error);
        }
    },

    // Registrar periodic background sync (experimental)
    async registerPeriodicSync() {
        try {
            if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                
                if (status.state === 'granted') {
                    await registration.periodicSync.register('orion-periodic-sync', {
                        minInterval: 24 * 60 * 60 * 1000 // 24 horas
                    });
                    
                    if (window.IS_DEV) {
                        console.log('⏰ Periodic sync registrado');
                    }
                }
            }
        } catch (error) {
            // Periodic sync no está soportado en todos los navegadores
            if (window.IS_DEV) {
                console.log('ℹ️ Periodic sync no disponible');
            }
        }
    },

    // Inicializar PWA Manager
    init() {
        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Detectar si se ejecuta como PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;
        
        if (isStandalone) {
            document.body.classList.add('pwa-mode');
        }

        // Network status monitoring
        this.setupNetworkMonitoring();
        
        // Cache status monitoring
        this.setupCacheMonitoring();

        // Registrar background sync
        this.registerBackgroundSync();
        this.registerPeriodicSync();

        if (window.IS_DEV) {
            console.log('🚀 PWA Manager iniciado (Web-First)');
        }
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.PWAManager.init());
} else {
    window.PWAManager.init();
}
