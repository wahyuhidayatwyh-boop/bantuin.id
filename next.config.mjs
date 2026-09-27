/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Disable trace file to prevent EPERM permission errors on Windows (antivirus lock)
  outputFileTracingExcludes: {
    '*': ['**/*.trace'],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "clsx", "tailwind-merge"],
  },
  images: {
    domains: [
      'images.unsplash.com',
      'plus.unsplash.com',
      'avatar.vercel.sh',
      'api.dicebear.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
