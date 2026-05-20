/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nexus/core', '@nexus/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

module.exports = nextConfig;