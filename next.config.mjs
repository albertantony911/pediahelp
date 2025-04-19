/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    appDir: true, // 👈 Forces Next.js to prioritize /app routing
  },
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
    ]
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;