/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable modern CSS features
    turbo: {
      rules: {
        '*.css': {
          loaders: ['css-loader'],
          as: '*.css',
        },
      },
    },
  },
  // Configure file upload limits
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
