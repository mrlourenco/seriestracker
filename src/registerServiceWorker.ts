export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/seriestracker/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // Force an immediate check for a new SW version on every page load
        registration.update()

        // When a new SW has installed and is waiting, skip waiting immediately
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })
  })

  // Reload the page when the SW changes controller (new version took over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
