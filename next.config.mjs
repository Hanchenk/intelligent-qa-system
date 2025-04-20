/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@uiw/react-md-editor'],
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
