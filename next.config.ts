import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'sidtuvasgtmodtrjmhbw.supabase.co',
      'placehold.co', // プレースホルダー画像用
    ],
    // または、より詳細な設定としてremotePatternsを使用する場合
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'sidtuvasgtmodtrjmhbw.supabase.co',
    //     pathname: '/storage/v1/object/public/**',
    //   },
    // ],
  },
};

export default nextConfig;
