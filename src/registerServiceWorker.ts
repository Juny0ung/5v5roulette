export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      const swUrl = `${window.location.origin}/5v5roulette/service-worker.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => console.log('service worker registered', reg.scope))
        .catch((err) => console.error('service worker registration failed', err));
    });
  }
}
