import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Paths resolve relative to the project root
      input: {
        // "/" is the marketing page — plain HTML, no React bundle needed to read it
        landing: 'index.html',
        // "/app.html" is the operator studio
        app: 'app.html',
      },
    },
  },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
