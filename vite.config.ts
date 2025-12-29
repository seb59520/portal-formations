import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  // Injecter la version dans les variables d'environnement
  envPrefix: 'VITE_',
  build: {
    // Générer des noms de fichiers avec hash pour le cache busting
    rollupOptions: {
      output: {
        // Ajouter un hash au nom des fichiers pour forcer le rechargement
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
    // Augmenter la taille limite pour les warnings
    chunkSizeWarningLimit: 1000,
  },
  server: {
    hmr: {
      overlay: true,
    },
    // Éviter les problèmes de connexion persistante
    watch: {
      usePolling: false,
    },
  },
})
