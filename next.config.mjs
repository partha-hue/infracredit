// Dynamically enable next-pwa when available. This avoids build failures
// when the package cannot be imported in certain CI environments (e.g., Vercel)
// while still enabling PWA during local/dev builds when installed.

let withPWA = (cfg) => cfg;
let runtimeCaching = undefined;

try {
  // top-level await is supported in ESM modules — perform dynamic imports
  const pwaMod = await import('next-pwa');
  const cacheMod = await import('next-pwa/cache');
  withPWA = pwaMod.default || pwaMod;
  runtimeCaching = cacheMod.default || cacheMod;
  console.log('next-pwa loaded successfully');
} catch (err) {
  console.warn('next-pwa not available; PWA will be disabled for this build');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {}
  }
};

if (runtimeCaching) {
  nextConfig.pwa = {
    dest: 'public',
    runtimeCaching,
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
  };
}

export default withPWA(nextConfig);
