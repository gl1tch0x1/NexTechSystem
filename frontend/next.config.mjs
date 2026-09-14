/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is enabled by default in Next.js 16.
  // The @ alias is resolved automatically via tsconfig.json paths —
  // no custom webpack alias needed. Setting turbopack: {} silences
  // the "webpack config with no turbopack config" build error.
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const proxyTarget = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
    if (proxyTarget && !proxyTarget.includes('localhost') && !proxyTarget.includes('127.0.0.1')) {
      const cleanTarget = proxyTarget.replace(/\/$/, '').replace(/\/api$/, '');
      return [
        {
          source: '/api/:path*',
          destination: `${cleanTarget}/api/:path*`,
        },
      ];
    }
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Protected-By', value: 'Cloudflare-Enterprise-Anti-DDoS' },
        ],
      },
    ];
  },
};

export default nextConfig;
