import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  // TEMP (ngrok demo): proxy /api/* to the local NestJS API so the storefront
  // can be served same-origin through a single tunnel. Safe to remove after the demo.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
    ]
  },
  // Dopóki NEXT_PUBLIC_ALLOW_INDEXING !== 'true' (staging), wysyłamy nagłówek
  // X-Robots-Tag: noindex na każdą odpowiedź — twardsza warstwa niż samo meta/robots.txt,
  // obejmuje też zasoby nie-HTML. Na produkcji (flaga = 'true') nagłówek znika.
  async headers() {
    if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true') return []
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
