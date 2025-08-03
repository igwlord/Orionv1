/**
 * ORION Resource Optimizer
 * Sistema inteligente de optimización de recursos para máximo rendimiento
 */

class ResourceOptimizer {
    constructor() {
        this.loadedResources = new Set();
        this.criticalResources = new Set(['auth.js', 'firebase-init.js', 'logger.js']);
        this.deferredResources = new Map();
        this.preloadQueue = [];
        this.isProduction = !window.IS_DEV;
        
        // Performance observer para métricas
        this.performanceObserver = null;
        this.metrics = {
            resourceLoadTimes: new Map(),
            bundleSize: 0,
            criticalPathLength: 0
        };
        
        this.init();
    }

    init() {
        if (this.isProduction) {
            this.setupPerformanceMonitoring();
            this.optimizeCriticalPath();
            this.setupResourceHints();
        }
    }

    /**
     * Carga lazy de recursos no críticos
     */
    async lazyLoad(resourcePath, options = {}) {
        const { 
            priority = 'low',
            defer = true,
            preload = false,
            module = null // auto-detect si no se especifica
        } = options;

        if (this.loadedResources.has(resourcePath)) {
            return Promise.resolve();
        }

        const startTime = performance.now();

        try {
            let script;
            
            // Auto-detectar si es un módulo
            const isModule = module !== null ? module : 
                           (resourcePath.includes('/src/') || 
                            resourcePath.includes('firebase') ||
                            resourcePath.includes('auth'));
            
            if (isModule && !resourcePath.startsWith('http')) {
                // Import dinámico para módulos ES6 locales
                await import(/* @vite-ignore */ resourcePath);
            } else {
                // Script tag tradicional para CDNs y scripts no-module
                script = document.createElement('script');
                script.src = resourcePath;
                script.defer = defer;
                
                if (preload) {
                    script.rel = 'preload';
                    script.as = 'script';
                }

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            this.loadedResources.add(resourcePath);
            
            const loadTime = performance.now() - startTime;
            this.metrics.resourceLoadTimes.set(resourcePath, loadTime);
            
            if (window.IS_DEV) {
                console.log(`✅ Resource loaded: ${resourcePath} (${loadTime.toFixed(2)}ms)`);
            }

        } catch (error) {
            console.error(`❌ Failed to load resource: ${resourcePath}`, error);
            throw error;
        }
    }

    /**
     * Preload de recursos críticos
     */
    preloadCriticalResources() {
        const criticalPaths = [
            '/src/auth.js',
            '/src/firebase-init.js', 
            '/src/utils/logger.js',
            '/src/utils/storage.js'
        ];

        criticalPaths.forEach(path => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = path;
            document.head.appendChild(link);
        });
    }

    /**
     * Setup de resource hints para mejor performance
     */
    setupResourceHints() {
        // DNS prefetch para Firebase
        this.addResourceHint('dns-prefetch', 'https://firebaseapp.com');
        this.addResourceHint('dns-prefetch', 'https://firestore.googleapis.com');
        
        // Preconnect para CDNs
        this.addResourceHint('preconnect', 'https://unpkg.com');
        this.addResourceHint('preconnect', 'https://cdn.jsdelivr.net');

        // Prefetch de recursos probablemente necesarios
        this.addResourceHint('prefetch', '/public/app-shell-manager.js');
        this.addResourceHint('prefetch', '/public/data-sync-manager.js');
    }

    addResourceHint(rel, href) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        document.head.appendChild(link);
    }

    /**
     * Optimización del critical path
     */
    optimizeCriticalPath() {
        // Identificar y cargar solo recursos críticos inicialmente
        const criticalStylesInline = `
            .skeleton { animation: skeleton-loading 1.2s ease-in-out infinite alternate; }
            @keyframes skeleton-loading { 0% { opacity: 1; } 100% { opacity: 0.4; } }
            .transition-fast { transition: all 0.15s ease; }
        `;

        const style = document.createElement('style');
        style.textContent = criticalStylesInline;
        document.head.appendChild(style);
    }

    /**
     * Configurar monitoreo de performance
     */
    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'resource') {
                        this.trackResourcePerformance(entry);
                    }
                }
            });

            this.performanceObserver.observe({ entryTypes: ['resource'] });
        }
    }

    trackResourcePerformance(entry) {
        const { name, duration, transferSize } = entry;
        
        this.metrics.bundleSize += transferSize || 0;
        
        if (window.IS_DEV) {
            console.log(`📊 Resource: ${name.split('/').pop()} - ${duration.toFixed(2)}ms - ${(transferSize/1024).toFixed(2)}KB`);
        }
    }

    /**
     * Bundle splitting dinámico
     */
    async loadBundle(bundleName, components = []) {
        if (this.loadedResources.has(bundleName)) {
            return;
        }

        const bundleStartTime = performance.now();

        try {
            // Cargar componentes del bundle en paralelo
            const loadPromises = components.map(component => 
                this.lazyLoad(component.path, component.options || {})
            );

            await Promise.all(loadPromises);

            const bundleLoadTime = performance.now() - bundleStartTime;
            
            if (window.IS_DEV) {
                console.log(`📦 Bundle '${bundleName}' loaded in ${bundleLoadTime.toFixed(2)}ms`);
            }

            this.loadedResources.add(bundleName);

        } catch (error) {
            console.error(`❌ Bundle '${bundleName}' failed to load:`, error);
        }
    }

    /**
     * Optimización de imágenes y assets
     */
    optimizeAssets() {
        // Lazy loading de imágenes
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    /**
     * Cleanup de recursos no utilizados
     */
    cleanup() {
        // Remover event listeners innecesarios
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }

        // Limpiar caches temporales
        this.deferredResources.clear();
        this.preloadQueue.length = 0;
    }

    /**
     * Obtener métricas de performance
     */
    getPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
            ...this.metrics,
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
            pageLoad: navigation?.loadEventEnd - navigation?.loadEventStart,
            firstContentfulPaint: this.getFirstContentfulPaint(),
            resourceCount: this.loadedResources.size,
            totalBundleSize: `${(this.metrics.bundleSize / 1024).toFixed(2)} KB`
        };
    }

    getFirstContentfulPaint() {
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        return fcp ? fcp.startTime : null;
    }

    /**
     * Reportar métricas (solo en desarrollo)
     */
    reportMetrics() {
        if (!window.IS_DEV) return;

        const metrics = this.getPerformanceMetrics();
        console.group('🚀 ORION Performance Metrics');
        console.table(metrics);
        console.groupEnd();
    }
}

// Instancia global
window.resourceOptimizer = new ResourceOptimizer();

export default ResourceOptimizer;
