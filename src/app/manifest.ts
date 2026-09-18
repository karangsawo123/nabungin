import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nabungin — Nabung Bersama, Tumbuh Bersama',
    short_name: 'Nabungin',
    description:
      'Platform tabungan personal dan kolaboratif transparan, aman, dan berbiaya Rp0. Wujudkan target finansial bersama.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#090D16',
    theme_color: '#090D16',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      {
        src: '/logo-opsi2.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-opsi2.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-opsi2.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo-opsi2.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.png',
        sizes: '64x64',
        type: 'image/png',
      },
    ],
  }
}
