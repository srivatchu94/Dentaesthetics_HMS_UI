import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    {
      name: 'copy-staticwebapp-config',
      writeBundle() {
        // Copy staticwebapp.config.json to dist folder after build
        const source = path.resolve(__dirname, 'staticwebapp.config.json')
        const dest = path.resolve(__dirname, 'dist', 'staticwebapp.config.json')
        
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest)
          console.log('✓ Copied staticwebapp.config.json to dist/')
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
