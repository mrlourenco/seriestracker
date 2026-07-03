import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Fall back to a timestamp when git isn't available (zip deploy, bare Docker
// context) so the build still succeeds and the SW cache name stays unique.
let gitHash: string
try {
  gitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  gitHash = Date.now().toString(36)
}

// Stamps the service worker cache name with the git hash so each deploy
// invalidates the previous cache without manual version bumps.
function stampServiceWorker(): Plugin {
  return {
    name: 'stamp-sw-build-id',
    apply: 'build',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist/sw.js')
      const content = readFileSync(swPath, 'utf-8')
      writeFileSync(swPath, content.replaceAll('__BUILD_ID__', gitHash))
    },
  }
}

export default defineConfig({
  plugins: [react(), stampServiceWorker()],
  base: '/seriestracker/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_HASH__: JSON.stringify(gitHash),
  },
})
