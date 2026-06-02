import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: '/biguo-ai/',
    build: {
      outDir: 'docs',
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || 'https://api.deepseek.com/v1'),
      'import.meta.env.VITE_MODEL': JSON.stringify(process.env.VITE_MODEL || env.VITE_MODEL || 'deepseek-chat'),
    },
  }
})
