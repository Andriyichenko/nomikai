/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed to enable API routes and Server Side Rendering
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
};

export default nextConfig;