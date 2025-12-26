/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {}  // Fixed from previous issue
  },
  // Prevent API routes from being statically generated
  exportPathMap: async function (defaultPathMap) {
    // Remove API routes from static generation
    const pathMap = {};
    for (const [path, page] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/api/')) {
        pathMap[path] = page;
      }
    }
    return pathMap;
  }
}

export default nextConfig;
