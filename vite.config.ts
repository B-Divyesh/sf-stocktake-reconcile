import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    outDir: mode === 'site' ? 'dist/site' : 'dist/app',
    emptyOutDir: false,
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: { manualChunks: undefined }
    }
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
}))
