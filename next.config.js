/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the dev client to connect when the app is opened through 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
};

module.exports = nextConfig;
