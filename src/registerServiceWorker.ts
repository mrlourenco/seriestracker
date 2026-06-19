export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/seriestracker/sw.js')
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })
  })
}
