// =================================================================================
// ORION LOGGER - Sistema de Logs Inteligente para Desarrollo y Producción
// =================================================================================

class Logger {
    constructor() {
        // Detectar entorno
        this.isDevelopment = window.IS_DEV || false;
        this.isProduction = !this.isDevelopment;
        
        // Configurar niveles de log
        this.levels = {
            ERROR: 0,   // Siempre visible
            WARN: 1,    // Visible en dev y errores críticos en prod
            INFO: 2,    // Solo en desarrollo
            DEBUG: 3    // Solo en desarrollo con flag especial
        };
        
        // Nivel actual (en producción solo ERROR y WARN críticos)
        this.currentLevel = this.isProduction ? this.levels.WARN : this.levels.DEBUG;
        
        // Configuración de colores para desarrollo
        this.colors = {
            error: '#ff4757',
            warn: '#ffa502', 
            info: '#2ed573',
            debug: '#5352ed',
            success: '#2ed573',
            feature: '#3742fa'
        };
    }

    // =================================================================================
    // MÉTODOS PRINCIPALES
    // =================================================================================
    
    error(message, ...args) {
        this._log('error', '❌', message, ...args);
    }
    
    warn(message, ...args) {
        if (this.currentLevel >= this.levels.WARN) {
            this._log('warn', '⚠️', message, ...args);
        }
    }
    
    info(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', 'ℹ️', message, ...args);
        }
    }
    
    debug(message, ...args) {
        if (this.currentLevel >= this.levels.DEBUG) {
            this._log('debug', '🔍', message, ...args);
        }
    }
    
    success(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', '✅', message, ...args);
        }
    }

    // =================================================================================
    // MÉTODOS ESPECIALIZADOS PARA ORION
    // =================================================================================
    
    // PWA y Service Worker
    pwa(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', '🚀', message, ...args);
        }
    }
    
    // Firebase y autenticación
    firebase(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', '🔥', message, ...args);
        }
    }
    
    // Base de datos y sincronización
    db(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', '💾', message, ...args);
        }
    }
    
    // Navegación y UI
    nav(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', '🧭', message, ...args);
        }
    }
    
    // Performance y métricas
    perf(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', '⚡', message, ...args);
        }
    }
    
    // Gestos y teclado
    input(message, ...args) {
        if (this.currentLevel >= this.levels.INFO) {
            this._log('info', '⌨️', message, ...args);
        }
    }

    // =================================================================================
    // MÉTODOS INTERNOS
    // =================================================================================
    
    _log(level, emoji, message, ...args) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `${emoji} [${timestamp}]`;
        
        if (this.isDevelopment) {
            // En desarrollo: logs con colores y formato completo
            console.log(
                `%c${prefix} ${message}`,
                `color: ${this.colors[level]}; font-weight: bold;`,
                ...args
            );
        } else {
            // En producción: logs mínimos y solo críticos
            if (level === 'error') {
                console.error(prefix, message, ...args);
            } else if (level === 'warn' && this._isCriticalWarning(message)) {
                console.warn(prefix, message, ...args);
            }
            // INFO y DEBUG no se muestran en producción
        }
    }
    
    _isCriticalWarning(message) {
        // Solo warnings críticos en producción
        const criticalKeywords = [
            'firebase', 'auth', 'network', 'storage', 'critical', 
            'failed', 'error', 'timeout', 'connection'
        ];
        
        return criticalKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
    }

    // =================================================================================
    // UTILIDADES
    // =================================================================================
    
    // Cambiar nivel dinámicamente (solo en desarrollo)
    setLevel(level) {
        if (this.isDevelopment && this.levels[level] !== undefined) {
            this.currentLevel = this.levels[level];
            this.info(`Logger level changed to: ${level}`);
        }
    }
    
    // Información del logger
    getInfo() {
        return {
            environment: this.isDevelopment ? 'development' : 'production',
            currentLevel: Object.keys(this.levels)[this.currentLevel],
            logsEnabled: this.currentLevel >= this.levels.INFO
        };
    }
    
    // Método para testing (solo desarrollo)
    test() {
        if (this.isDevelopment) {
            this.error('Test error message');
            this.warn('Test warning message');
            this.info('Test info message');
            this.debug('Test debug message');
            this.success('Test success message');
            this.pwa('Test PWA message');
            this.firebase('Test Firebase message');
        }
    }
}

// =================================================================================
// INSTANCIA GLOBAL
// =================================================================================

// Crear instancia global
window.Logger = new Logger();

// Alias para compatibilidad
window.log = window.Logger;

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}

// Log de inicialización
window.Logger.success('Logger system initialized');

// En desarrollo, hacer test si se solicita
if (window.Logger.isDevelopment && window.location.search.includes('test-logger')) {
    window.Logger.test();
}
