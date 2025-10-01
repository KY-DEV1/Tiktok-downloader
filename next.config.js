/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  images: {
    domains: ['www.tikwm.com', 'i.pinimg.com', 'p16-sign-va.tiktokcdn.com'],
    unoptimized: true // Penting untuk static export
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

// Untuk static export di Netlify
if (process.env.NODE_ENV === 'production') {
  nextConfig.output = 'export';
  nextConfig.assetPrefix = './';
  nextConfig.basePath = '';
}

module.exports = nextConfig;
