import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB. Image uploads (chat/profile/payment/prize proofs)
      // are capped at 4MB client- and server-side (lib/uploadLimits.ts) —
      // this just needs to clear that plus multipart overhead, while staying
      // under Vercel's own 4.5MB hard limit on Serverless Function bodies
      // (which this setting cannot raise).
      bodySizeLimit: "4.4mb",
    },
  },
};

export default nextConfig;
