import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'src/main.jsx', // Entry point
      },
      output: {
        entryFileNames: 'content.js', // Output file name
        assetFileNames: 'assets/[name].[ext]',
        // This ensures it builds into a format Chrome understands
        format: 'iife', 
        name: 'DragScroller'
      },
    },
    // Prevent code splitting (keep it in one file for simplicity)
    cssCodeSplit: false, 
  },
  // Ensure the variable names don't conflict with page variables
  define: {
    'process.env': {}
  }
})