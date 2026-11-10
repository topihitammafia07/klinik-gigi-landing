import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // WORKAROUND: Next.js 16.2.x punya bug dimana remotePatterns gagal match
    // walau konfigurasi sudah benar (lihat vercel/next.js#88873, masih open per Jan 2026).
    // Sampai upstream fix rilis, matikan optimizer built-in — gambar tetap
    // tampil (tanpa resize/optimasi otomatis dari Next).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
        search: '',
      },
      // Foto terapis & galeri ruangan disajikan dari storage backend Laravel.
      {
        protocol: 'https',
        hostname: 'api.griyafisio.com',
        pathname: '/**',
        search: '',
      },
      // Local dev fallback
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;