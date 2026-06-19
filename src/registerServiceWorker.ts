export function registerServiceWorker() {
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
