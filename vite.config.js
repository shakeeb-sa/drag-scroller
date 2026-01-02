import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // FIX: Polyfill process.env so React doesn't crash
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify('production')
    }
  },
  build: {
    minify: false, // Keep false for safety
    rollupOptions: {
      input: {
        main: 'src/main.jsx',
      },
      output: {
        entryFileNames: 'content.js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'iife',
        name: 'DragScroller',
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
  },
})