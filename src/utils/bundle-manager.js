/**
 * ORION Bundle Manager
 * Sistema de gestión de bundles para carga optimizada
 */

class BundleManager {
    constructor() {
        this.bundles = new Map();
        this.loadedBundles = new Set();
        this.loadedComponents = new Set(); // Track individual components
        this.bundleQueue = [];
        this.isProduction = !window.IS_DEV;
        
        this.defineBundles();
    }

    /**
     * Definir bundles por funcionalidad
     */
    defineBundles() {
        // Bundle crítico - Incluir IndexedDB que es fundamental
        this.bundles.set('critical', {
            priority: 'high',
            preload: true,
            components: [
                { path: '/public/indexeddb-manager.js', type: 'storage', essential: true }
            ]
        });

        // Bundle de PWA - carga diferida
        this.bundles.set('pwa', {
            priority: 'medium', 
            defer: true,
            components: [
                { path: '/public/pwa-manager.js', type: 'pwa' },
                { path: '/public/sw.js', type: 'service-worker' },
                { path: '/public/app-shell-manager.js', type: 'pwa' }
            ]
        });

        // Bundle de features avanzadas - carga bajo demanda
        this.bundles.set('advanced', {
            priority: 'low',
            onDemand: true,
            components: [
                { path: '/public/keyboard-shortcuts.js', type: 'feature' },
                { path: '/public/gesture-handler.js', type: 'feature' },
                { path: '/public/loading-states.js', type: 'feature' }
            ]
        });

        // Bundle de sincronización - carga condicional (incluye IndexedDB para dependencias)
        this.bundles.set('sync', {
            priority: 'medium',
            conditional: 'online',
            components: [
                { path: '/public/indexeddb-manager.js', type: 'storage', essential: true },
                { path: '/public/data-sync-manager.js', type: 'sync' },
                { path: '/public/data-adapter.js', type: 'adapter' }
            ]
        });
    }

    /**
     * Cargar bundle específico
     */
    async loadBundle(bundleName, force = false) {
        if (!force && this.loadedBundles.has(bundleName)) {
            return { success: true, cached: true };
        }

        const bundle = this.bundles.get(bundleName);
        if (!bundle) {
            throw new Error(`Bundle '${bundleName}' not found`);
        }

        const startTime = performance.now();

        try {
            // Verificar condiciones para carga condicional
            if (bundle.conditional && !this.checkCondition(bundle.conditional)) {
                if (window.IS_DEV) {
                    console.log(`⏭️ Bundle '${bundleName}' skipped (condition: ${bundle.conditional})`);
                }
                return { success: false, reason: 'condition_not_met' };
            }

            // Cargar componentes del bundle
            const loadPromises = bundle.components.map(component => 
                this.loadComponent(component)
            );

            await Promise.all(loadPromises);

            this.loadedBundles.add(bundleName);
            
            const loadTime = performance.now() - startTime;
            
            if (window.IS_DEV) {
                Logger.info(`Bundle '${bundleName}' loaded (${loadTime.toFixed(2)}ms, ${bundle.components.length} components)`);
            }

            return { 
                success: true, 
                loadTime,
                componentCount: bundle.components.length 
            };

        } catch (error) {
            Logger.error(`Failed to load bundle '${bundleName}':`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cargar componente individual
     */
    async loadComponent(component) {
        const { path, type } = component;

        // Verificar si ya se cargó este componente
        if (this.loadedComponents && this.loadedComponents.has(path)) {
            if (window.IS_DEV) {
                Logger.info(`Component already loaded: ${path}`);
            }
            return;
        }

        try {
            // Determinar si es un módulo ES6
            const isModule = path.includes('/src/') || 
                           path.endsWith('.js') && !path.includes('public');

            if (isModule) {
                // Import dinámico para módulos ES6
                await import(/* @vite-ignore */ path);
            } else {
                // Usar resource optimizer para scripts tradicionales
                if (window.resourceOptimizer) {
                    await window.resourceOptimizer.lazyLoad(path, {
                        priority: this.getComponentPriority(type),
                        defer: type !== 'auth' && type !== 'firebase'
                    });
                } else {
                    // Fallback para carga directa
                    await this.loadScript(path);
                }
            }

            // Marcar componente como cargado
            this.loadedComponents.add(path);

        } catch (error) {
            Logger.error(`Failed to load component: ${path}`, error);
            throw error;
        }
    }

    /**
     * Carga directa de script (fallback)
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Obtener prioridad del componente
     */
    getComponentPriority(type) {
        const priorities = {
            'auth': 'high',
            'firebase': 'high', 
            'utility': 'high',
            'pwa': 'medium',
            'sync': 'medium',
            'storage': 'medium',
            'feature': 'low',
            'adapter': 'low'
        };

        return priorities[type] || 'low';
    }

    /**
     * Verificar condiciones para carga condicional
     */
    checkCondition(condition) {
        switch (condition) {
            case 'online':
                return navigator.onLine;
            case 'pwa':
                return window.matchMedia('(display-mode: standalone)').matches;
            case 'mobile':
                return window.innerWidth <= 768;
            case 'desktop':
                return window.innerWidth > 768;
            default:
                return true;
        }
    }

    /**
     * Estrategia de carga automática basada en contexto
     */
    async autoLoad() {
        const loadingStrategy = this.determineLoadingStrategy();
        
        if (window.IS_DEV) {
        if (window.IS_DEV) {
            Logger.info(`Loading strategy: ${loadingStrategy}`);
        }
        }

        switch (loadingStrategy) {
            case 'critical-only':
                await this.loadBundle('critical');
                break;
                
            case 'progressive':
                await this.loadBundle('critical');
                setTimeout(() => this.loadBundle('pwa'), 1000);
                setTimeout(() => this.loadBundle('sync'), 2000);
                break;
                
            case 'full':
                await Promise.all([
                    this.loadBundle('critical'),
                    this.loadBundle('pwa'),
                    this.loadBundle('sync')
                ]);
                break;
        }
    }

    /**
     * Determinar estrategia de carga
     */
    determineLoadingStrategy() {
        // Factores para determinar estrategia
        const isSlowConnection = this.isSlowConnection();
        const isLowMemory = this.isLowMemoryDevice();
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;

        if (isSlowConnection || isLowMemory) {
            return 'critical-only';
        } else if (isPWA) {
            return 'full';
        } else {
            return 'progressive';
        }
    }

    /**
     * Detectar conexión lenta
     */
    isSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return connection.effectiveType === 'slow-2g' || 
                   connection.effectiveType === '2g' ||
                   connection.downlink < 1.5;
        }
        return false;
    }

    /**
     * Detectar dispositivo de baja memoria
     */
    isLowMemoryDevice() {
        if ('deviceMemory' in navigator) {
            return navigator.deviceMemory < 4; // Menos de 4GB
        }
        return false;
    }

    /**
     * Cargar bundle bajo demanda
     */
    async loadOnDemand(bundleName, trigger) {
        if (window.IS_DEV) {
            console.log(`🔄 Loading bundle '${bundleName}' on demand (trigger: ${trigger})`);
        }

        return await this.loadBundle(bundleName);
    }

    /**
     * Precargar bundles basado en interacción del usuario
     */
    setupIntelligentPreloading() {
        // Precargar advanced features cuando el usuario interactúa
        let interactionTimer;
        
        const preloadAdvanced = () => {
            clearTimeout(interactionTimer);
            interactionTimer = setTimeout(() => {
                if (!this.loadedBundles.has('advanced')) {
                    this.loadBundle('advanced');
                }
            }, 3000); // 3 segundos después de la última interacción
        };

        // Eventos que sugieren que el usuario está activo
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, preloadAdvanced, { passive: true });
        });
    }

    /**
     * Obtener estadísticas de bundles
     */
    getStats() {
        const stats = {
            totalBundles: this.bundles.size,
            loadedBundles: this.loadedBundles.size,
            loadingProgress: (this.loadedBundles.size / this.bundles.size) * 100,
            bundles: {}
        };

        this.bundles.forEach((bundle, name) => {
            stats.bundles[name] = {
                loaded: this.loadedBundles.has(name),
                componentCount: bundle.components.length,
                priority: bundle.priority
            };
        });

        return stats;
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        this.bundleQueue.length = 0;
        // Mantener información de bundles cargados para evitar recargas
    }
}

// Instancia global
window.bundleManager = new BundleManager();

export default BundleManager;
