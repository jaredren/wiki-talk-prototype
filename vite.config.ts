import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from /<repo-name>/.
// The deploy workflow sets VITE_BASE to "/<repo-name>/"; local dev uses "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
})
