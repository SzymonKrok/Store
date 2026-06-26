import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  // Proxy /api/* to the Railway backend so that OAuth callbacks (e.g. Google)
  // land on the same domain as the storefront and get forwarded correctly.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) return []
    const apiBase = apiUrl.replace(/\/api$/, '')
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
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
