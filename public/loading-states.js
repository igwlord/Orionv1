// =================================================================================
// ORION LOADING STATES - Refined Performance UX
// =================================================================================

class LoadingStates {
    constructor() {
        this.loadingStates = new Map();
        this.globalLoadingActive = false;
        this.skeletonTemplates = new Map();
        
        this.init();
    }

    // =================================================================================
    // INICIALIZACIÓN
    // =================================================================================
    init() {
        this.createSkeletonTemplates();
        this.setupGlobalLoadingOverlay();
        this.setupPerformanceMetrics();
        
        if (window.IS_DEV) {
            console.log('⏳ Loading States Manager iniciado');
        }
    }

    setupGlobalLoadingOverlay() {
        // Método placeholder para configuración global
        if (window.IS_DEV) {
            console.log('⏳ Global loading overlay configurado');
        }
    }

    // =================================================================================
    // SKELETON TEMPLATES
    // =================================================================================
    createSkeletonTemplates() {
        // Template para cards de tareas
        this.skeletonTemplates.set('task-card', `
            <div class="task-card-skeleton bg-theme-card p-4 rounded-lg border border-theme animate-pulse">
                <div class="flex items-start gap-3">
                    <div class="w-4 h-4 bg-gray-300 rounded mt-1"></div>
                    <div class="flex-1">
                        <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
                        <div class="flex gap-2">
                            <div class="h-6 bg-gray-300 rounded-full w-16"></div>
                            <div class="h-6 bg-gray-300 rounded-full w-20"></div>
                        </div>
                    </div>
                    <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                </div>
            </div>
        `);

        // Template para calendario
        this.skeletonTemplates.set('calendar-grid', `
            <div class="calendar-skeleton">
                <div class="grid grid-cols-7 gap-1 mb-4">
                    ${Array(7).fill(0).map(() => 
                        '<div class="h-8 bg-gray-300 rounded animate-pulse"></div>'
                    ).join('')}
                </div>
                <div class="grid grid-cols-7 gap-1">
                    ${Array(35).fill(0).map(() => 
                        '<div class="h-20 bg-gray-300 rounded animate-pulse"></div>'
                    ).join('')}
                </div>
            </div>
        `);

        // Template para dashboard cards
        this.skeletonTemplates.set('dashboard-card', `
            <div class="dashboard-card-skeleton bg-theme-card p-6 rounded-xl border border-theme animate-pulse">
                <div class="flex justify-between items-start mb-4">
                    <div class="h-6 bg-gray-300 rounded w-1/2"></div>
                    <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                </div>
                <div class="h-12 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div class="space-y-2">
                    <div class="h-3 bg-gray-300 rounded w-full"></div>
                    <div class="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
            </div>
        `);

        // Template para lista genérica
        this.skeletonTemplates.set('list-item', `
            <div class="list-item-skeleton flex items-center gap-3 p-3 animate-pulse">
                <div class="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div class="flex-1">
                    <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div class="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div class="w-6 h-6 bg-gray-300 rounded"></div>
            </div>
        `);
    }

    // =================================================================================
    // LOADING STATES PRINCIPALES
    // =================================================================================
    showSectionLoading(sectionId, type = 'default') {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const loadingId = `loading-${sectionId}`;
        
        // Remover loading anterior si existe
        this.hideSectionLoading(sectionId);
        
        const loadingContainer = this.createLoadingContainer(loadingId, type, sectionId);
        section.appendChild(loadingContainer);
        
        this.loadingStates.set(sectionId, {
            id: loadingId,
            type,
            startTime: Date.now()
        });

        if (window.IS_DEV) {
            console.log(`⏳ Loading iniciado para: ${sectionId}`);
        }
    }

    hideSectionLoading(sectionId) {
        const loadingState = this.loadingStates.get(sectionId);
        if (!loadingState) return;

        const loadingElement = document.getElementById(loadingState.id);
        if (loadingElement) {
            // Animar salida
            loadingElement.style.opacity = '0';
            loadingElement.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                if (loadingElement.parentNode) {
                    loadingElement.remove();
                }
            }, 300);
        }

        const duration = Date.now() - loadingState.startTime;
        if (window.IS_DEV) {
            console.log(`✅ Loading completado para: ${sectionId} (${duration}ms)`);
        }

        this.loadingStates.delete(sectionId);
    }

    createLoadingContainer(loadingId, type, sectionId) {
        const container = document.createElement('div');
        container.id = loadingId;
        container.className = 'loading-container absolute inset-0 bg-theme-card/95 backdrop-blur-sm flex items-center justify-center z-10 transition-all duration-300';
        
        switch (type) {
            case 'skeleton':
                container.innerHTML = this.createSkeletonLoading(sectionId);
                break;
            case 'spinner':
                container.innerHTML = this.createSpinnerLoading();
                break;
            case 'pulse':
                container.innerHTML = this.createPulseLoading();
                break;
            case 'dots':
                container.innerHTML = this.createDotsLoading();
                break;
            default:
                container.innerHTML = this.createDefaultLoading();
                break;
        }

        // Animar entrada
        requestAnimationFrame(() => {
            container.style.opacity = '0';
            container.style.transform = 'scale(1.05)';
            container.style.transition = 'all 0.3s ease-out';
            
            requestAnimationFrame(() => {
                container.style.opacity = '1';
                container.style.transform = 'scale(1)';
            });
        });

        return container;
    }

    // =================================================================================
    // TIPOS DE LOADING
    // =================================================================================
    createSkeletonLoading(sectionId) {
        const template = this.getSkeletonTemplate(sectionId);
        return `
            <div class="w-full max-w-4xl mx-auto p-6">
                <div class="space-y-4">
                    ${Array(3).fill(0).map(() => template).join('')}
                </div>
            </div>
        `;
    }

    createSpinnerLoading() {
        return `
            <div class="flex flex-col items-center gap-4">
                <div class="spinner-modern w-12 h-12">
                    <div class="spinner-circle"></div>
                </div>
                <div class="text-sm text-gray-500">Cargando...</div>
            </div>
        `;
    }

    createPulseLoading() {
        return `
            <div class="flex flex-col items-center gap-4">
                <div class="pulse-loader">
                    <div class="pulse-dot"></div>
                    <div class="pulse-dot"></div>
                    <div class="pulse-dot"></div>
                </div>
                <div class="text-sm text-gray-500">Procesando...</div>
            </div>
        `;
    }

    createDotsLoading() {
        return `
            <div class="flex flex-col items-center gap-4">
                <div class="dots-loader">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                <div class="text-sm text-gray-500">Sincronizando...</div>
            </div>
        `;
    }

    createDefaultLoading() {
        return `
            <div class="flex flex-col items-center gap-4">
                <div class="orbit-loader">
                    <div class="orbit-planet"></div>
                    <div class="orbit-moon"></div>
                </div>
                <div class="text-sm text-gray-500">Organizando el universo...</div>
            </div>
        `;
    }

    getSkeletonTemplate(sectionId) {
        switch (sectionId) {
            case 'tasks-section':
            case 'tasks':
                return this.skeletonTemplates.get('task-card');
            case 'calendar-section':
            case 'calendar':
                return this.skeletonTemplates.get('calendar-grid');
            case 'dashboard-section':
            case 'dashboard':
                return this.skeletonTemplates.get('dashboard-card');
            default:
                return this.skeletonTemplates.get('list-item');
        }
    }

    // =================================================================================
    // LOADING GLOBAL
    // =================================================================================
    showGlobalLoading(message = 'Cargando...', type = 'default') {
        if (this.globalLoadingActive) return;

        this.globalLoadingActive = true;
        
        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300';
        
        overlay.innerHTML = `
            <div class="bg-theme-card rounded-xl p-8 max-w-sm mx-4 text-center">
                ${this.getGlobalLoadingContent(type)}
                <div class="text-lg font-medium mt-4">${message}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Animar entrada
        requestAnimationFrame(() => {
            overlay.style.opacity = '0';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });
        });
    }

    hideGlobalLoading() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 300);
        }
        
        this.globalLoadingActive = false;
    }

    getGlobalLoadingContent(type) {
        switch (type) {
            case 'sync':
                return '<div class="sync-animation w-16 h-16 mx-auto"></div>';
            case 'upload':
                return '<div class="upload-animation w-16 h-16 mx-auto"></div>';
            case 'download':
                return '<div class="download-animation w-16 h-16 mx-auto"></div>';
            default:
                return '<div class="orbit-loader w-16 h-16 mx-auto"><div class="orbit-planet"></div><div class="orbit-moon"></div></div>';
        }
    }

    // =================================================================================
    // LOADING ESPECÍFICOS
    // =================================================================================
    showButtonLoading(buttonElement, originalText = null) {
        if (!buttonElement) return;

        const originalContent = originalText || buttonElement.innerHTML;
        buttonElement.dataset.originalContent = originalContent;
        buttonElement.disabled = true;
        
        buttonElement.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="button-spinner w-4 h-4"></div>
                <span>Procesando...</span>
            </div>
        `;
    }

    hideButtonLoading(buttonElement) {
        if (!buttonElement || !buttonElement.dataset.originalContent) return;

        buttonElement.innerHTML = buttonElement.dataset.originalContent;
        buttonElement.disabled = false;
        delete buttonElement.dataset.originalContent;
    }

    showInputLoading(inputElement) {
        if (!inputElement) return;

        inputElement.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83'/%3E%3C/svg%3E")`;
        inputElement.style.backgroundRepeat = 'no-repeat';
        inputElement.style.backgroundPosition = 'right 8px center';
        inputElement.style.backgroundSize = '16px';
        inputElement.style.animation = 'spin 1s linear infinite';
    }

    hideInputLoading(inputElement) {
        if (!inputElement) return;

        inputElement.style.backgroundImage = '';
        inputElement.style.animation = '';
    }

    // =================================================================================
    // PROGRESS INDICATORS
    // =================================================================================
    showProgress(id, progress = 0, message = '') {
        let progressBar = document.getElementById(`progress-${id}`);
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = `progress-${id}`;
            progressBar.className = 'fixed bottom-4 left-4 right-4 bg-theme-card rounded-lg p-4 shadow-xl z-40';
            
            progressBar.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-6 h-6">
                        <div class="mini-spinner"></div>
                    </div>
                    <span class="progress-message text-sm font-medium">${message}</span>
                </div>
                <div class="progress-track bg-gray-300 h-2 rounded-full overflow-hidden">
                    <div class="progress-fill bg-theme-primary h-full transition-all duration-300 ease-out" style="width: ${progress}%"></div>
                </div>
                <div class="progress-percentage text-xs text-gray-500 mt-1">${Math.round(progress)}%</div>
            `;
            
            document.body.appendChild(progressBar);
        } else {
            this.updateProgress(id, progress, message);
        }
    }

    updateProgress(id, progress, message = '') {
        const progressBar = document.getElementById(`progress-${id}`);
        if (!progressBar) return;

        const progressFill = progressBar.querySelector('.progress-fill');
        const progressMessage = progressBar.querySelector('.progress-message');
        const progressPercentage = progressBar.querySelector('.progress-percentage');

        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        if (message && progressMessage) {
            progressMessage.textContent = message;
        }

        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(progress)}%`;
        }
    }

    hideProgress(id) {
        const progressBar = document.getElementById(`progress-${id}`);
        if (progressBar) {
            progressBar.style.opacity = '0';
            progressBar.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (progressBar.parentNode) {
                    progressBar.remove();
                }
            }, 300);
        }
    }

    // =================================================================================
    // PERFORMANCE METRICS
    // =================================================================================
    setupPerformanceMetrics() {
        this.performanceMetrics = {
            navigationStart: Date.now(),
            loadTimes: new Map(),
            renderTimes: new Map()
        };

        // Observar cambios de rendimiento
        if ('performance' in window && 'observe' in window.performance) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (window.IS_DEV) {
                        console.log(`⚡ Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
    }

    measureSectionLoad(sectionId) {
        const startTime = Date.now();
        
        return {
            end: () => {
                const duration = Date.now() - startTime;
                this.performanceMetrics.loadTimes.set(sectionId, duration);
                
                if (window.IS_DEV) {
                    console.log(`📊 Sección ${sectionId} cargada en ${duration}ms`);
                }
                
                return duration;
            }
        };
    }

    // =================================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================================
    isLoading(sectionId) {
        return this.loadingStates.has(sectionId);
    }

    getLoadingStates() {
        return Array.from(this.loadingStates.keys());
    }

    clearAllLoading() {
        for (const sectionId of this.loadingStates.keys()) {
            this.hideSectionLoading(sectionId);
        }
        this.hideGlobalLoading();
    }

    // =================================================================================
    // UTILIDADES
    // =================================================================================
    addLoadingStyles() {
        if (document.getElementById('loading-states-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'loading-states-styles';
        styles.textContent = `
            /* Spinner moderno */
            .spinner-modern {
                position: relative;
                display: inline-block;
            }
            .spinner-circle {
                width: 100%;
                height: 100%;
                border: 3px solid rgba(var(--primary-dark-rgb), 0.2);
                border-top: 3px solid rgb(var(--primary-dark-rgb));
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            /* Orbit loader */
            .orbit-loader {
                position: relative;
                display: inline-block;
            }
            .orbit-planet {
                width: 60%;
                height: 60%;
                background: rgb(var(--primary-dark-rgb));
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: pulse 2s ease-in-out infinite;
            }
            .orbit-moon {
                width: 20%;
                height: 20%;
                background: rgb(var(--accent-dark));
                border-radius: 50%;
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                animation: orbit 2s linear infinite;
                transform-origin: 50% 250%;
            }

            /* Animations */
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.9); }
            }
            @keyframes orbit {
                to { transform: translateX(-50%) rotate(360deg); }
            }

            /* Loading states específicos */
            .task-card-skeleton .animate-pulse > * {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .task-card-skeleton .animate-pulse > *:nth-child(2) {
                animation-delay: 0.1s;
            }
            .task-card-skeleton .animate-pulse > *:nth-child(3) {
                animation-delay: 0.2s;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Crear instancia global e inyectar estilos solo cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.LoadingStates = new LoadingStates();
        window.LoadingStates.addLoadingStyles();
    });
} else {
    window.LoadingStates = new LoadingStates();
    window.LoadingStates.addLoadingStyles();
}

if (window.IS_DEV) {
    console.log('⏳ Loading States cargado');
}
