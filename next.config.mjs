/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Increase body size limit for video uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb'
    }
  },
  
  // Configure API routes
  api: {
    bodyParser: {
      sizeLimit: '500mb'
    },
    responseLimit: false
  }
};

export default nextConfig;


