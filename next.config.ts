import type { NextConfig } from 'next';

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sidtuvasgtmodtrjmhbw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '**',
      },
    ],
  },
  eslint: {
    // 開発中は警告を無視してビルドを続行
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
