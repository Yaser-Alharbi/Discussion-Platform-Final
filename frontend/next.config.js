/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:9999/api/:path*',
  //     },
  //   ];
  // },
  // Enable experimental features if needed
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig; 