import withPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pwa: {
    dest: 'public',
    runtimeCaching,
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
  },
  experimental: {
    turbo: {}
  }
}

export default withPWA(nextConfig);
