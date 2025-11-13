import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({mode}) => {

  const env = loadEnv(mode, process.cwd(), '')


  const allowedHosts = env.ALLOWED_HOSTS?.split(',') || []

  return defineConfig({
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    server: {
      host: true,
      allowedHosts, 
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
