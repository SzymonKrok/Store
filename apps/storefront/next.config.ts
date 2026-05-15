import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
  },
}

export default nextConfig
