import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps assets working both on a custom domain and on
// GitHub Pages project pages (https://<user>.github.io/<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
