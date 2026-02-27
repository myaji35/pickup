/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Docker standalone 빌드 (프로덕션 배포용)
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend',
    NEXT_PUBLIC_RAILS_API_URL: process.env.NEXT_PUBLIC_RAILS_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'development',
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://localhost:3013/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
