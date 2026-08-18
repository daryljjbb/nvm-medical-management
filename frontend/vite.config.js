
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // 👈 Add this line to force absolute paths for all production assets
  plugins: [react()],
})

