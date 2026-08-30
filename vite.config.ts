import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    outDir: mode === 'site' ? 'dist/site' : 'dist/app',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: { manualChunks: undefined }
    }
  },
  server: { watch: { ignored: ['**/src-tauri/target/**'] } },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] }
}))
