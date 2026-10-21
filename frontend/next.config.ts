import type { NextConfig } from "next";
import os from "os";

// Deteksi otomatis seluruh alamat IPv4 lokal yang aktif (Wi-Fi, Hotspot, LAN)
function getLocalNetworkIps(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if ((net.family === "IPv4" || (net.family as unknown) === 4) && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const activeIps = getLocalNetworkIps();

// Cetak informasi alamat akses jaringan secara otomatis di terminal Next.js
console.log("\n=======================================================");
console.log("🚀 SIM-JADWAL GA (Next.js)");
console.log("📍 Akses Lokal PC        : http://localhost:3000");
if (activeIps.length > 0) {
  activeIps.forEach((ip) => {
    console.log(`🌐 Akses Jaringan (HP/LAN): http://${ip}:3000`);
  });
} else {
  console.log("⚠️  Tidak ada alamat IP Wi-Fi/LAN eksternal yang terdeteksi.");
}
console.log("ℹ️  Catatan: Jangan buka 0.0.0.0 (itu alamat binding sistem, bukan web URL)");
console.log("=======================================================\n");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Izinkan localhost dan semua IP jaringan lokal yang aktif secara dinamis
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    ...activeIps,
    ...activeIps.map((ip) => `${ip}:3000`),
    "*.local",
    "*.local:3000",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;

