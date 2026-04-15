import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { blogLoaderPlugin } from './plugins/vite-plugin-blog-loader'

export default defineConfig({
  plugins: [
    blogLoaderPlugin(),
    react(),
    visualizer({ filename: 'dist/stats.html', open: false }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          markdown: ['react-markdown', 'react-syntax-highlighter'],
        },
      },
    },
  },
  server: {
    port: 5173,
    hmr: true,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
