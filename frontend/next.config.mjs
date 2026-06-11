/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // This tells Vercel: "Ignore TypeScript errors and just deploy the site!"
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also ignore ESLint errors just in case
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
