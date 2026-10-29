/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type errors now fail the build (the codebase type-checks cleanly with `npx tsc --noEmit`).
    ignoreBuildErrors: false,
  },
  eslint: {
    // No ESLint config is committed yet, so linting is skipped during builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
