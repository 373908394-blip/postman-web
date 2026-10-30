import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps assets working both on a custom domain and on
// GitHub Pages project pages (https://<user>.github.io/<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    // 端口被占用时直接报错，而不是静默漂移到 5174 —— 否则浏览器停在 5173
    // 会看到别人的 404，非常难排查。
    strictPort: true,
    host: 'localhost',
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
