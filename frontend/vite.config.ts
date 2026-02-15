import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: '../static/dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'lit': ['lit', '@lit/reactive-element'],
          'signals': ['@preact/signals-core', '@lit-labs/preact-signals'],
          'router': ['@lit-labs/router'],
          'icons': ['@tabler/icons'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
