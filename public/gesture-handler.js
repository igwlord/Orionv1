// =================================================================================
// ORION GESTURE HANDLER - Advanced Mobile UX
// =================================================================================

class GestureHandler {
    constructor() {
        this.isTouch = 'ontouchstart' in window;
        this.isMobile = window.innerWidth <= 768;
        
        this.gestures = {
            swipe: {
                threshold: 50,
                velocity: 0.3,
                maxTime: 500
            },
            pinch: {
                threshold: 0.1
            },
            longPress: {
                duration: 500
            }
        };
        
        this.activeGestures = new Map();
        this.touchData = {};
        
        this.init();
    }

    // =================================================================================
    // INICIALIZACIÓN
    // =================================================================================
    init() {
        if (!this.isTouch) {
            if (window.IS_DEV) {
                console.log('👆 Gestures deshabilitados - No es dispositivo táctil');
            }
            return;
        }
        
        this.setupEventListeners();
        this.registerGestures();
        this.createGestureIndicators();
        
        if (window.IS_DEV) {
            console.log('👆 Gesture Handler iniciado');
        }
    }

    // =================================================================================
    // EVENT LISTENERS
    // =================================================================================
    setupEventListeners() {
        // Touch events
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        document.addEventListener('touchcancel', (e) => this.handleTouchCancel(e));
        
        // Prevenir zoom accidental
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
        
        // Orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
    }

    // =================================================================================
    // TOUCH HANDLERS
    // =================================================================================
    handleTouchStart(e) {
        const touch = e.touches[0];
        const touchId = touch.identifier;
        
        this.touchData[touchId] = {
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now(),
            element: e.target,
            moved: false
        };
        
        // Iniciar detección de long press
        if (e.touches.length === 1) {
            this.startLongPressDetection(touchId, e.target);
        }
        
        // Multi-touch para pinch
        if (e.touches.length === 2) {
            this.startPinchDetection(e);
        }
    }

    handleTouchMove(e) {
        const touch = e.touches[0];
        const touchId = touch.identifier;
        const touchData = this.touchData[touchId];
        
        if (!touchData) return;
        
        const deltaX = touch.clientX - touchData.startX;
        const deltaY = touch.clientY - touchData.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Marcar como moved si se supera threshold
        if (distance > 10) {
            touchData.moved = true;
            this.cancelLongPress(touchId);
        }
        
        // Detectar swipe en progreso
        if (distance > this.gestures.swipe.threshold) {
            this.detectSwipeDirection(touchData, deltaX, deltaY);
        }
        
        // Manejar pinch
        if (e.touches.length === 2) {
            this.handlePinchMove(e);
        }
        
        // Prevenir scroll nativo en gestos específicos
        if (this.shouldPreventDefault(e, touchData)) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        const touchId = touch.identifier;
        const touchData = this.touchData[touchId];
        
        if (!touchData) return;
        
        const deltaX = touch.clientX - touchData.startX;
        const deltaY = touch.clientY - touchData.startY;
        const duration = Date.now() - touchData.startTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Detectar tap vs swipe
        if (!touchData.moved && duration < 200) {
            this.handleTap(touch, touchData.element);
        } else if (distance > this.gestures.swipe.threshold && duration < this.gestures.swipe.maxTime) {
            this.handleSwipe(deltaX, deltaY, duration, touchData.element);
        }
        
        // Cleanup
        this.cancelLongPress(touchId);
        delete this.touchData[touchId];
    }

    handleTouchCancel(e) {
        for (const touch of e.changedTouches) {
            const touchId = touch.identifier;
            this.cancelLongPress(touchId);
            delete this.touchData[touchId];
        }
    }

    // =================================================================================
    // GESTURE DETECTION
    // =================================================================================
    detectSwipeDirection(touchData, deltaX, deltaY) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            touchData.direction = deltaX > 0 ? 'right' : 'left';
        } else {
            // Vertical swipe
            touchData.direction = deltaY > 0 ? 'down' : 'up';
        }
    }

    handleSwipe(deltaX, deltaY, duration, element) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / duration;
        
        if (velocity < this.gestures.swipe.velocity) return;
        
        let direction;
        if (absDeltaX > absDeltaY) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        this.executeSwipeAction(direction, element, { velocity, distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY) });
    }

    handleTap(touch, element) {
        // Tap handling si es necesario
        if (window.IS_DEV) {
            console.log('👆 Tap detectado');
        }
    }

    // =================================================================================
    // LONG PRESS
    // =================================================================================
    startLongPressDetection(touchId, element) {
        this.touchData[touchId].longPressTimer = setTimeout(() => {
            if (this.touchData[touchId] && !this.touchData[touchId].moved) {
                this.handleLongPress(element);
            }
        }, this.gestures.longPress.duration);
    }

    cancelLongPress(touchId) {
        if (this.touchData[touchId]?.longPressTimer) {
            clearTimeout(this.touchData[touchId].longPressTimer);
            delete this.touchData[touchId].longPressTimer;
        }
    }

    handleLongPress(element) {
        // Detectar contexto y ejecutar acción
        if (element.closest('.task-card')) {
            this.showTaskContextMenu(element);
        } else if (element.closest('.nav-button')) {
            this.showSectionInfo(element);
        } else {
            this.showGlobalContextMenu(element);
        }
        
        // Haptic feedback si está disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    // =================================================================================
    // PINCH GESTURES
    // =================================================================================
    startPinchDetection(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        this.pinchData = {
            startDistance: this.getTouchDistance(touch1, touch2),
            startTime: Date.now()
        };
    }

    handlePinchMove(e) {
        if (!this.pinchData) return;
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = this.getTouchDistance(touch1, touch2);
        const scale = currentDistance / this.pinchData.startDistance;
        
        // Detectar zoom in/out
        if (Math.abs(scale - 1) > this.gestures.pinch.threshold) {
            if (scale > 1.1) {
                this.handlePinchOut();
            } else if (scale < 0.9) {
                this.handlePinchIn();
            }
        }
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handlePinchOut() {
        // Zoom out - mostrar vista general o reducir escala
        this.showOverviewMode();
    }

    handlePinchIn() {
        // Zoom in - mostrar detalles o aumentar escala
        this.showDetailMode();
    }

    // =================================================================================
    // ACCIONES DE GESTOS
    // =================================================================================
    executeSwipeAction(direction, element, data) {
        const currentSection = this.getCurrentSection();
        
        // Swipes globales
        switch (direction) {
            case 'right':
                if (currentSection === 'tasks') {
                    this.markTaskAsComplete(element);
                } else {
                    this.navigateToPreviousSection();
                }
                break;
                
            case 'left':
                if (currentSection === 'tasks') {
                    this.markTaskAsIncomplete(element);
                } else {
                    this.navigateToNextSection();
                }
                break;
                
            case 'up':
                if (currentSection === 'dashboard') {
                    this.showQuickActions();
                } else {
                    this.scrollToTop();
                }
                break;
                
            case 'down':
                if (currentSection === 'dashboard') {
                    this.hideQuickActions();
                } else {
                    this.showSearch();
                }
                break;
        }
        
        this.showGestureIndicator(direction, data.velocity);
    }

    // =================================================================================
    // NAVEGACIÓN POR GESTOS
    // =================================================================================
    navigateToNextSection() {
        const sections = ['dashboard', 'tasks', 'calendar', 'kaizen', 'settings'];
        const currentSection = this.getCurrentSection();
        const currentIndex = sections.indexOf(currentSection);
        const nextIndex = (currentIndex + 1) % sections.length;
        
        this.navigateToSection(sections[nextIndex]);
    }

    navigateToPreviousSection() {
        const sections = ['dashboard', 'tasks', 'calendar', 'kaizen', 'settings'];
        const currentSection = this.getCurrentSection();
        const currentIndex = sections.indexOf(currentSection);
        const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
        
        this.navigateToSection(sections[prevIndex]);
    }

    navigateToSection(sectionName) {
        if (window.AppShellManager) {
            window.AppShellManager.forceTransition(sectionName);
        } else {
            const button = document.querySelector(`[data-section="${sectionName}"]`);
            if (button) {
                button.click();
            }
        }
    }

    // =================================================================================
    // ACCIONES ESPECÍFICAS
    // =================================================================================
    markTaskAsComplete(element) {
        const taskCard = element.closest('.task-card');
        if (taskCard) {
            const checkbox = taskCard.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
                this.showActionFeedback('Tarea completada', 'success');
            }
        }
    }

    markTaskAsIncomplete(element) {
        const taskCard = element.closest('.task-card');
        if (taskCard) {
            const checkbox = taskCard.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change'));
                this.showActionFeedback('Tarea marcada como pendiente', 'info');
            }
        }
    }

    showQuickActions() {
        const quickActions = document.getElementById('quick-actions-panel') || this.createQuickActionsPanel();
        quickActions.classList.remove('hidden');
        this.showActionFeedback('Panel de acciones rápidas', 'info');
    }

    hideQuickActions() {
        const quickActions = document.getElementById('quick-actions-panel');
        if (quickActions) {
            quickActions.classList.add('hidden');
        }
    }

    showSearch() {
        const searchInput = document.getElementById('search-tasks-input');
        if (searchInput) {
            searchInput.focus();
            this.showActionFeedback('Búsqueda activada', 'info');
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.showActionFeedback('Ir al inicio', 'info');
    }

    showOverviewMode() {
        // Implementar vista general
        this.showActionFeedback('Modo vista general', 'info');
    }

    showDetailMode() {
        // Implementar vista detallada
        this.showActionFeedback('Modo vista detallada', 'info');
    }

    // =================================================================================
    // CONTEXT MENUS
    // =================================================================================
    showTaskContextMenu(element) {
        const taskCard = element.closest('.task-card');
        if (!taskCard) return;
        
        this.createContextMenu([
            { text: 'Editar', action: () => taskCard.click() },
            { text: 'Completar', action: () => this.markTaskAsComplete(element) },
            { text: 'Eliminar', action: () => this.deleteTask(taskCard) },
            { text: 'Duplicar', action: () => this.duplicateTask(taskCard) }
        ], element);
    }

    showSectionInfo(element) {
        const section = element.dataset.section;
        this.showActionFeedback(`Información de ${section}`, 'info');
    }

    showGlobalContextMenu(element) {
        this.createContextMenu([
            { text: 'Nueva Tarea', action: () => this.createNewTask() },
            { text: 'Configuración', action: () => this.navigateToSection('settings') },
            { text: 'Exportar Datos', action: () => this.exportData() },
            { text: 'Modo Offline', action: () => this.toggleOfflineMode() }
        ], element);
    }

    createContextMenu(items, element) {
        // Remover menú existente
        const existingMenu = document.getElementById('gesture-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.id = 'gesture-context-menu';
        menu.className = 'fixed bg-theme-card border border-gray-600 rounded-lg shadow-xl z-50 min-w-48';
        
        items.forEach(item => {
            const menuItem = document.createElement('button');
            menuItem.className = 'block w-full text-left px-4 py-3 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg';
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            menu.appendChild(menuItem);
        });
        
        // Posicionar menú
        const rect = element.getBoundingClientRect();
        menu.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
        menu.style.top = Math.min(rect.bottom + 10, window.innerHeight - 200) + 'px';
        
        document.body.appendChild(menu);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => menu.remove(), 5000);
        
        // Remover al hacer tap fuera
        setTimeout(() => {
            const removeOnTap = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('touchstart', removeOnTap);
                }
            };
            document.addEventListener('touchstart', removeOnTap);
        }, 100);
    }

    // =================================================================================
    // FEEDBACK VISUAL
    // =================================================================================
    showGestureIndicator(direction, velocity) {
        const indicator = document.createElement('div');
        indicator.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-theme-primary text-white px-4 py-2 rounded-full text-sm z-50';
        
        const arrows = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→'
        };
        
        indicator.innerHTML = `${arrows[direction]} ${direction.toUpperCase()}`;
        
        document.body.appendChild(indicator);
        
        // Animar
        indicator.style.opacity = '0';
        indicator.style.transform = 'translate(-50%, -50%) scale(0.5)';
        indicator.style.transition = 'all 0.3s ease-out';
        
        requestAnimationFrame(() => {
            indicator.style.opacity = '1';
            indicator.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => indicator.remove(), 300);
        }, 1000);
    }

    showActionFeedback(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        const feedback = document.createElement('div');
        feedback.className = `fixed bottom-4 left-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg text-sm z-50`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(20px)';
            feedback.style.transition = 'all 0.3s ease-out';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    createGestureIndicators() {
        // Crear indicadores visuales para gestos disponibles si es necesario
        if (!this.isMobile) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'gesture-hint';
        indicator.className = 'fixed bottom-2 right-2 text-xs text-gray-500 z-40 pointer-events-none';
        indicator.innerHTML = '👆 Swipe para navegar';
        
        document.body.appendChild(indicator);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 300);
            }
        }, 5000);
    }

    // =================================================================================
    // UTILIDADES
    // =================================================================================
    getCurrentSection() {
        const activeSection = document.querySelector('.app-section:not(.hidden)');
        return activeSection ? activeSection.id : null;
    }

    shouldPreventDefault(e, touchData) {
        // Prevenir scroll nativo durante gestos específicos
        const element = touchData.element;
        
        if (element.closest('.task-card') || element.closest('.nav-button')) {
            return true;
        }
        
        return false;
    }

    handleOrientationChange() {
        this.isMobile = window.innerWidth <= 768;
        
        // Reajustar elementos si es necesario
        const existingMenu = document.getElementById('gesture-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    // =================================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================================
    registerGestures() {
        // Registrar gestos personalizados si es necesario
        if (window.IS_DEV) {
            console.log('👆 Gestos registrados para dispositivos táctiles');
        }
    }

    enableGestures() {
        this.disabled = false;
    }

    disableGestures() {
        this.disabled = true;
    }

    createNewTask() {
        const createBtn = document.getElementById('create-task-btn');
        if (createBtn) {
            createBtn.click();
        }
    }

    createQuickActionsPanel() {
        const panel = document.createElement('div');
        panel.id = 'quick-actions-panel';
        panel.className = 'fixed bottom-20 left-4 right-4 bg-theme-card rounded-lg p-4 shadow-xl z-40 hidden';
        
        panel.innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <button class="bg-theme-primary text-white p-3 rounded-lg" onclick="window.GestureHandler.createNewTask()">
                    ➕ Nueva Tarea
                </button>
                <button class="bg-blue-600 text-white p-3 rounded-lg" onclick="window.GestureHandler.navigateToSection('calendar')">
                    📅 Calendario
                </button>
                <button class="bg-green-600 text-white p-3 rounded-lg" onclick="window.KeyboardShortcuts?.quickSave()">
                    💾 Guardar
                </button>
                <button class="bg-purple-600 text-white p-3 rounded-lg" onclick="window.GestureHandler.navigateToSection('settings')">
                    ⚙️ Configuración
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);
        return panel;
    }
}

// Crear instancia global solo cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GestureHandler = new GestureHandler();
    });
} else {
    window.GestureHandler = new GestureHandler();
}

if (window.IS_DEV) {
    console.log('👆 Gesture Handler cargado');
}
