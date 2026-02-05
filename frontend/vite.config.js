import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Pastikan root diarahkan ke folder frontend
  root: './', 
  build: {
    rollupOptions: {
      input: {
        // HANYA sisakan index.html sebagai pintu masuk
        main: resolve(__dirname, 'index.html'),
      }
    },
    outDir: 'dist' // Folder hasil build
  },
  server: {
    proxy: {
      // Meneruskan request API ke Backend Port 5000
      '/api': 'http://localhost:5000'
    }
  }
})