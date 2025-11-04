import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({mode}) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), '')

  // Convert comma-separated string to array
  const allowedHosts = env.ALLOWED_HOSTS?.split(',') || []

  return defineConfig({
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    server: {
      host: true,
      allowedHosts, // use the array here
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  })
}
