import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import express from 'express'
import { createApiRouter } from './api/api.js'

function apiPlugin(): Plugin {
  return {
    name: 'api-server',
    configureServer(server) {
      const app = express()
      app.use('/api', createApiRouter())
      server.middlewares.use(app)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
})
