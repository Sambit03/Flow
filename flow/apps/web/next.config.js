/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // @neondatabase/auth@0.3.0-beta has a malformed .d.mts file in its bundled
    // better-auth dep that causes a parse error. Skip build-time type errors
    // until the library ships a fix. Type checking still works in the IDE.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
