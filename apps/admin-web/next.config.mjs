/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@telegram-store/shared'],
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.INTERNAL_API_URL || 'http://api:4000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
