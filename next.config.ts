import type { NextConfig } from "next";
import path from "path";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const useMsw = process.env.NEXT_PUBLIC_USE_MSW !== "false";

const nextConfig: NextConfig = {
  transpilePackages: ["@shohojdhara/atomix"],
  sassOptions: {
    includePaths: [
      path.join(process.cwd(), "src/styles"),
      path.join(process.cwd(), "node_modules"),
    ],
    silenceDeprecations: ["legacy-js-api", "import"],
  },
  async rewrites() {
    if (useMsw) {
      return [];
    }

    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/v1/auth/:path*`,
      },
      {
        source: "/api/me",
        destination: `${apiUrl}/api/v1/me`,
      },
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
