import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// VITE_BASE : sous-chemin de publication (ex. "/spike/" pour le staging HODI).
const base = process.env.VITE_BASE || '/';

export default defineConfig(({ command, mode }) => {
  // Un NODE_ENV=development hérité du shell (cas du serveur HODI) ferait
  // embarquer React en mode développement dans le bundle : on le force en build.
  if (command === 'build' && mode === 'production') {
    process.env.NODE_ENV = 'production';
  }

  return {
    base,
    plugins: [react(), tailwindcss()],
    build: {
      // Le build est servi par AdonisJS (dossier public/ copié dans server/build).
      outDir: '../server/public',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:3333',
      },
    },
  };
});
