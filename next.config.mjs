/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.pixabay.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname:"avatars.githubusercontent.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },

    ],
  },
};

export default nextConfig;
