import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:8081";

const nextConfig: NextConfig = {
  // Proxy API + auth requests to the Express server so everything is same-origin.
  // The server's BETTER_AUTH_URL points at this app, so the OAuth callback
  // (/api/auth/callback/google) is forwarded through here as well.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
