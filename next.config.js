/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  // Exclude functions directory and other non-frontend files
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    // Exclude functions directory from webpack
    config.module.rules.push({
      test: /functions\//,
      loader: 'ignore-loader'
    });
    return config;
  },

}

module.exports = nextConfig 