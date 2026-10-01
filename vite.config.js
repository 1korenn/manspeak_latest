import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // keep three.js in its own chunk; it's only fetched once the page is idle
        manualChunks: { three: ['three'] }
      }
    }
  }
});
