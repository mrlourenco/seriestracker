export function registerServiceWorker() {
  // Only register in production builds — in dev the SW would cache Vite's
  // dev assets and the cache name placeholder is never stamped.
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/seriestracker/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // Check for a new SW version on every page load
        registration.update()
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })
  })
}
