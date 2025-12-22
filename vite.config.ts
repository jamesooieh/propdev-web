/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

  // Load .env files based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  console.log('Mode:', mode);
  console.log('VITE_API_SERVER_NAME:', env.VITE_API_SERVER_NAME);
  console.log('VITE_OUT_DIR:', env.VITE_OUT_DIR);

  return {
    plugins: [
      react(),
      legacy()
    ],

    build: {
      outDir: env.VITE_OUT_DIR || 'dist',
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },

    server: {
      // https: {
      //   key: fs.readFileSync(path.resolve(__dirname, './.ionic/ssl/key.pem')),
      //   cert: fs.readFileSync(path.resolve(__dirname, './.ionic/ssl/cert.pem')),
      // },
      host: 'localhost',
      port: 8999,
    }
  };
})
