# klinik-landing

Website publik Klinik Fisioterapi. Berisi profil klinik, daftar layanan, profil terapis, dan form booking. Diindeks search engine dan dapat diakses siapa saja.

## Tech Stack

- **Framework**: Next.js 16.2.6 (App Router, SSG)
- **Bundler**: Turbopack
- **Styling**: Tailwind CSS v4
- **Animasi**: Framer Motion
- **Form**: React Hook Form
- **HTTP Client**: Axios
- **SEO**: Next.js Metadata API

## Requirements

- Node.js 20+
- npm

## Setup Lokal

### 1. Clone & install dependency

```bash
git clone https://github.com/YOUR_ORG/klinik-landing.git
cd klinik-landing
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Jalankan development server

```bash
npm run dev
# Buka http://localhost:3001
```

> Jalankan di port 3001 agar tidak bentrok dengan `klinik-internal` di port 3000:
> ```bash
> npm run dev -- -p 3001
> ```

### 4. Build untuk production (SSG)

```bash
npm run build
npm run start
```

## Struktur Direktori

```
app/                  # Next.js App Router pages
  layout.tsx          # Root layout + metadata SEO
  page.tsx            # Homepage
public/
  robots.txt          # Allow all (diindeks search engine)
```