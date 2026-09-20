import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

function serviceWorkerPlugin(): Plugin {
  return {
    name: 'anchor-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).map((f) => `/anchor/${f}`)
      const precache = [
        '/anchor/',
        '/anchor/index.html',
        '/anchor/favicon.svg',
        '/anchor/site.webmanifest',
        ...files,
      ]
      const source = `const CACHE = 'anchor-p0-v2';
const ASSETS = ${JSON.stringify(precache)};
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match('/anchor/index.html'));
    })
  );
});
`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  base: '/anchor/',
  plugins: [react(), serviceWorkerPlugin()],
  test: {
    environment: 'node',
  },
})
