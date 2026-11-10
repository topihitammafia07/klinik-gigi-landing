import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://griyafisio.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Griya Fisioterapi Supra Medika — Klinik Fisioterapi & Tumbuh Kembang',
    template: '%s | Griya Fisioterapi Supra Medika',
  },
  description:
    'Griya Fisioterapi Supra Medika, pusat layanan keterapian fisik di Kabupaten Sukoharjo. Layanan unggulan stimulasi tumbuh kembang dan baby massage usia 0 bulan-5 tahun, fisioterapi dewasa, rehabilitasi pasca stroke & operasi, terapi wicara, okupasi terapi, akupuntur, bekam, dan ortotik prostetik.',
  keywords: [
    'klinik fisioterapi sukoharjo',
    'fisioterapi sukoharjo',
    'terapi tumbuh kembang anak',
    'baby massage sukoharjo',
    'terapi wicara',
    'okupasi terapi',
    'akupuntur sukoharjo',
    'bekam sukoharjo',
    'ortotik prostetik',
    'rehabilitasi pasca stroke',
    'Griya Fisioterapi Supra Medika',
    'griyafisio',
  ],
  authors: [{ name: 'Griya Fisioterapi Supra Medika' }],
  creator: 'Griya Fisioterapi Supra Medika',
  publisher: 'Griya Fisioterapi Supra Medika',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: BASE_URL,
    siteName: 'Griya Fisioterapi Supra Medika',
    title: 'Griya Fisioterapi Supra Medika — Klinik Fisioterapi & Tumbuh Kembang',
    description:
      'Pusat keterapian fisik di Kabupaten Sukoharjo — stimulasi tumbuh kembang & baby massage anak, fisioterapi dewasa, terapi wicara, okupasi terapi, akupuntur, bekam, dan ortotik prostetik.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Griya Fisioterapi Supra Medika — Klinik Fisioterapi & Tumbuh Kembang',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Griya Fisioterapi Supra Medika — Klinik Fisioterapi & Tumbuh Kembang',
    description: 'Pusat keterapian fisik di Kabupaten Sukoharjo untuk anak dan dewasa: tumbuh kembang, baby massage, fisioterapi, terapi wicara, okupasi terapi, akupuntur & bekam.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />

        {/* Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MedicalClinic',
              name: 'Griya Fisioterapi Supra Medika',
              description:
                'Pusat layanan keterapian fisik di Kabupaten Sukoharjo dengan layanan unggulan stimulasi tumbuh kembang dan baby massage usia 0 bulan-5 tahun, fisioterapi dewasa, terapi wicara, okupasi terapi, akupuntur, bekam, dan ortotik prostetik.',
              url: BASE_URL,
              telephone: '0877-3633-9217',
              email: 'hello@griyafisio.com',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Pandowo, Joho, Kec. Sukoharjo',
                addressLocality: 'Kabupaten Sukoharjo',
                addressRegion: 'Jawa Tengah',
                postalCode: '57513',
                addressCountry: 'ID',
              },
              medicalSpecialty: [
                'Physiotherapy',
                'PediatricPhysicalTherapy',
                'SpeechLanguagePathology',
                'OccupationalTherapy',
              ],
              additionalType: [
                'Acupuncture',
                'Cupping Therapy',
                'Orthotics and Prosthetics',
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}