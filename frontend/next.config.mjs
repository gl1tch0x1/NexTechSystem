/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is enabled by default in Next.js 16.
  // The @ alias is resolved automatically via tsconfig.json paths —
  // no custom webpack alias needed. Setting turbopack: {} silences
  // the "webpack config with no turbopack config" build error.
  turbopack: {},
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
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
    // Fallback to local backend in all environments (prevents 404s for any new backend routes)
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Protected-By', value: 'Cloudflare-Enterprise-Anti-DDoS' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://lh3.googleusercontent.com https://firebasestorage.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' http://localhost:5000 https://nextechsystem.vercel.app https://api.tamara.co https://api-sandbox.tamara.co https://api.tabby.ai https://*.firebaseio.com https://*.googleapis.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
