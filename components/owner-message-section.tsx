'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const ownerProfile = {
  name: process.env.NEXT_PUBLIC_OWNER_NAME || 'Owner Griya Fisioterapi Supra Medika',
  role: process.env.NEXT_PUBLIC_OWNER_ROLE || 'Owner Klinik',
  photoUrl:
    process.env.NEXT_PUBLIC_OWNER_PHOTO_URL ||
    '/assets/agus-supramono-owner.png',
  message:
    process.env.NEXT_PUBLIC_OWNER_MESSAGE ||
    'Kami ingin setiap pasien datang dengan rasa aman, dipahami kebutuhannya, dan mendapatkan program terapi yang tepat. Griya Fisioterapi Supra Medika dibangun untuk menghadirkan layanan yang profesional, manusiawi, dan terus berkembang bersama kebutuhan pasien.',
};

export function OwnerMessageSection() {
  return (
    <section className="py-20 bg-white" aria-labelledby="owner-message-heading">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-center bg-[#f7faf9] border border-[#bcc9c6]/30 rounded-[28px] p-5 md:p-8 lg:p-10 shadow-sm"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="relative min-h-[340px] md:min-h-[430px] rounded-[22px] overflow-hidden bg-[#e0f4f1]">
            <Image
              src={ownerProfile.photoUrl}
              alt={`Foto ${ownerProfile.name}`}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              loading="lazy"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/55 via-transparent to-transparent" />
            <div className="absolute left-5 right-5 bottom-5 text-white">
              <p className="text-lg md:text-xl font-bold">{ownerProfile.name}</p>
              <p className="text-sm text-white/85 mt-1">{ownerProfile.role}</p>
            </div>
          </div>

          <div className="py-2 md:py-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e0f4f1] text-[#00685f] text-xs font-bold uppercase tracking-[0.14em] mb-5">
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                format_quote
              </span>
              Sambutan Owner
            </div>
            <h2 id="owner-message-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] leading-tight">
              Pelayanan yang Baik Dimulai dari Kepedulian.
            </h2>
            <blockquote className="mt-6 text-lg md:text-xl text-[#3d4947] leading-relaxed">
              “{ownerProfile.message}”
            </blockquote>
            <div className="mt-7 flex items-center gap-3">
              <div className="h-px w-12 bg-[#00685f]" />
              <div>
                <p className="font-bold text-[#0b1c30]">{ownerProfile.name}</p>
                <p className="text-sm text-[#00685f] font-semibold">{ownerProfile.role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
