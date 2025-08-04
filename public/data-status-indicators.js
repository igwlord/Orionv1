// Data Status Indicators - Indicadores de estado de datos
// Proporciona feedback visual sobre el estado de sincronización y operaciones de datos

class DataStatusIndicators {
  constructor() {
    this.indicators = new Map();
    this.init();
  }

  init() {
    console.log('📊 Inicializando indicadores de estado de datos...');
    this.createIndicatorContainer();
    this.setupEventListeners();
  }

  createIndicatorContainer() {
    // Crear contenedor para indicadores si no existe
    if (!document.getElementById('data-status-container')) {
      const container = document.createElement('div');
      container.id = 'data-status-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }
  }

  setupEventListeners() {
    // Escuchar eventos de estado de datos
    window.addEventListener('dataSync', (event) => {
      this.showSyncStatus(event.detail);
    });

    window.addEventListener('dataError', (event) => {
      this.showErrorStatus(event.detail);
    });

    window.addEventListener('dataSuccess', (event) => {
      this.showSuccessStatus(event.detail);
    });
  }

  showSyncStatus(data) {
    this.showIndicator('sync', '🔄 Sincronizando...', 'bg-blue-500', 3000);
  }

  showErrorStatus(data) {
    this.showIndicator('error', '❌ Error en datos', 'bg-red-500', 5000);
  }

  showSuccessStatus(data) {
    this.showIndicator('success', '✅ Datos guardados', 'bg-green-500', 2000);
  }

  showIndicator(type, message, bgClass, duration = 3000) {
    const container = document.getElementById('data-status-container');
    if (!container) return;

    // Remover indicador existente del mismo tipo
    const existingIndicator = this.indicators.get(type);
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Crear nuevo indicador
    const indicator = document.createElement('div');
    indicator.className = `${bgClass} text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transform transition-all duration-300 translate-x-full`;
    indicator.textContent = message;

    container.appendChild(indicator);
    this.indicators.set(type, indicator);

    // Animación de entrada
    setTimeout(() => {
      indicator.classList.remove('translate-x-full');
    }, 100);

    // Auto-remover después del tiempo especificado
    setTimeout(() => {
      this.removeIndicator(type);
    }, duration);
  }

  removeIndicator(type) {
    const indicator = this.indicators.get(type);
    if (indicator) {
      indicator.classList.add('translate-x-full');
      setTimeout(() => {
        indicator.remove();
        this.indicators.delete(type);
      }, 300);
    }
  }

  // Método para mostrar estado de conexión
  showConnectionStatus(isOnline) {
    const message = isOnline ? '🌐 Conectado' : '📶 Sin conexión';
    const bgClass = isOnline ? 'bg-green-500' : 'bg-orange-500';
    this.showIndicator('connection', message, bgClass, 2000);
  }

  // Método para mostrar progreso de carga
  showLoadingProgress(progress) {
    const container = document.getElementById('data-status-container');
    if (!container) return;

    let progressIndicator = this.indicators.get('progress');
    
    if (!progressIndicator) {
      progressIndicator = document.createElement('div');
      progressIndicator.className = 'bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium';
      container.appendChild(progressIndicator);
      this.indicators.set('progress', progressIndicator);
    }

    progressIndicator.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        <span>Cargando... ${Math.round(progress)}%</span>
      </div>
    `;

    if (progress >= 100) {
      setTimeout(() => {
        this.removeIndicator('progress');
      }, 1000);
    }
  }
}

// Inicializar automáticamente
if (typeof window !== 'undefined') {
  window.dataStatusIndicators = new DataStatusIndicators();
  
  // Exponer métodos globalmente para fácil acceso
  window.showDataStatus = {
    sync: () => window.dataStatusIndicators.showSyncStatus(),
    error: (msg) => window.dataStatusIndicators.showErrorStatus({message: msg}),
    success: (msg) => window.dataStatusIndicators.showSuccessStatus({message: msg}),
    connection: (isOnline) => window.dataStatusIndicators.showConnectionStatus(isOnline),
    progress: (progress) => window.dataStatusIndicators.showLoadingProgress(progress)
  };
  
  console.log('📊 Data Status Indicators cargado correctamente');
}
