#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Configurando variables de entorno para producción...');

// Crear el script de configuración con las variables de entorno reales
const config = `
// Configuración inyectada durante el build de Netlify
window.FIREBASE_CONFIG = {
  apiKey: "${process.env.VITE_FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${process.env.VITE_FIREBASE_PROJECT_ID || ''}",
  storageBucket: "${process.env.VITE_FIREBASE_STORAGE_BUCKET || ''}",
  messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}",
  appId: "${process.env.VITE_FIREBASE_APP_ID || ''}",
  measurementId: "${process.env.VITE_FIREBASE_MEASUREMENT_ID || ''}"
};

window.APP_CONFIG = {
  appId: "${process.env.VITE_APP_ID || 'orion-v1'}",
  mode: "${process.env.VITE_MODE || 'firebase'}"
};

// Solo en desarrollo - mostrar configuración cargada
if (typeof console !== 'undefined') {
  console.log('🔥 Configuración de producción cargada:', {
    hasApiKey: !!window.FIREBASE_CONFIG.apiKey,
    projectId: window.FIREBASE_CONFIG.projectId,
    mode: window.APP_CONFIG.mode,
    timestamp: new Date().toISOString()
  });
}
`;

// Escribir el archivo de configuración
const configPath = path.join(__dirname, 'public', 'config.js');
fs.writeFileSync(configPath, config.trim());

console.log('✅ Archivo config.js generado correctamente');
console.log('🔧 Variables encontradas:', {
  VITE_FIREBASE_API_KEY: !!process.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_PROJECT_ID: !!process.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_AUTH_DOMAIN: !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_APP_ID: !!process.env.VITE_FIREBASE_APP_ID,
  VITE_MODE: process.env.VITE_MODE || 'firebase'
});

// Mostrar preview del archivo generado
console.log('📄 Contenido del config.js:');
console.log('---');
console.log(config.substring(0, 200) + '...');
console.log('---');
