import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Paddlecheck',
    short_name: 'Paddlecheck',
    description: 'A kayaking conditions dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#3f51b5',
    icons: [
      {
        src: '/icons/kayaking.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
