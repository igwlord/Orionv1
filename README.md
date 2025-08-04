# 🌌 ORION – Tu Universo de Productividad Kaizen

> “Organiza. Evoluciona. Expande tu universo.” ✨

🪐 Orion es una web app cósmica e interactiva para gestión de tareas, proyectos y hábitos basada en el método **Kaizen**.  
Diseñada para ayudarte a crecer paso a paso 🚀 mientras disfrutás de una experiencia visual única 💫.

📍 **Sitio live**: [orionv2.netlify.app](https://orionv2.netlify.app/)

---

## 🧩 Funcionalidades

- 🎉 **Pantalla de bienvenida** con efecto *typewriter* y botón "Comenzar"
- 📊 **Dashboard** con progreso visual y estadísticas
- ✅ **Sistema Kanban** con secciones: *Por hacer*, *Haciendo* y *Completadas*
- 📅 **Calendario** con tareas marcadas por fecha y botón “Ir a hoy”
- 🧘 **Sección Kaizen** con explicación + CTA para empezar
- 🎨 **Modo claro y oscuro** con paletas cósmicas y pastel
- ⚙️ **Configuración**: temas, perfil, exportar/importar JSON, reinicio total
- 📱 **Diseño responsive** completamente adaptable a mobile

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| 🧬 HTML5    | Estructura principal |
| 🎨 Tailwind CSS | Estilos rápidos y responsivos |
| 🔥 Firebase | Autenticación y base de datos (opcional) |
| ⚡ Vanilla JS | Lógica de aplicación |
| 📱 PWA | Service Worker para funcionamiento offline |

---

## 🔧 Configuración

### Modo Invitado (Por defecto)
La aplicación funciona completamente offline usando localStorage. No necesitas configurar nada.

### Autenticación con Google (Opcional)
Para habilitar login con Google y sincronización en la nube:

1. **Crear proyecto Firebase:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Habilita Authentication > Sign-in method > Google
   - Habilita Firestore Database

2. **Configurar variables de entorno:**
   - Copia `.env.example` a `.env`
   - Reemplaza los valores con tu configuración de Firebase
   - En Netlify: Settings > Environment variables

3. **Configuración Firebase:**
   ```
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
   VITE_MODE=firebase
   ```

---
| ⚙️ JavaScript (vanilla) | Interacción dinámica |
| 🌍 Netlify | Hosting y despliegue |
| 💾 LocalStorage | Persistencia de datos offline |

---

## 🚀 Cómo Ejecutar Localmente

```bash

📁 orion/
├── index.html
├── css/
│   └── style.css (con Tailwind)
├── js/
│   └── main.js
├── assets/
│   └── íconos, imágenes y fondos
└── README.md

# 1. Clonar el repositorio
git clone https://github.com/tuusuario/orion.git
cd orion

# 2. Abrir el archivo HTML en el navegador
index.html


✨ Contribuciones

¡Toda ayuda es bienvenida! 🤝
Si querés colaborar:

    Haz un fork 🌀

    Crea una rama (git checkout -b mejora-feature)

    Commitea (git commit -m 'Agrego mejora')

    Push (git push origin mejora-feature)

    Abrí un Pull Request 🚀

📦 Licencia

MIT © Neptune Studios
Desarrollado con ☕ y ✨ por una mente cósmica en expansión.
💬 Contacto

📧 neptnunestudios@gmail.com
🌐 neptunestudios.netlify.app



