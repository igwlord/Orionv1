// =================================================================================
// ORION APP SHELL MANAGER - Instant Loading Pattern
// =================================================================================

class AppShellManager {
    constructor() {
        this.shellComponents = new Map();
        this.loadingStates = new Map();
        this.transitionQueue = [];
        this.isTransitioning = false;
        
        this.init();
    }

    // =================================================================================
    // INICIALIZACIÓN
    // =================================================================================
    init() {
        this.createShellComponents();
        this.setupPreloading();
        this.setupTransitionEffects();
        
        if (window.IS_DEV) {
            console.log('🏗️ App Shell Manager iniciado');
        }
    }

    // =================================================================================
    // COMPONENTES DEL SHELL
    // =================================================================================
    createShellComponents() {
        // Shell para dashboard
        this.shellComponents.set('dashboard', this.createDashboardShell());
        
        // Shell para tareas
        this.shellComponents.set('tasks', this.createTasksShell());
        
        // Shell para calendario
        this.shellComponents.set('calendar', this.createCalendarShell());
        
        // Shell para configuración
        this.shellComponents.set('settings', this.createSettingsShell());
    }

    createDashboardShell() {
        return `
            <div class="animate-pulse">
                <!-- Header skeleton -->
                <div class="mb-8">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                        <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                        <div class="h-4 bg-green-500 rounded-full w-2"></div>
                        <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                    <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                </div>

                <!-- Grid skeleton -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 flex flex-col gap-8">
                        <!-- Tareas para hoy skeleton -->
                        <div class="bg-theme-card p-6 rounded-xl shadow-lg border-2 border-theme-primary order-1">
                            <div class="h-7 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-4"></div>
                            <div class="space-y-3">
                                <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                        
                        <!-- Proyectos skeleton -->
                        <div class="bg-theme-card p-6 rounded-xl shadow-lg order-3 lg:order-2">
                            <div class="h-7 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
                            <div class="space-y-4">
                                <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-8">
                        <!-- Próximas tareas skeleton -->
                        <div class="bg-theme-card p-6 rounded-xl shadow-lg order-2 lg:order-1">
                            <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
                            <div class="space-y-3">
                                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                        
                        <!-- Racha skeleton -->
                        <div class="bg-theme-card p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center order-4 lg:order-2">
                            <div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full mb-2"></div>
                            <div class="h-12 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
                            <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createTasksShell() {
        return `
            <div class="animate-pulse">
                <!-- Header skeleton -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                    <div class="flex items-center gap-2 w-full md:w-auto">
                        <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                        <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                        <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-28"></div>
                    </div>
                </div>
                
                <!-- Filters skeleton -->
                <div class="flex flex-col md:flex-row items-start md:items-center mb-4 gap-4">
                    <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
                    <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                </div>
                
                <!-- Kanban columns skeleton -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${Array(3).fill(0).map(() => `
                        <div class="bg-theme-card/50 p-4 rounded-lg">
                            <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                            <div class="min-h-[200px] space-y-4">
                                <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createCalendarShell() {
        return `
            <div class="animate-pulse">
                <!-- Header skeleton -->
                <div class="flex justify-between items-center mb-6">
                    <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                    <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                </div>
                
                <!-- Calendar skeleton -->
                <div class="bg-theme-card p-4 rounded-lg">
                    <div class="flex justify-between items-center mb-4">
                        <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded-full w-8"></div>
                        <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                        <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded-full w-8"></div>
                    </div>
                    
                    <!-- Calendar grid skeleton -->
                    <div class="grid grid-cols-7 gap-1">
                        ${Array(42).fill(0).map(() => `
                            <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded border"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    createSettingsShell() {
        return `
            <div class="animate-pulse max-w-2xl mx-auto">
                <!-- Title skeleton -->
                <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-40 mb-8"></div>
                
                <!-- Settings cards skeleton -->
                <div class="space-y-6">
                    ${Array(4).fill(0).map(() => `
                        <div class="bg-theme-card p-4 rounded-lg">
                            <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-3"></div>
                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // =================================================================================
    // PRELOADING Y TRANSICIONES
    // =================================================================================
    setupPreloading() {
        // Precargar shells cuando se hace hover en navegación
        const navButtons = document.querySelectorAll('.nav-btn, .mobile-nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                const section = button.getAttribute('data-section');
                this.preloadSection(section);
            });
        });
    }

    async preloadSection(sectionName) {
        if (this.loadingStates.get(sectionName) === 'loaded') {
            return;
        }

        try {
            this.loadingStates.set(sectionName, 'preloading');
            
            // Simular precarga de datos críticos
            if (window.DataAdapter) {
                switch (sectionName) {
                    case 'dashboard':
                        await this.preloadDashboardData();
                        break;
                    case 'tasks':
                        await this.preloadTasksData();
                        break;
                    case 'calendar':
                        await this.preloadCalendarData();
                        break;
                }
            }
            
            this.loadingStates.set(sectionName, 'loaded');
            
            if (window.IS_DEV) {
                console.log(`⚡ Sección ${sectionName} precargada`);
            }
        } catch (error) {
            console.warn(`Error precargando ${sectionName}:`, error);
        }
    }

    async preloadDashboardData() {
        const today = new Date().toISOString().split('T')[0];
        
        await Promise.all([
            window.DataAdapter.obtenerTareas({ date: today }),
            window.DataAdapter.obtenerProyectos(),
            window.DataAdapter.getCache('dashboard-stats')
        ]);
    }

    async preloadTasksData() {
        await Promise.all([
            window.DataAdapter.obtenerTareas(),
            window.DataAdapter.obtenerProyectos()
        ]);
    }

    async preloadCalendarData() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await window.DataAdapter.getCache(`calendar-${currentMonth}`);
    }

    // =================================================================================
    // TRANSICIONES DE SECCIÓN
    // =================================================================================
    setupTransitionEffects() {
        // Interceptar navegación para añadir transiciones fluidas
        // TEMPORALMENTE DESHABILITADO - Causaba problemas con navegación normal
        /* 
        document.addEventListener('click', (e) => {
            const navButton = e.target.closest('.nav-btn, .mobile-nav-btn');
            if (navButton) {
                e.preventDefault();
                const section = navButton.getAttribute('data-section');
                this.transitionToSection(section, navButton);
            }
        });
        */
        
        if (window.IS_DEV) {
            console.log('⚠️ Transiciones automáticas deshabilitadas - usando navegación normal');
        }
    }

    async transitionToSection(sectionName, triggerButton) {
        if (this.isTransitioning) {
            this.transitionQueue.push({ sectionName, triggerButton });
            return;
        }

        try {
            this.isTransitioning = true;
            
            // 1. Mostrar shell inmediatamente
            await this.showShell(sectionName);
            
            // 2. Actualizar navegación
            this.updateNavigation(triggerButton, sectionName);
            
            // 3. Cargar datos reales en background
            await this.loadSectionData(sectionName);
            
            // 4. Reemplazar shell con contenido real
            await this.hideShell(sectionName);
            
        } catch (error) {
            console.error(`Error en transición a ${sectionName}:`, error);
        } finally {
            this.isTransitioning = false;
            
            // Procesar siguiente en cola
            if (this.transitionQueue.length > 0) {
                const next = this.transitionQueue.shift();
                setTimeout(() => this.transitionToSection(next.sectionName, next.triggerButton), 50);
            }
        }
    }

    async showShell(sectionName) {
        const targetSection = document.getElementById(sectionName);
        const shellContent = this.shellComponents.get(sectionName);
        
        if (!targetSection || !shellContent) {
            if (window.IS_DEV) {
                console.log(`❌ No se pudo mostrar shell - Section: ${!!targetSection}, Shell: ${!!shellContent}`);
            }
            return;
        }

        if (window.IS_DEV) {
            console.log(`🔄 Mostrando shell para: ${sectionName}`);
        }

        // Ocultar todas las secciones
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Mostrar sección con shell
        targetSection.classList.remove('hidden');
        
        // Guardar contenido original si no existe
        if (!targetSection.dataset.originalContent) {
            targetSection.dataset.originalContent = targetSection.innerHTML;
            
            if (window.IS_DEV) {
                console.log(`💾 Contenido original guardado para: ${sectionName} (${targetSection.innerHTML.length} chars)`);
            }
        } else {
            if (window.IS_DEV) {
                console.log(`📄 Contenido original ya existe para: ${sectionName}`);
            }
        }
        
        // Inyectar shell con animación
        targetSection.innerHTML = shellContent;
        targetSection.style.opacity = '0';
        targetSection.style.transform = 'translateY(10px)';
        
        // Animar entrada
        requestAnimationFrame(() => {
            targetSection.style.transition = 'all 0.3s ease-out';
            targetSection.style.opacity = '1';
            targetSection.style.transform = 'translateY(0)';
        });
    }

    async hideShell(sectionName) {
        const targetSection = document.getElementById(sectionName);
        
        if (!targetSection) {
            if (window.IS_DEV) {
                console.log(`❌ No se encontró sección: ${sectionName}`);
            }
            return;
        }

        if (window.IS_DEV) {
            console.log(`🔄 Ocultando shell para: ${sectionName}`);
            console.log('Original content exists:', !!targetSection.dataset.originalContent);
        }

        // Restaurar contenido original
        if (targetSection.dataset.originalContent) {
            targetSection.innerHTML = targetSection.dataset.originalContent;
            
            // Re-aplicar iconos si es necesario
            if (window.IconUtils) {
                window.IconUtils.safeFeatherReplace();
            }
            
            // Re-inicializar sección específica si es necesario
            this.reinitializeSection(sectionName);
            
            if (window.IS_DEV) {
                console.log(`✅ Contenido original restaurado para: ${sectionName}`);
            }
        } else {
            if (window.IS_DEV) {
                console.log(`⚠️ No hay contenido original guardado para: ${sectionName}`);
            }
        }
    }
    
    reinitializeSection(sectionName) {
        // Re-inicializar funcionalidades específicas de cada sección
        switch (sectionName) {
            case 'calendar':
                // Re-renderizar el calendario
                if (window.UIManager && window.UIManager.renderCalendar) {
                    setTimeout(() => {
                        window.UIManager.renderCalendar();
                    }, 100);
                }
                break;
                
            case 'tasks':
                // Re-renderizar tareas si es necesario
                if (window.UIManager && window.UIManager.renderTasks) {
                    setTimeout(() => {
                        window.UIManager.renderTasks();
                    }, 100);
                }
                break;
        }
    }

    updateNavigation(activeButton, sectionName = null) {
        // Actualizar botones de navegación
        document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
            if (btn && btn.classList) {
                btn.classList.remove('bg-theme-primary', 'text-white');
            }
        });
        
        // Si no se proporciona activeButton, intentar encontrarlo
        if (!activeButton || !activeButton.classList) {
            if (sectionName) {
                // Buscar por el nombre de sección proporcionado con múltiples intentos
                const selectors = [
                    `[data-section="${sectionName}"]`,
                    `button[data-section="${sectionName}"]`,
                    `.nav-btn[data-section="${sectionName}"]`,
                    `.mobile-nav-btn[data-section="${sectionName}"]`
                ];
                
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element && element.classList && element.tagName) {
                        activeButton = element;
                        break;
                    }
                }
                
                if (window.IS_DEV && (!activeButton || !activeButton.classList)) {
                    console.log(`🔍 No se encontró botón válido para sección: ${sectionName}`);
                    console.log('Botones disponibles:', document.querySelectorAll('[data-section]'));
                }
            } else {
                // Buscar por la sección actual basada en el estado visible
                const visibleSection = document.querySelector('.app-section:not(.hidden)');
                if (visibleSection && visibleSection.id) {
                    const sectionId = visibleSection.id;
                    const selectors = [
                        `[data-section="${sectionId}"]`,
                        `button[data-section="${sectionId}"]`,
                        `.nav-btn[data-section="${sectionId}"]`,
                        `.mobile-nav-btn[data-section="${sectionId}"]`
                    ];
                    
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element && element.classList && element.tagName) {
                            activeButton = element;
                            break;
                        }
                    }
                    
                    if (window.IS_DEV && (!activeButton || !activeButton.classList)) {
                        console.log(`🔍 No se encontró botón válido para sección visible: ${sectionId}`);
                    }
                }
            }
        }
        
        // Verificar que el botón encontrado es válido antes de usar classList
        if (activeButton && activeButton.classList && activeButton.tagName) {
            activeButton.classList.add('bg-theme-primary', 'text-white');
            
            if (window.IS_DEV) {
                console.log(`✅ Navegación actualizada para: ${sectionName || 'desconocido'}`);
            }
        } else if (window.IS_DEV) {
            console.log(`❌ No se pudo actualizar navegación - activeButton:`, activeButton);
            console.log('Tipo de elemento:', typeof activeButton, activeButton?.constructor?.name);
        }
        
        // Cerrar menú móvil si está abierto
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }

    async loadSectionData(sectionName) {
        // Simular tiempo de carga realista
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
        
        // Aquí se cargarían los datos reales de la sección
        if (window.App && window.App.refreshSection) {
            await window.App.refreshSection(sectionName);
        }
    }

    // =================================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================================
    async preloadAllSections() {
        const sections = ['dashboard', 'tasks', 'calendar', 'settings'];
        
        for (const section of sections) {
            await this.preloadSection(section);
        }
        
        if (window.IS_DEV) {
            console.log('🚀 Todas las secciones precargadas');
        }
    }

    forceTransition(sectionName) {
        const button = document.querySelector(`[data-section="${sectionName}"]`);
        if (button) {
            this.transitionToSection(sectionName, button);
        }
    }

    // Método para deshabilitar temporalmente las transiciones
    disableTransitions() {
        this.isTransitioning = true;
    }

    enableTransitions() {
        this.isTransitioning = false;
    }
}

// Crear instancia global solo cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AppShellManager = new AppShellManager();
    });
} else {
    window.AppShellManager = new AppShellManager();
}

if (window.IS_DEV) {
    console.log('🏗️ App Shell Manager cargado');
}
