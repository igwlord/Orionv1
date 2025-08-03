// =================================================================================
// ORION PHASE 3 COORDINATOR - App Shell & Advanced UX Integration
// =================================================================================

class Phase3Coordinator {
    constructor() {
        this.initialized = false;
        this.managers = {
            appShell: null,
            keyboard: null,
            gestures: null,
            loading: null
        };
        
        this.navigationButtons = null;
        this.currentSection = 'dashboard';
        
        this.init();
    }

    // =================================================================================
    // INICIALIZACIÓN
    // =================================================================================
    async init() {
        if (this.initialized) return;

        try {
            await this.waitForDependencies();
            this.initializeManagers();
            this.setupIntegrations();
            this.enhanceNavigation();
            this.setupPerformanceMonitoring();
            
            this.initialized = true;
            
            if (window.IS_DEV) {
                console.log('🚀 Phase 3 Coordinator iniciado - App Shell & Advanced UX activo');
                // Mensaje de bienvenida removido para producción
                // this.showWelcomeMessage();
            }
        } catch (error) {
            console.error('Error inicializando Phase 3:', error);
        }
    }

    async waitForDependencies() {
        const maxAttempts = 100; // Aumentar intentos
        let attempts = 0;
        
        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                attempts++;
                
                if (window.AppShellManager && 
                    window.KeyboardShortcuts && 
                    window.GestureHandler && 
                    window.LoadingStates) {
                    if (window.IS_DEV) {
                        console.log(`✅ Dependencias Phase 3 cargadas (intento ${attempts})`);
                    }
                    resolve();
                } else if (attempts >= maxAttempts) {
                    const missing = [];
                    if (!window.AppShellManager) missing.push('AppShellManager');
                    if (!window.KeyboardShortcuts) missing.push('KeyboardShortcuts');
                    if (!window.GestureHandler) missing.push('GestureHandler');
                    if (!window.LoadingStates) missing.push('LoadingStates');
                    
                    reject(new Error(`Dependencias faltantes: ${missing.join(', ')}`));
                } else {
                    setTimeout(checkDependencies, 200); // Aumentar intervalo
                }
            };
            
            checkDependencies();
        });
    }

    initializeManagers() {
        this.managers.appShell = window.AppShellManager;
        this.managers.keyboard = window.KeyboardShortcuts;
        this.managers.gestures = window.GestureHandler;
        this.managers.loading = window.LoadingStates;
        
        if (window.IS_DEV) {
            console.log('✅ Phase 3 managers inicializados');
        }
    }

    // =================================================================================
    // INTEGRACIÓN DE COMPONENTES
    // =================================================================================
    setupIntegrations() {
        this.integrateAppShellWithNavigation();
        this.integrateLoadingWithAppShell();
        this.setupKeyboardGestureCoordination();
        this.enhanceAppShellTransitions();
    }

    integrateAppShellWithNavigation() {
        // Buscar botones de navegación
        this.navigationButtons = document.querySelectorAll('[data-section]');
        
        if (this.navigationButtons.length === 0) {
            // Buscar en otras estructuras comunes
            this.navigationButtons = document.querySelectorAll('.nav-button, .navigation-item, [onclick*="showSection"]');
        }

        // Interceptar clics de navegación para usar App Shell
        this.navigationButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const sectionName = button.dataset.section || this.extractSectionFromElement(button);
                
                if (sectionName && this.managers.appShell) {
                    e.preventDefault();
                    this.handleSectionTransition(sectionName, button);
                }
            });
        });

        if (window.IS_DEV) {
            console.log(`🔗 App Shell integrado con ${this.navigationButtons.length} botones de navegación`);
        }
    }

    integrateLoadingWithAppShell() {
        // Interceptar transiciones de App Shell para mostrar loading states
        if (this.managers.appShell && this.managers.loading) {
            // Solo interceprar si no se ha hecho ya
            if (!this.managers.appShell._loadingIntegrated) {
                const originalTransition = this.managers.appShell.transitionToSection.bind(this.managers.appShell);
                
                this.managers.appShell.transitionToSection = async (sectionName, options = {}) => {
                    // Mostrar loading skeleton durante transición
                    this.managers.loading.showSectionLoading(sectionName, 'skeleton');
                    
                    try {
                        const result = await originalTransition(sectionName, options);
                        
                        // Simular tiempo mínimo de loading para experiencia consistente
                        setTimeout(() => {
                            this.managers.loading.hideSectionLoading(sectionName);
                        }, 300);
                        
                        return result;
                    } catch (error) {
                        this.managers.loading.hideSectionLoading(sectionName);
                        throw error;
                    }
                };
                
                // Marcar como integrado
                this.managers.appShell._loadingIntegrated = true;
            }
        }
    }

    setupKeyboardGestureCoordination() {
        // Coordinar keyboard shortcuts con gestures
        if (this.managers.keyboard && this.managers.gestures) {
            // Deshabilitar gestures cuando hay shortcuts activos
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    this.managers.gestures?.disableGestures();
                }
            });
            
            document.addEventListener('keyup', (e) => {
                if (!e.ctrlKey && !e.metaKey) {
                    this.managers.gestures?.enableGestures();
                }
            });
        }
    }

    enhanceAppShellTransitions() {
        if (!this.managers.appShell) return;

        // Solo añadir mejoras si no se han aplicado ya
        if (this.managers.appShell._enhancementsApplied) return;

        // Mejorar el método showShell si existe
        if (this.managers.appShell.showShell) {
            const originalShowShell = this.managers.appShell.showShell.bind(this.managers.appShell);
            
            this.managers.appShell.showShell = async (sectionName) => {
                const result = await originalShowShell(sectionName);
                
                // Añadir efectos de micro-interacciones a la sección
                const targetSection = document.getElementById(sectionName);
                if (targetSection) {
                    targetSection.style.transform = 'translateY(10px)';
                    targetSection.style.opacity = '0';
                    targetSection.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    requestAnimationFrame(() => {
                        targetSection.style.transform = 'translateY(0)';
                        targetSection.style.opacity = '1';
                    });
                }
                
                return result;
            };
        }
        
        // Marcar como mejorado
        this.managers.appShell._enhancementsApplied = true;
    }

    // =================================================================================
    // NAVEGACIÓN MEJORADA
    // =================================================================================
    enhanceNavigation() {
        this.setupPreloadingOnHover();
        this.setupSmartPrefetching();
        this.enhanceNavigationFeedback();
    }

    setupPreloadingOnHover() {
        this.navigationButtons.forEach(button => {
            let hoverTimeout;
            
            button.addEventListener('mouseenter', () => {
                hoverTimeout = setTimeout(() => {
                    const sectionName = button.dataset.section || this.extractSectionFromElement(button);
                    if (sectionName && this.managers.appShell) {
                        this.managers.appShell.preloadSection(sectionName);
                    }
                }, 300); // Preload después de 300ms de hover
            });
            
            button.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
            });
        });
    }

    setupSmartPrefetching() {
        // Prefetch basado en patrones de navegación
        const navigationPattern = this.getNavigationPattern();
        
        if (navigationPattern.length > 0) {
            // Prefetch la sección más probable siguiente
            const nextSection = this.predictNextSection(this.currentSection, navigationPattern);
            if (nextSection && this.managers.appShell) {
                setTimeout(() => {
                    this.managers.appShell.preloadSection(nextSection);
                }, 2000);
            }
        }
    }

    enhanceNavigationFeedback() {
        this.navigationButtons.forEach(button => {
            // Haptic feedback para móviles
            button.addEventListener('touchstart', () => {
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            });
            
            // Feedback visual mejorado
            button.addEventListener('click', () => {
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            });
        });
    }

    // =================================================================================
    // MANEJO DE TRANSICIONES
    // =================================================================================
    async handleSectionTransition(sectionName, triggerElement) {
        if (sectionName === this.currentSection) return;

        const transitionStart = Date.now();
        
        try {
            // Feedback inmediato
            if (triggerElement) {
                this.showTransitionFeedback(triggerElement, sectionName);
            }
            
            // Ejecutar transición con App Shell
            if (this.managers.appShell) {
                await this.managers.appShell.transitionToSection(sectionName);
            } else {
                // Fallback sin App Shell
                this.fallbackNavigation(sectionName);
            }
            
            this.currentSection = sectionName;
            this.updateNavigationState(sectionName);
            
            const transitionTime = Date.now() - transitionStart;
            
            if (window.IS_DEV) {
                console.log(`🎯 Transición a ${sectionName} completada en ${transitionTime}ms`);
            }
            
        } catch (error) {
            console.error('Error en transición:', error);
            this.showErrorFeedback('Error al navegar');
        }
    }

    showTransitionFeedback(element, sectionName) {
        // Crear indicador temporal
        const indicator = document.createElement('div');
        indicator.className = 'fixed top-4 right-4 bg-theme-primary text-white px-3 py-2 rounded-lg text-sm z-50';
        indicator.textContent = `→ ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`;
        
        document.body.appendChild(indicator);
        
        // Auto-remover
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 1500);
    }

    fallbackNavigation(sectionName) {
        // Navegación tradicional como fallback
        const targetSection = document.getElementById(sectionName) || 
                             document.getElementById(`${sectionName}-section`);
        
        if (targetSection) {
            // Ocultar secciones actuales
            document.querySelectorAll('.app-section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Mostrar sección objetivo
            targetSection.classList.remove('hidden');
        }
    }

    updateNavigationState(currentSection) {
        // Actualizar estado visual de navegación
        this.navigationButtons.forEach(button => {
            const buttonSection = button.dataset.section || this.extractSectionFromElement(button);
            
            if (buttonSection === currentSection) {
                button.classList.add('active', 'bg-theme-primary');
                button.classList.remove('bg-gray-700');
            } else {
                button.classList.remove('active', 'bg-theme-primary');
                button.classList.add('bg-gray-700');
            }
        });
    }

    // =================================================================================
    // PERFORMANCE MONITORING
    // =================================================================================
    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            transitionTimes: [],
            averageTransitionTime: 0,
            totalTransitions: 0
        };
        
        // Monitorear Web Vitals
        if ('web-vital' in window) {
            this.trackWebVitals();
        }
        
        // Monitorear memory usage
        if ('memory' in performance) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, 30000); // Cada 30 segundos
        }
    }

    trackWebVitals() {
        // Implementar seguimiento de Core Web Vitals si está disponible
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (window.IS_DEV) {
                    console.log(`📊 ${entry.name}: ${entry.value}`);
                }
            }
        });
        
        try {
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        } catch (e) {
            // Silencioso si no está soportado
        }
    }

    checkMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
            
            if (usagePercent > 80 && window.IS_DEV) {
                console.warn(`⚠️ Alto uso de memoria: ${usagePercent.toFixed(1)}%`);
            }
        }
    }

    // =================================================================================
    // UTILIDADES
    // =================================================================================
    extractSectionFromElement(element) {
        // Intentar extraer nombre de sección de diferentes atributos
        return element.dataset.section ||
               element.dataset.target ||
               element.getAttribute('onclick')?.match(/showSection\(['"]([^'"]+)['"]\)/)?.[1] ||
               element.textContent?.toLowerCase().trim();
    }

    getNavigationPattern() {
        // Obtener patrón de navegación del localStorage
        try {
            return JSON.parse(localStorage.getItem('orion-navigation-pattern') || '[]');
        } catch {
            return [];
        }
    }

    predictNextSection(currentSection, pattern) {
        // Predicción simple basada en historial
        const transitions = pattern.filter(p => p.from === currentSection);
        if (transitions.length === 0) return null;
        
        const sectionCounts = {};
        transitions.forEach(t => {
            sectionCounts[t.to] = (sectionCounts[t.to] || 0) + 1;
        });
        
        return Object.keys(sectionCounts).reduce((a, b) => 
            sectionCounts[a] > sectionCounts[b] ? a : b
        );
    }

    showWelcomeMessage() {
        setTimeout(() => {
            const welcome = document.createElement('div');
            welcome.className = 'fixed bottom-4 left-4 bg-theme-primary text-white px-4 py-3 rounded-lg shadow-xl z-40';
            welcome.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="text-xl">🚀</div>
                    <div>
                        <div class="font-medium">Phase 3 Activo</div>
                        <div class="text-sm opacity-90">App Shell + UX Avanzado</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(welcome);
            
            setTimeout(() => {
                welcome.style.opacity = '0';
                welcome.style.transform = 'translateY(20px)';
                setTimeout(() => welcome.remove(), 300);
            }, 4000);
        }, 1000);
    }

    showErrorFeedback(message) {
        const error = document.createElement('div');
        error.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-50';
        error.textContent = message;
        
        document.body.appendChild(error);
        
        setTimeout(() => {
            error.style.opacity = '0';
            setTimeout(() => error.remove(), 300);
        }, 3000);
    }

    // =================================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================================
    isInitialized() {
        return this.initialized;
    }

    getCurrentSection() {
        return this.currentSection;
    }

    forceTransition(sectionName) {
        return this.handleSectionTransition(sectionName, null);
    }

    getPerformanceMetrics() {
        return this.performanceMetrics;
    }
}

// Auto-inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Phase3Coordinator = new Phase3Coordinator();
    });
} else {
    window.Phase3Coordinator = new Phase3Coordinator();
}

if (window.IS_DEV) {
    console.log('🎭 Phase 3 Coordinator cargado');
}
