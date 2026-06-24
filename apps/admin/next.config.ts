import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
  // Panel admina zawsze ukryty przed wyszukiwarkami.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
