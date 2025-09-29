import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => ({
  server: {
    host: 'localhost',
    port: 8080,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',  
      port: 8080,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: "dist/spa",
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    '__DEV__': mode === 'development'
  },
  plugins: [react()],

  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./client", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
}));



