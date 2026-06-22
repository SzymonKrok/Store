import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
