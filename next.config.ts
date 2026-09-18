import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 requires every quality the app asks for to be listed here, and
    // ships with `[75]` alone. The photographs are the product on this site,
    // so the showcase images are served untouched at 100 and the small marks
    // stay on the 75 default.
    qualities: [75, 100],
  },
};

export default nextConfig;
