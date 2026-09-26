/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@telegram-store/shared'],
  devIndicators: false,
};

export default nextConfig;
