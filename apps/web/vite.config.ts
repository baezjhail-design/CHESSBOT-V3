import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// El navegador solo habla con la API (HTTP + WebSocket). Nunca con MQTT ni con las ESP32.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_URL ?? 'http://localhost:3000', changeOrigin: true },
      '/ws': { target: (process.env.VITE_API_URL ?? 'http://localhost:3000').replace(/^http/, 'ws'), ws: true },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
