import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to serve HMR/static chunks to phones on the LAN
  // when testing AR over https://<lan-ip>:3000.
  allowedDevOrigins: ["192.168.1.200", "100.117.250.25"],
};

export default nextConfig;
