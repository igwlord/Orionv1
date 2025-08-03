// =================================================================================
// ORION KEYBOARD SHORTCUTS - Advanced UX Navigation
// =================================================================================

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.modifierKeys = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false
        };
        
        this.isInputFocused = false;
        this.helpVisible = false;
        
        this.init();
    }

    // =================================================================================
    // INICIALIZACIÓN
    // =================================================================================
    init() {
        this.registerShortcuts();
        this.setupEventListeners();
        
        // Crear help overlay solo cuando DOM esté disponible
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createHelpOverlay();
            });
        } else {
            this.createHelpOverlay();
        }
        
        if (window.IS_DEV) {
            console.log('⌨️ Keyboard Shortcuts Manager iniciado');
        }
    }

    // =================================================================================
    // REGISTRO DE SHORTCUTS
    // =================================================================================
    registerShortcuts() {
        // Navegación principal
        this.addShortcut('1', 'Ir a Dashboard', () => this.navigateToSection('dashboard'));
        this.addShortcut('2', 'Ir a Tareas', () => this.navigateToSection('tasks'));
        this.addShortcut('3', 'Ir a Calendario', () => this.navigateToSection('calendar'));
        this.addShortcut('4', 'Ir a Kaizen', () => this.navigateToSection('kaizen'));
        this.addShortcut('5', 'Ir a Configuración', () => this.navigateToSection('settings'));

        // Acciones rápidas
        this.addShortcut('n', 'Nueva Tarea', () => this.createNewTask(), { ctrl: true });
        this.addShortcut('p', 'Nuevo Proyecto', () => this.createNewProject(), { ctrl: true });
        this.addShortcut('s', 'Guardar/Exportar', () => this.quickSave(), { ctrl: true });
        this.addShortcut('f', 'Buscar Tareas', () => this.focusSearch(), { ctrl: true });

        // Toggles rápidos
        this.addShortcut('d', 'Toggle Tema', () => this.toggleTheme(), { ctrl: true });
        this.addShortcut('h', 'Mostrar/Ocultar Ayuda', () => this.toggleHelp());
        
        // Navegación de calendario
        this.addShortcut('ArrowLeft', 'Mes Anterior', () => this.navigateCalendar('prev'), { 
            section: 'calendar' 
        });
        this.addShortcut('ArrowRight', 'Mes Siguiente', () => this.navigateCalendar('next'), { 
            section: 'calendar' 
        });
        this.addShortcut('t', 'Ir a Hoy', () => this.goToToday(), { 
            section: 'calendar' 
        });

        // Acciones de tareas
        this.addShortcut('j', 'Siguiente Tarea', () => this.navigateTask('down'), { 
            section: 'tasks' 
        });
        this.addShortcut('k', 'Anterior Tarea', () => this.navigateTask('up'), { 
            section: 'tasks' 
        });
        this.addShortcut('Enter', 'Editar Tarea Seleccionada', () => this.editSelectedTask(), { 
            section: 'tasks' 
        });

        // Escape para cerrar modales
        this.addShortcut('Escape', 'Cerrar Modal/Menú', () => this.closeCurrentModal());
    }

    addShortcut(key, description, action, options = {}) {
        const shortcutKey = this.createShortcutKey(key, options);
        this.shortcuts.set(shortcutKey, {
            key,
            description,
            action,
            options
        });
    }

    createShortcutKey(key, options) {
        const modifiers = [];
        if (options.ctrl) modifiers.push('ctrl');
        if (options.alt) modifiers.push('alt');
        if (options.shift) modifiers.push('shift');
        if (options.meta) modifiers.push('meta');
        
        return `${modifiers.join('+')}.${key}`.replace(/^\./, '');
    }

    // =================================================================================
    // EVENT LISTENERS
    // =================================================================================
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Detectar cuando hay inputs enfocados
        document.addEventListener('focusin', (e) => {
            this.isInputFocused = e.target.matches('input, textarea, select, [contenteditable]');
        });
        
        document.addEventListener('focusout', () => {
            setTimeout(() => {
                this.isInputFocused = document.activeElement?.matches('input, textarea, select, [contenteditable]') || false;
            }, 10);
        });
    }

    handleKeyDown(e) {
        // Actualizar estado de modificadores
        this.modifierKeys.ctrl = e.ctrlKey;
        this.modifierKeys.alt = e.altKey;
        this.modifierKeys.shift = e.shiftKey;
        this.modifierKeys.meta = e.metaKey;

        // No procesar si hay un input enfocado (excepto Escape y Ctrl+combinaciones)
        if (this.isInputFocused && e.key !== 'Escape' && !e.ctrlKey && !e.metaKey) {
            return;
        }

        const shortcutKey = this.createShortcutKey(e.key, this.modifierKeys);
        const shortcut = this.shortcuts.get(shortcutKey);

        if (shortcut) {
            // Verificar si el shortcut es específico para una sección
            if (shortcut.options.section) {
                const currentSection = this.getCurrentSection();
                if (currentSection !== shortcut.options.section) {
                    return;
                }
            }

            e.preventDefault();
            
            try {
                shortcut.action();
                
                if (window.IS_DEV) {
                    console.log(`⌨️ Shortcut ejecutado: ${shortcut.description}`);
                }
                
                // Mostrar feedback visual
                this.showShortcutFeedback(shortcut.description);
            } catch (error) {
                console.error('Error ejecutando shortcut:', error);
            }
        }
    }

    handleKeyUp(e) {
        // Actualizar estado de modificadores
        this.modifierKeys.ctrl = e.ctrlKey;
        this.modifierKeys.alt = e.altKey;
        this.modifierKeys.shift = e.shiftKey;
        this.modifierKeys.meta = e.metaKey;
    }

    // =================================================================================
    // ACCIONES DE SHORTCUTS
    // =================================================================================
    navigateToSection(sectionName) {
        if (window.AppShellManager) {
            window.AppShellManager.forceTransition(sectionName);
        } else {
            // Fallback directo
            const button = document.querySelector(`[data-section="${sectionName}"]`);
            if (button) {
                button.click();
            }
        }
    }

    createNewTask() {
        const createBtn = document.getElementById('create-task-btn');
        if (createBtn) {
            createBtn.click();
        }
    }

    createNewProject() {
        const createBtn = document.getElementById('create-project-btn');
        if (createBtn) {
            createBtn.click();
        }
    }

    quickSave() {
        const saveBtn = document.getElementById('quick-save-btn') || document.getElementById('export-json-btn');
        if (saveBtn) {
            saveBtn.click();
        }
    }

    focusSearch() {
        const searchInput = document.getElementById('search-tasks-input');
        if (searchInput && !searchInput.closest('.hidden')) {
            searchInput.focus();
            searchInput.select();
        }
    }

    toggleTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.click();
        }
    }

    toggleHelp() {
        this.helpVisible = !this.helpVisible;
        this.showHelpOverlay(this.helpVisible);
    }

    navigateCalendar(direction) {
        const button = direction === 'prev' 
            ? document.getElementById('prev-month-btn')
            : document.getElementById('next-month-btn');
        
        if (button) {
            button.click();
        }
    }

    goToToday() {
        const todayBtn = document.getElementById('goto-today-btn');
        if (todayBtn) {
            todayBtn.click();
        }
    }

    navigateTask(direction) {
        // Implementar navegación entre tareas con j/k
        const tasks = document.querySelectorAll('.task-card:not(.hidden)');
        if (tasks.length === 0) return;

        let currentIndex = Array.from(tasks).findIndex(task => 
            task.classList.contains('task-selected')
        );

        if (currentIndex === -1) currentIndex = 0;

        // Remover selección actual
        tasks.forEach(task => task.classList.remove('task-selected'));

        // Calcular nueva posición
        if (direction === 'down') {
            currentIndex = Math.min(currentIndex + 1, tasks.length - 1);
        } else {
            currentIndex = Math.max(currentIndex - 1, 0);
        }

        // Aplicar nueva selección
        const selectedTask = tasks[currentIndex];
        selectedTask.classList.add('task-selected');
        selectedTask.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    editSelectedTask() {
        const selectedTask = document.querySelector('.task-card.task-selected');
        if (selectedTask) {
            selectedTask.click();
        }
    }

    closeCurrentModal() {
        // Cerrar modal activo
        const activeModal = document.querySelector('.modal:not(.hidden)') || 
                           document.querySelector('[role="dialog"]:not(.hidden)') ||
                           document.querySelector('#mobile-menu:not(.hidden)');
        
        if (activeModal) {
            const closeBtn = activeModal.querySelector('[id*="close"], [id*="cancel"], .close-btn');
            if (closeBtn) {
                closeBtn.click();
            } else {
                // Fallback: ocultar modal directamente
                activeModal.classList.add('hidden');
            }
        }
    }

    // =================================================================================
    // UTILIDADES
    // =================================================================================
    getCurrentSection() {
        const activeSection = document.querySelector('.app-section:not(.hidden)');
        return activeSection ? activeSection.id : null;
    }

    showShortcutFeedback(description) {
        // Crear notificación temporal
        const feedback = document.createElement('div');
        feedback.className = 'fixed top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm z-50 backdrop-blur-sm';
        feedback.textContent = description;
        
        document.body.appendChild(feedback);
        
        // Animar entrada
        requestAnimationFrame(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(-10px)';
            feedback.style.transition = 'all 0.3s ease-out';
            
            requestAnimationFrame(() => {
                feedback.style.opacity = '1';
                feedback.style.transform = 'translateY(0)';
            });
        });
        
        // Remover después de 2 segundos
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(-10px)';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    // =================================================================================
    // HELP OVERLAY
    // =================================================================================
    createHelpOverlay() {
        // Verificar que document.body esté disponible
        if (!document.body) {
            if (window.IS_DEV) {
                console.warn('⌨️ Help overlay diferido - DOM no disponible');
            }
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'shortcuts-help-overlay';
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4';
        
        overlay.innerHTML = `
            <div class="bg-theme-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold">Atajos de Teclado</h3>
                    <button id="close-shortcuts-help" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-bold text-theme-primary mb-3">Navegación</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between"><span>Dashboard</span><kbd class="bg-gray-700 px-2 py-1 rounded">1</kbd></div>
                            <div class="flex justify-between"><span>Tareas</span><kbd class="bg-gray-700 px-2 py-1 rounded">2</kbd></div>
                            <div class="flex justify-between"><span>Calendario</span><kbd class="bg-gray-700 px-2 py-1 rounded">3</kbd></div>
                            <div class="flex justify-between"><span>Kaizen</span><kbd class="bg-gray-700 px-2 py-1 rounded">4</kbd></div>
                            <div class="flex justify-between"><span>Configuración</span><kbd class="bg-gray-700 px-2 py-1 rounded">5</kbd></div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-bold text-theme-primary mb-3">Acciones Rápidas</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between"><span>Nueva Tarea</span><kbd class="bg-gray-700 px-2 py-1 rounded">Ctrl+N</kbd></div>
                            <div class="flex justify-between"><span>Nuevo Proyecto</span><kbd class="bg-gray-700 px-2 py-1 rounded">Ctrl+P</kbd></div>
                            <div class="flex justify-between"><span>Guardar</span><kbd class="bg-gray-700 px-2 py-1 rounded">Ctrl+S</kbd></div>
                            <div class="flex justify-between"><span>Buscar</span><kbd class="bg-gray-700 px-2 py-1 rounded">Ctrl+F</kbd></div>
                            <div class="flex justify-between"><span>Toggle Tema</span><kbd class="bg-gray-700 px-2 py-1 rounded">Ctrl+D</kbd></div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-bold text-theme-primary mb-3">Calendario</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between"><span>Mes Anterior</span><kbd class="bg-gray-700 px-2 py-1 rounded">←</kbd></div>
                            <div class="flex justify-between"><span>Mes Siguiente</span><kbd class="bg-gray-700 px-2 py-1 rounded">→</kbd></div>
                            <div class="flex justify-between"><span>Ir a Hoy</span><kbd class="bg-gray-700 px-2 py-1 rounded">T</kbd></div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-bold text-theme-primary mb-3">Navegación de Tareas</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between"><span>Siguiente Tarea</span><kbd class="bg-gray-700 px-2 py-1 rounded">J</kbd></div>
                            <div class="flex justify-between"><span>Anterior Tarea</span><kbd class="bg-gray-700 px-2 py-1 rounded">K</kbd></div>
                            <div class="flex justify-between"><span>Editar Tarea</span><kbd class="bg-gray-700 px-2 py-1 rounded">Enter</kbd></div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 text-center text-sm text-gray-400">
                    Presiona <kbd class="bg-gray-700 px-2 py-1 rounded">H</kbd> para mostrar/ocultar esta ayuda
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Event listener para cerrar
        document.getElementById('close-shortcuts-help').addEventListener('click', () => {
            this.showHelpOverlay(false);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.showHelpOverlay(false);
            }
        });
    }

    showHelpOverlay(visible) {
        const overlay = document.getElementById('shortcuts-help-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !visible);
            this.helpVisible = visible;
        }
    }

    // =================================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================================
    addCustomShortcut(key, description, action, options = {}) {
        this.addShortcut(key, description, action, options);
    }

    removeShortcut(key, options = {}) {
        const shortcutKey = this.createShortcutKey(key, options);
        this.shortcuts.delete(shortcutKey);
    }

    disableShortcuts() {
        this.disabled = true;
    }

    enableShortcuts() {
        this.disabled = false;
    }
}

// Crear instancia global solo cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.KeyboardShortcuts = new KeyboardShortcuts();
    });
} else {
    window.KeyboardShortcuts = new KeyboardShortcuts();
}

if (window.IS_DEV) {
    console.log('⌨️ Keyboard Shortcuts cargado');
}
