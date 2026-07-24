import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@shohojdhara/atomix"],
  sassOptions: {
    includePaths: [
      path.join(process.cwd(), "src/styles"),
      path.join(process.cwd(), "node_modules"),
    ],
    silenceDeprecations: ["legacy-js-api", "import"],
  },
};

export default nextConfig;
