'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicClinicData } from '@/hooks/use-public-clinic-data';
import { OperationalHoursList } from '@/components/operational-hours-list';
import { OwnerMessageSection } from '@/components/owner-message-section';
import {
  getConfiguredBookingSlots,
  getLatestBookingStartTime,
  isBookingTimeWithinOperationalHours,
  formatRupiah,
  formatServiceDuration,
  getOperationalHourForDate,
  getServicePrice,
  getServiceStartingPrice,
} from '@/lib/clinic-format';
import { FALLBACK_SERVICES, type LandingService } from '@/lib/landing-data';
import type { PublicClinicInfo } from '@/types/public-clinic';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  honeypot?: string;
}

interface BookingData {
  service: string;
  therapist_id: number;
  therapist_name: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientGender: 'male' | 'female';
  patientBirthDate: string;
  symptoms: string;
  consent: boolean;
}

interface ApiTherapist {
  id: number;
  name: string;
  specialization: string;
  initials: string;
  photo_url?: string | null;
}

interface ApiGalleryImage {
  id: number;
  title: string;
  url: string;
}

interface BookedRange {
  start: string;
  end: string;
}

type ToastState = { type: 'success' | 'error' | 'warning' | 'info'; message: string } | null;

// ─── Static Data ─────────────────────────────────────────────────────────────

const SERVICES = FALLBACK_SERVICES;

const THERAPISTS = [
  { name: 'Gustari Lusiana, S.Tr. Kes', role: 'Terapis', initials: 'GL', color: 'bg-[#e0f4f1] text-[#00685f]' },
  { name: 'Agus Supramono, S.Kes', role: 'Terapis', initials: 'AS', color: 'bg-[#dce9ff] text-[#0058be]' },
  { name: 'Sarti Rahayu, A.Md. Kes', role: 'Terapis', initials: 'SR', color: 'bg-[#dcfce7] text-[#006b2d]' },
  { name: 'Zulanda Indah Widyastuti, S.Tr.Kes', role: 'Terapis', initials: 'ZI', color: 'bg-[#fef3c7] text-[#92400e]' },
  { name: 'Arfian Eka Nugraha, S.Fis., Ftr', role: 'Fisioterapi', initials: 'AE', color: 'bg-[#e0f4f1] text-[#00685f]' },
  { name: 'Hutami Laksmi Rismayanti, A.Md.Kes', role: 'Terapis', initials: 'HL', color: 'bg-[#dce9ff] text-[#0058be]' },
  { name: 'Nur Adiim, A.Md. Kes', role: 'Terapis', initials: 'NA', color: 'bg-[#dcfce7] text-[#006b2d]' },
  { name: 'Zafaf Musyafa, S.Kes', role: 'Terapis', initials: 'ZM', color: 'bg-[#fef3c7] text-[#92400e]' },
  { name: 'Irawan Aji Prasetyotomo, A.Md.OP.HEIC', role: 'Ortotik Prostetik', initials: 'IA', color: 'bg-[#fce7f3] text-[#9d174d]' },
  { name: 'Annisa Nur Fadhlilah Ardiansyah, A.Md. Kes', role: 'Terapis', initials: 'AN', color: 'bg-[#e0f2fe] text-[#0369a1]' },
  { name: 'Safira Ayu Adriani, S.Tr. Kes', role: 'Terapis', initials: 'SA', color: 'bg-[#ede9fe] text-[#5b21b6]' },
  { name: 'Dwi Prasetyo, A.Md.Akup', role: 'Akupuntur', initials: 'DP', color: 'bg-[#ffe4e6] text-[#be123c]' },
] as const;

const STATS = [
  { icon: 'history_edu', value: '5.000+', label: 'Sesi Terapi', color: 'text-[#00685f]', bg: 'bg-[#e0f4f1]' },
  { icon: 'groups', value: '1.000+', label: 'Pasien Aktif', color: 'text-[#0058be]', bg: 'bg-[#dce9ff]' },
  { icon: 'medical_information', value: '20+', label: 'Tenaga Profesional', color: 'text-[#006b2d]', bg: 'bg-[#dcfce7]' },
  { icon: 'sentiment_very_satisfied', value: '95%', label: 'Kepuasan Pasien', color: 'text-[#92400e]', bg: 'bg-[#fef3c7]' },
] as const;

const TESTIMONIALS = [
  {
    quote: 'Layanan sangat profesional. Terapisnya ramah dan penjelasannya mudah dimengerti. Anak saya menunjukkan kemajuan pesat dalam 3 bulan.',
    name: 'Bunda Clarissa',
    role: 'Orang Tua Pasien',
    rating: 5,
  },
  {
    quote: 'Fisioterapi pasca operasi ACL saya berjalan luar biasa. Alat-alatnya modern dan programnya terukur. Saya sudah bisa kembali berolahraga.',
    name: 'Bapak Andre',
    role: 'Atlet Profesional',
    rating: 5,
  },
  {
    quote: 'Klinik paling nyaman yang pernah saya kunjungi. Dashboard online-nya sangat membantu untuk reschedule jadwal terapi kapan saja.',
    name: 'Ibu Melati',
    role: 'Pasien Terapi Wicara',
    rating: 5,
  },
] as const;

const GALLERY_IMAGES = [
  {
    src: '/assets/ruang-fisioterapi.jpeg',
    alt: 'Ruang fisioterapi dengan peralatan terkini',
    label: 'Ruang Fisioterapi',
  },
  {
    src: '/assets/ruang-terapi-latihan.jpeg',
    alt: 'Ruang terapi latihan untuk sesi rehabilitasi',
    label: 'Ruang Terapi Latihan',
  },
  {
    src: '/assets/ruang-terapi-wicara.jpeg',
    alt: 'Ruang terapi wicara untuk anak dan dewasa',
    label: 'Ruang Terapi Wicara',
  },
  {
    src: '/assets/ruang-okupasi-terapi.jpeg',
    alt: 'Ruang okupasi terapi untuk kemandirian pasien',
    label: 'Ruang Okupasi Terapi',
  },
  {
    src: '/assets/ruang-pendaftaran.jpeg',
    alt: 'Ruang pendaftaran klinik yang bersih dan nyaman',
    label: 'Ruang Pendaftaran',
  },
  {
    src: '/assets/ruang-konsultasi.jpeg',
    alt: 'Ruang konsultasi dengan tenaga profesional',
    label: 'Ruang Konsultasi',
  },
] as const;

const PROCESS_STEPS = [
  { step: 1, icon: 'calendar_month', label: 'Booking', desc: 'Daftar online atau via WhatsApp.' },
  { step: 2, icon: 'manage_search', label: 'Asesmen', desc: 'Pemeriksaan awal oleh tim ahli.' },
  { step: 3, icon: 'analytics', label: 'Evaluasi', desc: 'Diskusi diagnosa & target terapi.' },
  { step: 4, icon: 'fitness_center', label: 'Program', desc: 'Menjalankan sesi terapi rutin.' },
  { step: 5, icon: 'monitoring', label: 'Monitoring', desc: 'Pantau progress via dashboard.' },
  { step: 6, icon: 'verified', label: 'Final Eval', desc: 'Evaluasi hasil akhir terapi.' },
] as const;

const FAQ = [
  {
    q: 'Berapa lama durasi satu sesi terapi?',
    a: 'Durasi satu sesi terapi mulai dari 30 menit sampai 90 menit, tergantung kondisi dan kebutuhan pasien yang ditentukan saat asesmen awal.',
  },
  {
    q: 'Bagaimana cara reschedule jadwal?',
    a: 'Reschedule jadwal dapat dilakukan melalui website atau via WhatsApp CS kami.',
  },
  {
    q: 'Apakah tersedia layanan untuk dewasa?',
    a: 'Ya, kami melayani kasus dewasa seperti gangguan nyeri, spasme otot, keterbatasan gerak sendi, lemah anggota gerak, serta pemulihan pasca operasi.',
  },
  {
    q: 'Layanan apa saja untuk bayi dan anak?',
    a: 'Layanan bayi dan anak meliputi massage/pijat bayi & balita, stimulasi tumbuh kembang, dan terapi inhalasi batuk pilek.',
  },
  {
    q: 'Apakah menerima asuransi?',
    a: 'Untuk sementara kami belum bekerja sama dengan pihak asuransi.',
  },
] as const;

function addMinutes(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + Math.max(1, minutesToAdd);
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    ease: "easeOut",
  },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// ─── Utility ────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ state, onDismiss }: { state: ToastState; onDismiss: () => void }) {
  if (!state) return null;
  const styles = {
    success: { icon: 'check_circle', iconColor: 'text-[#00873b]', border: 'border-l-4 border-[#00873b]', bar: 'bg-[#00873b]' },
    error: { icon: 'cancel', iconColor: 'text-[#ba1a1a]', border: 'border-l-4 border-[#ba1a1a]', bar: 'bg-[#ba1a1a]' },
    warning: { icon: 'warning', iconColor: 'text-[#d97706]', border: 'border-l-4 border-[#d97706]', bar: 'bg-[#d97706]' },
    info: { icon: 'info', iconColor: 'text-[#0058be]', border: 'border-l-4 border-[#0058be]', bar: 'bg-[#0058be]' },
  }[state.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }}
      className={`fixed bottom-6 right-6 z-[200] min-w-[300px] max-w-sm bg-white rounded-xl shadow-xl overflow-hidden ${styles.border}`}
      role="alert"
    >
      <div className="flex items-start gap-3 px-4 py-3 pr-10">
        <span className={`material-symbols-outlined text-[22px] mt-0.5 flex-shrink-0 ${styles.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{styles.icon}</span>
        <p className="text-sm font-medium text-[#0b1c30] leading-relaxed">{state.message}</p>
      </div>
      <button onClick={onDismiss} className="absolute top-2.5 right-2.5 text-[#6d7a77] hover:text-[#0b1c30]" aria-label="Tutup">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
      <div className={`h-1 w-full ${styles.bar} animate-[shrink_5s_linear_forwards]`} />
    </motion.div>
  );
}

// ─── Holiday Announcement Modal ──────────────────────────────────────────────

function HolidayAnnouncementModal({ holidays }: { holidays?: Array<{ date: string; name: string }> }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = sessionStorage.getItem('dismissed_holiday_modal');
      if (!isDismissed && holidays && holidays.length > 0) {
        const timer = setTimeout(() => setIsOpen(true), 250);
        return () => clearTimeout(timer);
      }
    }
  }, [holidays]);

  if (!isOpen || !holidays || holidays.length === 0) return null;

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dismissed_holiday_modal', 'true');
    }
  };

  const formatHolidayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 z-10 p-6 sm:p-8 my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="holiday-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Brand / Logo Header */}
        <div className="mb-6">
          <Image
            src="/assets/logo.png"
            alt="Griya Fisioterapi Supra Medika"
            width={140}
            height={36}
            className="h-8 w-auto object-contain mb-4"
          />
          <h3 id="holiday-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
            Pemberitahuan Libur Klinik
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Klinik tidak beroperasi sementara pada tanggal berikut:
          </p>
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-slate-100 border-y border-slate-100 my-5">
          {holidays.map((h) => (
            <div key={h.date} className="py-3.5 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900 text-sm sm:text-base">
                  {formatHolidayDate(h.date)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Keterangan: <span className="font-medium capitalize text-slate-900">{h.name}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                Tutup
              </span>
            </div>
          ))}
        </div>

        {/* Brief Note */}
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Pelayanan kembali beroperasi normal pada hari kerja berikutnya. Anda tetap dapat melakukan reservasi online untuk tanggal lainnya melalui website ini.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <a
            href="https://wa.me/6287736339217"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#00685f] hover:underline inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Hubungi WhatsApp
          </a>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl bg-[#00685f] text-white text-xs font-semibold hover:bg-[#008378] active:scale-[0.99] transition-all cursor-pointer shadow-sm"
          >
            Saya Mengerti
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────

function MobileMenu({ open, onClose, onBooking, bookingDisabled = false }: { open: boolean; onClose: () => void; onBooking: () => void; bookingDisabled?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        // z-[60] supaya sidebar tampil DI ATAS navbar (z-50), bukan di belakangnya
        <motion.div className="fixed inset-0 z-[60] md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#bcc9c6]/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image src="/assets/logo.png" alt="Griya Fisioterapi Supra Medika" width={110} height={28} className="h-7 w-auto object-contain" />
              <button onClick={onClose} className="text-[#6d7a77]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {[['Layanan', '#layanan'], ['Fasilitas', '#fasilitas'], ['Terapis', '#terapis'], ['Tentang', '#tentang'], ['Kontak', '#kontak']].map(([label, href]) => (
                <a key={label} href={href} onClick={onClose} className="px-4 py-3 rounded-xl text-[#0b1c30] hover:bg-[#e0f4f1] hover:text-[#00685f] font-medium transition-colors">{label}</a>
              ))}
            </nav>
            <div className="px-4 mt-auto pb-8 flex flex-col gap-3">
              <button disabled={bookingDisabled} onClick={() => { onBooking(); onClose(); }} className="text-center px-4 py-3 bg-[#00685f] text-white rounded-xl font-semibold hover:bg-[#008378] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {bookingDisabled ? 'Klinik Sedang Libur' : 'Booking Online'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Calendar Component ───────────────────────────────────────────────────────

function BookingCalendar({ selected, onSelect, clinicInfo }: { selected: string; onSelect: (d: string) => void; clinicInfo: PublicClinicInfo }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = (clinicInfo?.holiday_dates ?? []).some((h) => h.date === dateKey);
    const operationalHour = getOperationalHourForDate(clinicInfo, dateKey);
    const hasBookingSlots = getConfiguredBookingSlots(operationalHour).length > 0;
    const allowsCustomTime = operationalHour?.allow_custom_booking_time === true;
    return isPast || isHoliday || !operationalHour?.is_open || (!hasBookingSlots && !allowsCustomTime);
  };

  const isSelected = (day: number) => selected === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[#6d7a77] text-[20px]">chevron_left</span>
        </button>
        <span className="font-semibold text-[#0b1c30] text-sm">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[#6d7a77] text-[20px]">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#94a3b8] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const disabled = isDisabled(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const holiday = (clinicInfo?.holiday_dates ?? []).find((h) => h.date === dateStr);
          return (
            <button
              key={day}
              onClick={() => !disabled && onSelect(dateStr)}
              disabled={disabled}
              title={holiday ? `Libur: ${holiday.name}` : undefined}
              className={`
                w-full aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center relative
                ${disabled ? 'text-[#cbd5e1] cursor-not-allowed' : ''}
                ${holiday ? 'bg-[#fee2e2]/40 text-[#ba1a1a]' : ''}
                ${sel ? 'bg-[#00685f] text-white shadow-md' : ''}
                ${tod && !sel ? 'ring-2 ring-[#00685f] text-[#00685f] font-bold' : ''}
                ${!disabled && !sel ? 'hover:bg-[#e0f4f1] text-[#0b1c30]' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────

function isTherapistSpecialistForService(therapistSpec: string | undefined, serviceName: string | undefined): boolean {
  if (!therapistSpec || !serviceName) return false;
  const spec = therapistSpec.toLowerCase().trim();
  const sName = serviceName.toLowerCase().trim();

  // If raw placeholder or not set
  if (spec.includes('[isi') || spec === '-' || spec === '') return false;

  // General therapist who handles all services
  if (spec.includes('umum') || spec.includes('semua')) return true;

  // 1. Akupuntur
  if (sName.includes('akupuntur') || sName.includes('akupunktur')) {
    return spec.includes('akupuntur') || spec.includes('akupunktur');
  }

  // 2. Bekam
  if (sName.includes('bekam')) {
    return spec.includes('bekam');
  }

  // 3. Ortotik Prostetik
  if (sName.includes('ortotik') || sName.includes('prostetik') || sName.includes('alat bantu')) {
    return spec.includes('ortotik') || spec.includes('prostetik') || spec.includes('op');
  }

  // 4. Okupasi Terapi
  if (sName.includes('okupasi') || sName.includes('okupasional')) {
    return spec.includes('okupasi') || spec.includes('ot');
  }

  // 5. Terapi Wicara
  if (sName.includes('wicara')) {
    return spec.includes('wicara') || spec.includes('tw');
  }

  // 6. Baby Massage / Pijat Bayi
  if (sName.includes('baby') || sName.includes('massage') || sName.includes('pijat')) {
    return spec.includes('baby') || spec.includes('massage') || spec.includes('pijat') || spec.includes('anak') || spec.includes('pediatrik') || spec.includes('tumbuh kembang');
  }

  // 7. Stimulasi Tumbuh Kembang
  if (sName.includes('tumbuh') || sName.includes('kembang')) {
    return spec.includes('tumbuh') || spec.includes('kembang') || spec.includes('pediatrik') || spec.includes('anak');
  }

  // 8. Observasi
  if (sName.includes('observasi') || sName.includes('evaluasi') || sName.includes('asesmen') || sName.includes('konsultasi')) {
    return spec.includes('observasi') || spec.includes('konsultasi') || spec.includes('evaluasi') || spec.includes('fisioterapi');
  }

  // 9. Fisioterapi (and sub-branches like Fisioterapi Anak, Remaja, Dewasa, Neurologi, Olahraga)
  if (sName.includes('fisioterapi') || sName.includes('fisio')) {
    return spec.includes('fisioterapi') || spec.includes('fisio');
  }

  return false;
}

const BOOKING_STEPS = ['Layanan', 'Terapis', 'Waktu', 'Data Pasien', 'Konfirmasi'];

function BookingModal({ open, onClose, apiTherapists, services, clinicInfo }: { open: boolean; onClose: () => void; apiTherapists: ApiTherapist[]; services: LandingService[]; clinicInfo: PublicClinicInfo }) {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Slot yang sudah tidak bisa dipilih: sudah dibooking (online/internal) atau sudah lewat jam (jika hari ini)
  const [disabledSlots, setDisabledSlots] = useState<Set<string>>(new Set());
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const bookableServices = useMemo(() => {
    return services.filter((s) => {
      const cat = (s.category || '').toLowerCase();
      return cat !== 'obat_alat' && cat !== 'obat & alat' && cat !== 'obat dan alat';
    });
  }, [services]);

  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [unavailabilityReason, setUnavailabilityReason] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingData>({
    service: bookableServices[0]?.name ?? services[0]?.name ?? SERVICES[0].name,
    therapist_id: 0,
    therapist_name: '',
    date: '',
    time: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientGender: 'male',
    patientBirthDate: '',
    symptoms: '',
    consent: false,
  });

  const totalSteps = BOOKING_STEPS.length;
  const progressPct = ((step - 1) / (totalSteps - 1)) * 100;

  const update = (fields: Partial<BookingData>) => setBooking(prev => ({ ...prev, ...fields }));

  const selectedService = bookableServices.find((service) => service.name === booking.service)
    ?? bookableServices[0]
    ?? services[0]
    ?? SERVICES[0];
  const selectedOperationalHour = useMemo(
    () => getOperationalHourForDate(clinicInfo, booking.date),
    [clinicInfo, booking.date],
  );
  const availableTimeSlots = useMemo(
    () => getConfiguredBookingSlots(selectedOperationalHour),
    [selectedOperationalHour],
  );
  const allowCustomBookingTime = selectedOperationalHour?.allow_custom_booking_time === true;
  const latestCustomStartTime = useMemo(
    () => getLatestBookingStartTime(selectedOperationalHour, selectedService.duration || 60),
    [selectedOperationalHour, selectedService.duration],
  );

  const prioritizedTherapists = useMemo(() => {
    const list = apiTherapists.map(t => ({
      ...t,
      isRecommended: isTherapistSpecialistForService(t.specialization, booking.service),
    }));

    return list.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return 0;
    });
  }, [apiTherapists, booking.service]);

  useEffect(() => {
    if (bookableServices.length === 0) return;
    setBooking(prev => bookableServices.some(service => service.name === prev.service)
      ? prev
      : { ...prev, service: bookableServices[0].name });
  }, [bookableServices]);

  useEffect(() => {
    if (allowCustomBookingTime || !isCustomTime) return;
    setIsCustomTime(false);
    setBooking(prev => ({ ...prev, time: '' }));
  }, [allowCustomBookingTime, isCustomTime]);

  // Live-fetch ketersediaan slot: setiap kali tanggal atau terapis berubah, dan
  // di-poll berkala selama step 3 (Waktu) terbuka, supaya slot yang baru saja
  // dibooking orang lain / dijadwalkan internal langsung ter-disable tanpa reload.
  useEffect(() => {
    if (step !== 3 || !booking.date || !booking.therapist_id) {
      setDisabledSlots(new Set());
      setBookedRanges([]);
      setCurrentTime(null);
      setUnavailabilityReason(null);
      return;
    }

    let cancelled = false;

    const loadAvailability = async () => {
      setIsLoadingSlots(true);
      try {
        const res = await fetch(
          `${API_URL}/public/booking/availability?therapist_id=${booking.therapist_id}&date=${booking.date}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) return;
        const json = await res.json();

        if (cancelled) return;

        if (json?.data?.is_open === false) {
          const reason = json?.data?.unavailability_reason || 'Terapis atau klinik sedang libur pada tanggal ini.';
          setUnavailabilityReason(reason);
          setDisabledSlots(new Set(availableTimeSlots));
          setBookedRanges([]);
          setBooking(prev => (prev.time ? { ...prev, time: '' } : prev));
          return;
        }

        setUnavailabilityReason(null);
        const nextBookedRanges: BookedRange[] = Array.isArray(json?.data?.booked_ranges)
          ? json.data.booked_ranges
          : [];
        const nextCurrentTime: string | null = typeof json?.data?.current_time === 'string'
          ? json.data.current_time
          : null;

        setBookedRanges(nextBookedRanges);
        setCurrentTime(nextCurrentTime);

        const next = new Set<string>();
        for (const slot of availableTimeSlots) {
          // Disable jika jam sudah terlewat (hanya berlaku untuk tanggal hari ini)
          if (nextCurrentTime && slot <= nextCurrentTime) {
            next.add(slot);
            continue;
          }
          // Disable jika slot ini bentrok dengan appointment yang sudah ada
          // (baik dari booking online maupun jadwal internal — keduanya sama-sama
          // tersimpan sebagai appointment di database, jadi flow-nya identik)
          if (!isBookingTimeWithinOperationalHours(selectedOperationalHour, slot, selectedService.duration || 60)) {
            next.add(slot);
            continue;
          }
          const slotEnd = addMinutes(slot, selectedService.duration || 60);
          const overlaps = nextBookedRanges.some(r => slot < r.end && slotEnd > r.start);
          if (overlaps) next.add(slot);
        }
        setDisabledSlots(next);
        // Slot yang sedang dipilih ternyata baru saja diambil orang lain / dijadwal internal —
        // reset pilihan supaya user tidak lanjut ke jam yang sudah tidak valid
        setBooking(prev => (prev.time && next.has(prev.time) ? { ...prev, time: '' } : prev));
      } catch {
        // Live-fetch gagal (mis. API belum jalan) — jangan block user, biarkan semua slot pilihan aktif.
        // Backend tetap menjadi validator final saat booking dikirim.
        if (!cancelled) {
          setDisabledSlots(new Set());
          setBookedRanges([]);
          setCurrentTime(null);
          setUnavailabilityReason(null);
        }
      } finally {
        if (!cancelled) setIsLoadingSlots(false);
      }
    };

    loadAvailability();
    // Poll tiap 15 detik selagi user berada di step pemilihan waktu — simulasi live-update
    // tanpa perlu infra SSE/websocket terpisah untuk landing page publik ini.
    const interval = setInterval(loadAvailability, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, booking.date, booking.therapist_id, availableTimeSlots, selectedService.duration, selectedOperationalHour]);

  const customTimeValidation = useMemo(() => {
    if (!isCustomTime) return { valid: true, message: '' };
    if (unavailabilityReason) {
      return { valid: false, message: unavailabilityReason };
    }
    if (!allowCustomBookingTime) {
      return { valid: false, message: 'Pilihan jam lain tidak diaktifkan untuk hari ini.' };
    }
    if (!booking.time) {
      return { valid: false, message: 'Pilih jam yang Anda inginkan.' };
    }
    if (!isBookingTimeWithinOperationalHours(selectedOperationalHour, booking.time, selectedService.duration || 60)) {
      return {
        valid: false,
        message: 'Jam harus berada dalam jam operasional dan durasi terapi harus selesai sebelum klinik tutup.',
      };
    }
    if (currentTime && booking.time <= currentTime) {
      return { valid: false, message: 'Jam yang dipilih sudah lewat. Pilih jam setelah waktu sekarang.' };
    }

    const customEnd = addMinutes(booking.time, selectedService.duration || 60);
    const overlaps = bookedRanges.some(range => booking.time < range.end && customEnd > range.start);
    if (overlaps) {
      return { valid: false, message: 'Jam tersebut bentrok dengan jadwal terapis. Silakan pilih jam lain.' };
    }

    return { valid: true, message: 'Jam tersedia secara sementara. Ketersediaan akan divalidasi kembali saat booking dikirim.' };
  }, [
    isCustomTime,
    allowCustomBookingTime,
    booking.time,
    selectedOperationalHour,
    selectedService.duration,
    currentTime,
    bookedRanges,
  ]);

  const handleNext = async () => {
    if (step < totalSteps) { setStep(s => s + 1); return; }
    // Submit ke public booking endpoint
    setIsSubmitting(true);
    try {
      const payload = {
        full_name: booking.patientName,
        phone: booking.patientPhone,
        email: booking.patientEmail || undefined,
        gender: booking.patientGender,
        birth_date: booking.patientBirthDate,
        service_id: selectedService?.id,
        service_name: booking.service,
        therapist_id: booking.therapist_id,
        appointment_date: booking.date,
        time_start: booking.time,
        symptoms: booking.symptoms || undefined,
      };
      const res = await fetch(`${API_URL}/public/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsSuccess(true);
      } else {
        const err = await res.json().catch(() => ({}));
        // Tampilkan pesan error dari API (misal: jadwal bentrok)
        alert(err?.message || 'Booking gagal. Coba lagi atau hubungi klinik.');
      }
    } catch {
      alert('Tidak dapat terhubung ke server booking. Pastikan koneksi tersedia atau hubungi klinik.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setIsSuccess(false);
      setIsCustomTime(false);
      setBookedRanges([]);
      setCurrentTime(null);
      setBooking({
        service: bookableServices[0]?.name ?? services[0]?.name ?? SERVICES[0].name,
        therapist_id: 0,
        therapist_name: '',
        date: '',
        time: '',
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        patientGender: 'male',
        patientBirthDate: '',
        symptoms: '',
        consent: false,
      });
    }, 300);
  };

  const canProceed = () => {
    if (step === 2) return booking.therapist_id > 0;
    if (step === 3) {
      if (!booking.date || !booking.time) return false;
      return isCustomTime
        ? customTimeValidation.valid
        : !disabledSlots.has(booking.time);
    }
    if (step === 4) return !!booking.patientName && !!booking.patientPhone && !!booking.patientBirthDate && booking.consent;
    return true;
  };

  const selectedPrice = getServicePrice(selectedService, booking.patientBirthDate);
  const registrationFee = clinicInfo.registration_fee;
  const registrationFeeAlwaysApplies = registrationFee.enabled
    && registrationFee.applies_to_new_patient
    && registrationFee.applies_to_existing_patient;
  const estimatedTotal = selectedPrice.amount + (registrationFeeAlwaysApplies ? registrationFee.amount : 0);

  const formatDate = (d: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full sm:max-w-2xl bg-[#f8f9ff] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00685f] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                <span className="font-bold text-[#0b1c30]">Booking Online</span>
              </div>
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] transition-colors text-[#6d7a77]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {!isSuccess && (
              <>
                {/* Progress Bar */}
                <div className="px-6 pt-4 pb-2 bg-white">
                  <div className="flex justify-between mb-3">
                    {BOOKING_STEPS.map((label, idx) => {
                      const stepNum = idx + 1;
                      const done = stepNum < step;
                      const active = stepNum === step;
                      return (
                        <div key={label} className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                            ${done ? 'bg-[#e0f4f1] text-[#00685f]' : active ? 'bg-[#00685f] text-white shadow-md shadow-[#00685f]/30' : 'bg-[#f1f5f9] text-[#94a3b8]'}
                          `}>
                            {done ? <span className="material-symbols-outlined text-[16px]">check</span> : stepNum}
                          </div>
                          <span className={`text-[9px] font-medium hidden sm:block ${active ? 'text-[#00685f]' : 'text-[#94a3b8]'}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#00685f] rounded-full"
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-[#e0f4f1] text-[#00685f] flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[#0b1c30]">Booking Berhasil!</h3>
                    <p className="text-[#3d4947] max-w-sm">Tim kami akan segera menghubungi Anda di <strong>{booking.patientPhone}</strong> untuk konfirmasi jadwal.</p>
                    <div className="w-full max-w-sm bg-white rounded-2xl border border-[#e2e8f0] p-5 text-left space-y-3">
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-[#94a3b8] text-[20px]">medical_services</span>
                        <div><p className="text-xs text-[#94a3b8]">Layanan</p><p className="font-semibold text-[#0b1c30] text-sm">{booking.service}</p></div>
                      </div>
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-[#94a3b8] text-[20px]">person</span>
                        <div><p className="text-xs text-[#94a3b8]">Terapis</p><p className="font-semibold text-[#0b1c30] text-sm">{booking.therapist_name}</p></div>
                      </div>
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-[#94a3b8] text-[20px]">calendar_today</span>
                        <div><p className="text-xs text-[#94a3b8]">Jadwal</p><p className="font-semibold text-[#0b1c30] text-sm">{formatDate(booking.date)}, {booking.time} WIB</p></div>
                      </div>
                    </div>
                    <button onClick={handleClose} className="mt-2 px-8 py-3 bg-[#00685f] text-white font-semibold rounded-xl hover:bg-[#008378] transition-colors">
                      Selesai
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                    className="p-6"
                  >
                    {/* Step 1: Service */}
                    {step === 1 && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Pilih Layanan</h3>
                        <p className="text-sm text-[#6d7a77] mb-5">Pilih jenis terapi yang Anda butuhkan.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {bookableServices.map(s => (
                            <button
                              key={s.id}
                              onClick={() => update({ service: s.name })}
                              className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${booking.service === s.name ? 'border-[#00685f] bg-white shadow-md' : 'border-[#e2e8f0] bg-white'}`}
                            >
                              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                                <span className={`material-symbols-outlined text-[22px] ${s.iconColor}`}>{s.icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-[#0b1c30] text-sm">{s.name}</p>
                                  {booking.service === s.name && <span className="material-symbols-outlined text-[#00685f] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                                </div>
                                <p className="text-xs text-[#00685f] font-medium">{formatRupiah(getServiceStartingPrice(s))} · {formatServiceDuration(s.duration)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2: Therapist */}
                    {step === 2 && (
                      <div>
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-[#0b1c30]">Pilih Terapis</h3>
                          <p className="text-xs sm:text-sm text-[#6d7a77] mt-0.5">
                            Spesialis untuk layanan <span className="font-semibold text-[#00685f]">{booking.service}</span> direkomendasikan di urutan teratas. Anda juga tetap bebas memilih terapis lainnya.
                          </p>
                        </div>
                        {apiTherapists.length === 0 ? (
                          <div className="flex flex-col items-center py-10 gap-3 text-[#6d7a77]">
                            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <p className="text-sm">Memuat daftar terapis...</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {prioritizedTherapists.map(t => {
                              const colorPairs = [
                                'bg-[#e0f4f1] text-[#00685f]',
                                'bg-[#dce9ff] text-[#0058be]',
                                'bg-[#dcfce7] text-[#006b2d]',
                                'bg-[#fef3c7] text-[#92400e]',
                              ];
                              const colorIdx = t.id % colorPairs.length;
                              const isSelected = booking.therapist_id === t.id;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => update({ therapist_id: t.id, therapist_name: t.name })}
                                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                                    isSelected
                                      ? 'border-[#00685f] bg-white shadow-md ring-2 ring-[#00685f]/20'
                                      : t.isRecommended
                                        ? 'border-[#00685f]/30 bg-[#f0fdf9]/50 hover:bg-[#f0fdf9]'
                                        : 'border-[#e2e8f0] bg-white'
                                  }`}
                                >
                                  {t.photo_url ? (
                                    <img
                                      src={t.photo_url}
                                      alt={t.name}
                                      className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-[#00685f]/20"
                                    />
                                  ) : (
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${colorPairs[colorIdx]}`}>
                                      {t.initials}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <p className="font-bold text-[#0b1c30] text-sm sm:text-base leading-snug">{t.name}</p>
                                      {t.isRecommended && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-[#dcfce7] text-[#006b2d] border border-[#006b2d]/20 shadow-xs">
                                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                          Rekomendasi Spesialis
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[#00685f] font-medium">{t.specialization}</p>
                                  </div>

                                  {isSelected && (
                                    <span className="material-symbols-outlined text-[#00685f] text-[22px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                                      check_circle
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Date & Time */}
                    {step === 3 && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Pilih Tanggal & Waktu</h3>
                        <p className="text-sm text-[#6d7a77] mb-5">Pilih slot rekomendasi klinik atau gunakan jam digital jika Owner mengizinkan jam lain.</p>
                        <div className="space-y-4">
                          <BookingCalendar
                            selected={booking.date}
                            onSelect={d => {
                              update({ date: d, time: '' });
                              setIsCustomTime(false);
                            }}
                            clinicInfo={clinicInfo}
                          />
                          {booking.date && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                              {unavailabilityReason && (
                                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#fee2e2]/80 border border-[#fca5a5] text-xs font-semibold text-[#991b1b] mb-4">
                                  <span className="material-symbols-outlined text-[20px] text-[#ba1a1a] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    event_busy
                                  </span>
                                  <div>
                                    <p className="font-bold text-sm text-[#7f1d1d]">Tidak Tersedia</p>
                                    <p className="font-normal mt-0.5">{unavailabilityReason}. Silakan pilih tanggal atau terapis lain.</p>
                                  </div>
                                </div>
                              )}

                              {!unavailabilityReason && (
                                <>
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-[#0b1c30]">Slot Tersedia — {formatDate(booking.date)}</p>
                                    {isLoadingSlots && <span className="text-xs text-[#94a3b8]">Memeriksa...</span>}
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {availableTimeSlots.map(t => {
                                      const disabled = disabledSlots.has(t);
                                      return (
                                        <button
                                          key={t}
                                          type="button"
                                          disabled={disabled}
                                          onClick={() => {
                                            if (disabled) return;
                                            setIsCustomTime(false);
                                            update({ time: t });
                                          }}
                                          title={disabled ? 'Terapis tidak tersedia di jam ini' : undefined}
                                          className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${disabled
                                              ? 'border-[#e2e8f0] bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed line-through'
                                              : !isCustomTime && booking.time === t
                                                ? 'border-[#00685f] bg-[#00685f] text-white shadow-md'
                                                : 'border-[#e2e8f0] bg-white text-[#0b1c30] hover:border-[#00685f]/40'
                                            }`}
                                        >
                                          {t}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {!isLoadingSlots && availableTimeSlots.length > 0 && availableTimeSlots.every(t => disabledSlots.has(t)) && (
                                    <p className="text-center text-sm text-[#94a3b8] py-3">
                                      Semua slot rekomendasi sudah penuh.{allowCustomBookingTime ? ' Anda masih dapat mencoba Pilih Jam Lain.' : ' Silakan pilih tanggal lain.'}
                                    </p>
                                  )}
                                  {!isLoadingSlots && availableTimeSlots.length === 0 && (
                                    <p className="text-center text-sm text-[#94a3b8] py-3">
                                      {allowCustomBookingTime
                                        ? 'Tidak ada slot rekomendasi untuk hari ini. Anda dapat menggunakan Pilih Jam Lain.'
                                        : 'Belum ada slot booking yang diatur untuk tanggal ini. Silakan pilih tanggal lain atau hubungi klinik.'}
                                    </p>
                                  )}

                                  {allowCustomBookingTime && (
                                    <div className="mt-5 pt-5 border-t border-[#e2e8f0]">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold text-[#0b1c30]">Tidak menemukan jam yang sesuai?</p>
                                          <p className="text-xs text-[#6d7a77] mt-1">Pilih jam digital selama masih dalam jam operasional klinik.</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsCustomTime(prev => !prev);
                                            update({ time: '' });
                                          }}
                                          className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${isCustomTime
                                              ? 'border-[#00685f] bg-[#e0f4f1] text-[#00685f]'
                                              : 'border-[#d6dfdd] bg-white text-[#0b1c30] hover:border-[#00685f]/50'
                                            }`}
                                        >
                                          {isCustomTime ? 'Gunakan Slot' : 'Pilih Jam Lain'}
                                        </button>
                                      </div>

                                      {isCustomTime && (
                                        <motion.div
                                          initial={{ opacity: 0, y: 8 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="mt-4 rounded-2xl border border-[#d6dfdd] bg-[#f7faf9] p-4"
                                        >
                                          <label className="text-xs font-semibold text-[#3d4947] block mb-2">Jam Pilihan *</label>
                                          <div className="flex items-center gap-3">
                                            <div className="relative flex-1">
                                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#00685f] text-[20px]">schedule</span>
                                              <input
                                                type="time"
                                                step={900}
                                                min={selectedOperationalHour?.open_time?.slice(0, 5) ?? undefined}
                                                max={latestCustomStartTime ?? undefined}
                                                value={booking.time}
                                                disabled={!latestCustomStartTime}
                                                onChange={event => update({ time: event.target.value })}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#bcc9c6] bg-white text-base font-semibold text-[#0b1c30] disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] focus:outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15"
                                              />
                                            </div>
                                            <div className="hidden sm:block text-xs text-[#6d7a77] leading-relaxed min-w-[150px]">
                                              <p>Buka: <strong className="text-[#0b1c30]">{selectedOperationalHour?.open_time?.slice(0, 5) ?? '—'}</strong></p>
                                              <p>Mulai terakhir: <strong className="text-[#0b1c30]">{latestCustomStartTime ?? '—'}</strong></p>
                                            </div>
                                          </div>
                                          <p className={`mt-2.5 text-xs ${booking.time
                                              ? (customTimeValidation.valid ? 'text-[#00685f]' : 'text-[#ba1a1a]')
                                              : 'text-[#6d7a77]'
                                            }`}>
                                            {!latestCustomStartTime
                                              ? 'Durasi layanan tidak muat pada jam operasional hari ini. Silakan pilih tanggal lain.'
                                              : booking.time
                                                ? customTimeValidation.message
                                                : `Pilih jam antara ${selectedOperationalHour?.open_time?.slice(0, 5) ?? 'jam buka'} dan ${latestCustomStartTime}. Interval input 15 menit.`}
                                          </p>
                                        </motion.div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </motion.div>
                          )}
                          {!booking.date && <p className="text-center text-sm text-[#94a3b8] py-4">Pilih tanggal terlebih dahulu untuk melihat slot waktu tersedia.</p>}
                        </div>
                      </div>
                    )}

                    {/* Step 4: Patient Data */}
                    {step === 4 && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Data Pasien</h3>
                        <p className="text-sm text-[#6d7a77] mb-5">Isi data untuk keperluan pencatatan medis.</p>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-[#3d4947] block mb-1.5">Nama Lengkap *</label>
                              <input
                                type="text"
                                placeholder="Nama pasien"
                                value={booking.patientName}
                                onChange={e => update({ patientName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-[#3d4947] block mb-1.5">No. WhatsApp *</label>
                              <input
                                type="tel"
                                placeholder="08xx xxxx xxxx"
                                value={booking.patientPhone}
                                onChange={e => update({ patientPhone: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15 transition-all"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-[#3d4947] block mb-1.5">Tanggal Lahir *</label>
                              <input
                                type="date"
                                value={booking.patientBirthDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={e => update({ patientBirthDate: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0b1c30] focus:outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15 transition-all"
                              />
                              {booking.patientBirthDate && (
                                <p className="text-[11px] text-[#00685f] mt-1.5">
                                  Estimasi sesuai usia: {formatRupiah(selectedPrice.amount)}
                                  {selectedPrice.categoryLabel ? ` · ${selectedPrice.categoryLabel}` : ''}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-[#3d4947] block mb-1.5">Jenis Kelamin *</label>
                              <div className="flex gap-3 h-[46px] items-center">
                                {(['male', 'female'] as const).map(g => (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() => update({ patientGender: g })}
                                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${booking.patientGender === g ? 'border-[#00685f] bg-[#e0f4f1] text-[#00685f]' : 'border-[#e2e8f0] bg-white text-[#6d7a77]'}`}
                                  >
                                    {g === 'male' ? '♂ Laki-laki' : '♀ Perempuan'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#3d4947] block mb-1.5">Email (Opsional)</label>
                            <input
                              type="email"
                              placeholder="email@contoh.com"
                              value={booking.patientEmail}
                              onChange={e => update({ patientEmail: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#3d4947] block mb-1.5">Keluhan / Gejala</label>
                            <textarea
                              rows={3}
                              placeholder="Ceritakan kondisi yang Anda rasakan..."
                              value={booking.symptoms}
                              onChange={e => update({ symptoms: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15 transition-all resize-none"
                            />
                          </div>
                          <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-xl border border-[#e2e8f0]">
                            <input
                              type="checkbox"
                              checked={booking.consent}
                              onChange={e => update({ consent: e.target.checked })}
                              className="mt-0.5 w-4 h-4 rounded text-[#00685f] border-[#bcc9c6] focus:ring-[#00685f]"
                            />
                            <span className="text-xs text-[#3d4947] leading-relaxed">
                              Saya menyetujui <span className="text-[#00685f] font-semibold">Kebijakan Privasi</span> dan syarat layanan klinis Griya Fisioterapi Supra Medika. *
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Review */}
                    {step === 5 && (
                      <div>
                        <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Konfirmasi Booking</h3>
                        <p className="text-sm text-[#6d7a77] mb-5">Periksa detail sebelum mengkonfirmasi.</p>
                        <div className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white shadow-sm">
                          <div className="bg-[#00685f] px-6 py-4">
                            <p className="text-xs text-white/70 uppercase tracking-widest mb-1">Ringkasan Booking</p>
                            <p className="text-xl font-bold text-white">{booking.service}</p>
                          </div>
                          <div className="p-5 space-y-4">
                            {[
                              { icon: 'person', label: 'Terapis', value: booking.therapist_name || '—' },
                              { icon: 'calendar_today', label: 'Tanggal', value: formatDate(booking.date) },
                              { icon: 'schedule', label: 'Waktu', value: `${booking.time} WIB` },
                              { icon: 'badge', label: 'Pasien', value: booking.patientName },
                              { icon: 'call', label: 'WhatsApp', value: booking.patientPhone },
                            ].map(item => (
                              <div key={item.label} className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#94a3b8] text-[20px]">{item.icon}</span>
                                <div>
                                  <p className="text-xs text-[#94a3b8]">{item.label}</p>
                                  <p className="text-sm font-semibold text-[#0b1c30]">{item.value || '—'}</p>
                                </div>
                              </div>
                            ))}
                            <div className="pt-4 border-t border-[#e2e8f0] space-y-2">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-[#6d7a77]">Harga layanan</span>
                                <span className="font-semibold text-[#0b1c30]">{formatRupiah(selectedPrice.amount)}</span>
                              </div>
                              {selectedPrice.categoryLabel && (
                                <p className="text-xs text-[#00685f]">Kategori usia: {selectedPrice.categoryLabel} ({selectedPrice.age} tahun)</p>
                              )}
                              <div className="flex items-start justify-between gap-4 text-sm">
                                <div>
                                  <span className="text-[#6d7a77]">Biaya pendaftaran</span>
                                  {registrationFee.enabled ? (
                                    !registrationFeeAlwaysApplies && (
                                      <p className="text-[11px] text-[#94a3b8]">Dikenakan sesuai pengaturan pasien baru/lama oleh klinik.</p>
                                    )
                                  ) : (
                                    <p className="text-[11px] text-[#94a3b8]">Saat ini tidak dikenakan.</p>
                                  )}
                                </div>
                                <span className="font-semibold text-[#0b1c30]">
                                  {registrationFee.enabled ? formatRupiah(registrationFee.amount) : 'Tidak dikenakan'}
                                </span>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-[#e2e8f0] flex justify-between items-end">
                              <div>
                                <p className="text-xs text-[#94a3b8]">Total Estimasi</p>
                                <p className="text-2xl font-bold text-[#00685f]">{formatRupiah(estimatedTotal)}</p>
                              </div>
                              <span className="px-3 py-1 bg-[#e0f4f1] text-[#00685f] text-xs font-semibold rounded-full">Bayar di Klinik</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-[#94a3b8] text-center mt-4">Tim kami akan menghubungi Anda untuk konfirmasi jadwal dalam 1×24 jam.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            {!isSuccess && (
              <div className="px-6 py-4 bg-white border-t border-[#e2e8f0] flex items-center justify-between gap-4">
                {step > 1 ? (
                  <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#e2e8f0] text-[#3d4947] font-medium text-sm hover:bg-[#f8f9ff] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Kembali
                  </button>
                ) : <div />}
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#00685f] text-white font-semibold rounded-xl hover:bg-[#008378] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#00685f]/20 text-sm"
                >
                  {isSubmitting ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses...</>
                  ) : step === totalSteps ? (
                    <><span className="material-symbols-outlined text-[18px]">check</span> Konfirmasi</>
                  ) : (
                    <>Lanjut <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

function ContactForm({ services }: { services: LandingService[] }) {
  const [toast, setToast] = useState<ToastState>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactFormData>();

  const dismissToast = () => setToast(null);

  const onSubmit = async (data: ContactFormData) => {
    if (data.honeypot) return;
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: data.name, phone: data.phone, email: data.email, service: data.service, message: data.message }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast({ type: 'error', message: err?.message || 'Terjadi kesalahan. Coba lagi atau hubungi via WhatsApp.' });
        return;
      }
      setToast({ type: 'success', message: 'Pesan berhasil dikirim! Kami akan menghubungi Anda segera.' });
      reset();
      setTimeout(dismissToast, 5500);
    } catch {
      setToast({ type: 'error', message: 'Koneksi gagal. Periksa internet Anda dan coba lagi.' });
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm text-[#0b1c30] bg-white outline-none transition-all placeholder:text-[#6d7a77] ${hasError ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20' : 'border-[#bcc9c6] focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15'}`;

  return (
    <>
      <AnimatePresence>{toast && <Toast state={toast} onDismiss={dismissToast} />}</AnimatePresence>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <input type="text" tabIndex={-1} aria-hidden="true" className="hidden" {...register('honeypot')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0b1c30] mb-1.5">Nama Lengkap <span className="text-[#ba1a1a]">*</span></label>
            <input type="text" placeholder="Masukkan nama Anda" className={inputClass(!!errors.name)} {...register('name', { required: 'Nama wajib diisi' })} />
            {errors.name && <p className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0b1c30] mb-1.5">No. WhatsApp <span className="text-[#ba1a1a]">*</span></label>
            <input type="tel" placeholder="08xx xxxx xxxx" className={inputClass(!!errors.phone)} {...register('phone', { required: 'Nomor wajib diisi', pattern: { value: /^[0-9+\-\s]{10,15}$/, message: 'Format tidak valid' } })} />
            {errors.phone && <p className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.phone.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0b1c30] mb-1.5">Email</label>
          <input type="email" placeholder="email@contoh.com (opsional)" className={inputClass(!!errors.email)} {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email tidak valid' } })} />
          {errors.email && <p className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0b1c30] mb-1.5">Layanan <span className="text-[#ba1a1a]">*</span></label>
          <select className={inputClass(!!errors.service)} {...register('service', { required: 'Pilih layanan' })}>
            <option value="">-- Pilih Layanan --</option>
            {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            <option value="Konsultasi Umum">Konsultasi Umum</option>
          </select>
          {errors.service && <p className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.service.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0b1c30] mb-1.5">Pesan / Keluhan <span className="text-[#ba1a1a]">*</span></label>
          <textarea rows={4} placeholder="Ceritakan kondisi atau pertanyaan Anda..." className={`${inputClass(!!errors.message)} resize-none`} {...register('message', { required: 'Pesan wajib diisi', minLength: { value: 10, message: 'Pesan minimal 10 karakter' } })} />
          {errors.message && <p className="text-xs text-[#ba1a1a] mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.message.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#00685f] text-white font-semibold rounded-xl hover:bg-[#008378] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md">
          {isSubmitting ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Mengirim...</> : <><span className="material-symbols-outlined text-[20px]">send</span> Kirim Pesan</>}
        </button>
        <p className="text-xs text-[#6d7a77] text-center">Dengan mengirim form ini, Anda menyetujui kami menghubungi Anda terkait layanan terapi.</p>
      </form>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [apiTherapists, setApiTherapists] = useState<ApiTherapist[]>([]);
  const [apiGallery, setApiGallery] = useState<ApiGalleryImage[]>([]);
  const { clinicInfo, services, isLoading: isLoadingClinicData } = usePublicClinicData();

  const openBooking = useCallback(() => {
    if (clinicInfo.is_operational) setBookingOpen(true);
  }, [clinicInfo.is_operational]);

  // Fetch daftar terapis aktif dari API — dipakai di booking modal step 2
  // dan di section "Tim Ahli Kami" (menggantikan data statis THERAPISTS)
  useEffect(() => {
    fetch(`${API_URL}/public/therapists`, { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data && Array.isArray(json.data)) {
          setApiTherapists(json.data);
        }
      })
      .catch(() => {
        // Kalau API belum tersedia (dev/demo), fallback ke data statis
        setApiTherapists(THERAPISTS.map((t, i) => ({
          id: i + 1,
          name: t.name,
          specialization: t.role,
          initials: t.initials,
        })));
      });
  }, []);

  // Fetch gambar galeri ruangan/fasilitas dari API — section "Fasilitas Klinik"
  useEffect(() => {
    fetch(`${API_URL}/public/gallery`, { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setApiGallery(json.data);
        }
      })
      .catch(() => {
        // Kalau API belum tersedia atau belum ada gambar, fallback ke data statis
      });
  }, []);

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans">

      {/* ── Booking Modal ── */}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} apiTherapists={apiTherapists} services={services} clinicInfo={clinicInfo} />

      {/* ── Holiday Announcement Modal (Pop-up Tengah Layar) ── */}
      <AnimatePresence>
        {clinicInfo?.holiday_dates && clinicInfo.holiday_dates.length > 0 && (
          <HolidayAnnouncementModal holidays={clinicInfo.holiday_dates} />
        )}
      </AnimatePresence>

      {/* ── Navbar ── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 rounded-2xl bg-white/80 backdrop-blur-xl border border-[#bcc9c6]/30 shadow-md">
        <div className="flex justify-between items-center px-6 py-3">
          <a href="#" className="flex items-center" aria-label="Griya Fisioterapi Supra Medika Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image src="/assets/logo.png" alt="Griya Fisioterapi Supra Medika" width={140} height={36} priority className="h-9 w-auto object-contain" />
          </a>
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {[['Layanan', '#layanan'], ['Fasilitas', '#fasilitas'], ['Terapis', '#terapis'], ['Tentang', '#tentang'], ['Kontak', '#kontak']].map(([label, href]) => (
              <a key={label} href={href} className="text-sm text-[#3d4947] hover:text-[#00685f] font-medium transition-colors">{label}</a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="text-sm bg-[#00685f] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#008378] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              {clinicInfo.is_operational ? 'Booking Online' : 'Klinik Libur'}
            </button>
          </div>
          <button className="md:hidden p-2 text-[#3d4947]" onClick={() => setMenuOpen(true)} aria-label="Buka menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onBooking={openBooking} bookingDisabled={!clinicInfo.is_operational} />

      <main className="pt-28">
        {!clinicInfo.is_operational && (
          <section className="max-w-7xl mx-auto px-4 md:px-10 mb-6" aria-live="polite">
            <div className="rounded-2xl border border-[#f2c94c]/50 bg-[#fff8df] px-5 py-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#9a6700] mt-0.5">event_busy</span>
              <div>
                <p className="font-bold text-[#6b4f00]">Klinik sedang libur / tidak beroperasi</p>
                <p className="text-sm text-[#7a6530] mt-1">{clinicInfo.maintenance_message || 'Booking online sementara dinonaktifkan. Silakan cek kembali saat klinik sudah beroperasi.'}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-10 mb-20" aria-labelledby="hero-heading">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT COLUMN */}
            <motion.div
              className="space-y-7"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1] as const,
              }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#dce9ff] border border-[#bcc9c6]/30 text-[#0058be] text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Platform Kesehatan Premium
              </div>

              <h1 id="hero-heading" className="text-[42px] md:text-[52px] font-bold leading-tight tracking-tight">
                Tumbuh Kembang Optimal,{' '}
                <span className="text-[#00685f] relative inline-block">
                  Pemulihan
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#6bd8cb]/50" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </span>{' '}
                Maksimal.
              </h1>

              {/* Hero Image — mobile only, between heading and paragraph */}
              <div className="relative lg:hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#e0f4f1] to-[#dce9ff] rounded-[40px] rotate-3 scale-105 -z-10" />
                <div className="relative rounded-[24px] overflow-hidden shadow-2xl border border-[#bcc9c6]/30 aspect-[4/3]">
                  <Image
                    src="/assets/agus-supramono-hero.png"
                    alt="dr. Agus Supramono bersama tim Griya Fisioterapi Supra Medika"
                    fill
                    sizes="100vw"
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="absolute top-4 left-2 bg-white p-3 rounded-xl border border-[#bcc9c6]/30 shadow-xl flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#e0f4f1] text-[#00685f] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#6d7a77] uppercase tracking-wide">Tingkat Pemulihan</p>
                    <p className="text-base font-bold text-[#0b1c30]">94.2%</p>
                  </div>
                </div>
                <div className="absolute bottom-4 right-2 bg-white p-2.5 rounded-xl border border-[#bcc9c6]/30 shadow-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00685f] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                  <p className="text-xs font-semibold text-[#0b1c30]">Sesi Berikutnya Siap</p>
                </div>
              </div>

              <p className="text-lg text-[#3d4947] max-w-xl leading-relaxed">
                Selamat datang di Griya Fisioterapi Supra Medika — pusat keterapian fisik terpercaya di Sukoharjo. Kami mendampingi tumbuh kembang si kecil sejak usia 0 bulan hingga 5 tahun, serta menemani proses pemulihan dewasa dengan penanganan profesional, hangat, dan penuh perhatian pada setiap langkah terapi Anda.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="flex items-center justify-center gap-2 px-8 py-4 bg-[#00685f] text-white font-semibold rounded-xl shadow-md hover:bg-[#008378] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
                  Booking Online
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
                <a href="#layanan" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#00685f] border border-[#bcc9c6] font-semibold rounded-xl shadow-sm hover:bg-[#f8f9ff] transition-all">
                  Lihat Layanan
                </a>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-[#bcc9c6]/30">
                <div className="flex -space-x-3">
                  {THERAPISTS.slice(0, 3).map((t) => (
                    <div key={t.name} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${t.color}`}>
                      {t.initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#3d4947]">Didukung <span className="font-semibold text-[#0b1c30]">{THERAPISTS.length}+</span> tenaga profesional</p>
              </div>
            </motion.div>

            {/* RIGHT COLUMN — Hero Image (desktop only, mobile version is above) */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#e0f4f1] to-[#dce9ff] rounded-[40px] rotate-3 scale-105 -z-10" />
              <div className="relative rounded-[24px] overflow-hidden shadow-2xl border border-[#bcc9c6]/30 aspect-[4/3]">
                <Image
                  src="/assets/agus-supramono-hero.png"
                  alt="dr. Agus Supramono bersama tim Griya Fisioterapi Supra Medika"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="absolute top-4 left-2 md:top-6 md:-left-6 bg-white p-3 md:p-4 rounded-xl border border-[#bcc9c6]/30 shadow-xl flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#e0f4f1] text-[#00685f] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px] md:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] text-[#6d7a77] uppercase tracking-wide">Tingkat Pemulihan</p>
                  <p className="text-base md:text-xl font-bold text-[#0b1c30]">94.2%</p>
                </div>
              </div>
              <div className="absolute bottom-4 right-2 md:bottom-6 md:-right-6 bg-white p-2.5 md:p-3.5 rounded-xl border border-[#bcc9c6]/30 shadow-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00685f] text-[18px] md:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                <p className="text-xs md:text-sm font-semibold text-[#0b1c30]">Sesi Berikutnya Siap</p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── Stats ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-10 mb-20" aria-label="Statistik klinik">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {STATS.map(stat => (
              <motion.div key={stat.label} variants={fadeInUp} className="bg-white p-6 rounded-2xl border border-[#bcc9c6]/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-4`}>
                  <span className={`material-symbols-outlined text-[22px] ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold text-[#0b1c30]">{stat.value}</p>
                <p className="text-sm text-[#6d7a77] mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Services ── */}
        <section id="layanan" className="bg-[#eff4ff] py-20" aria-labelledby="services-heading">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="text-center mb-12">
              <h2 id="services-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] mb-4">Layanan Utama Kami</h2>
              <p className="text-lg text-[#3d4947] max-w-2xl mx-auto">{isLoadingClinicData ? 'Memuat layanan klinik...' : 'Program terapi komprehensif yang disesuaikan dengan kebutuhan spesifik Anda dan keluarga.'}</p>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {services.map(service => (
                <motion.article key={service.id} variants={fadeInUp} className="bg-white p-8 rounded-2xl border border-[#bcc9c6]/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex flex-col">
                  <div className={`w-14 h-14 rounded-2xl ${service.bg} flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined text-[28px] ${service.iconColor}`}>{service.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0b1c30] mb-2">{service.name}</h3>
                  <p className="text-sm text-[#3d4947] leading-relaxed flex-grow">{service.desc}</p>
                  <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#6d7a77]">Mulai dari</p>
                      <p className="font-bold text-[#00685f]">{formatRupiah(getServiceStartingPrice(service))}</p>
                    </div>
                    <span className="text-xs text-[#6d7a77] bg-[#f1f5f9] px-2 py-1 rounded-full">{formatServiceDuration(service.duration)}</span>
                  </div>
                  <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="text-[#00685f] text-sm font-semibold flex items-center gap-1 mt-4 hover:gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    Booking Sekarang <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Facility Gallery ── */}
        <section id="fasilitas" className="py-20 max-w-7xl mx-auto px-4 md:px-10" aria-labelledby="gallery-heading">
          <div className="text-center mb-12">
            <h2 id="gallery-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] mb-4">Fasilitas Klinik</h2>
            <p className="text-lg text-[#3d4947] max-w-2xl mx-auto">Lingkungan terapeutik yang modern, bersih, dan dirancang untuk kenyamanan pemulihan Anda.</p>
          </div>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {(apiGallery.length > 0
              ? apiGallery.map(g => ({ src: g.url, alt: g.title, label: g.title }))
              : GALLERY_IMAGES
            ).map((img, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className={`relative rounded-2xl overflow-hidden group shadow-sm ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                style={{ aspectRatio: i === 0 ? '16/9' : '4/3' }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  loading="lazy"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-white font-semibold text-sm">{img.label}</span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-[#0b1c30] text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{img.label}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── About ── */}
        <section id="tentang" className="bg-[#eff4ff] py-20" aria-labelledby="about-heading">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                className="relative order-2 lg:order-1"
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="rounded-[32px] overflow-hidden shadow-2xl aspect-[4/3]">
                  <Image
                    src="/assets/tampak-depan.jpeg"
                    alt="Tampak depan klinik Griya Fisioterapi Supra Medika"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-[#00685f] p-8 rounded-2xl text-white shadow-xl hidden md:block">
                  <p className="text-5xl font-bold leading-none">10+</p>
                  <p className="text-xs uppercase tracking-widest mt-2">Tahun Pengalaman</p>
                </div>
              </motion.div>

              <motion.div
                className="space-y-6 order-1 lg:order-2"
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 id="about-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30]">Salah Satu Pusat Keterapian Fisik di Kabupaten Sukoharjo.</h2>
                <p className="text-lg text-[#3d4947] leading-relaxed">
                  Griya Fisioterapi Supra Medika merupakan salah satu pusat layanan keterapian fisik di Kabupaten Sukoharjo dengan layanan unggulan stimulasi tumbuh kembang dan massage bayi mulai usia 0 bulan sampai 5 tahun. Kami juga melayani pasien dewasa dengan keluhan nyeri, gangguan gerak, kelemahan otot, dan kekakuan persendian, termasuk kasus rehabilitasi pasca stroke serta pasca operasi patah tulang atau nyeri punggung.
                </p>
                <p className="text-lg text-[#3d4947] leading-relaxed">
                  Selain fisioterapi dewasa dan tumbuh kembang anak, kami juga melayani terapi wicara, okupasi terapi, akupuntur, dan bekam. Kami turut didukung tim ortotik prostetik untuk memfasilitasi kebutuhan alat bantu seperti tangan/kaki palsu, sepatu koreksi, korset tulang belakang, dan decker lutut.
                </p>
                <ul className="space-y-4">
                  {['Layanan Anak & Dewasa Lengkap', 'Tim Ortotik Prostetik Tersedia', 'Program Terapi Terukur', 'Ruang Terapi Nyaman'].map(item => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#00685f]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-medium text-[#0b1c30]">{item}</span>
                    </li>
                  ))}
                </ul>
                <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="inline-flex items-center gap-2 px-6 py-3 bg-[#e0f4f1] text-[#00685f] font-semibold rounded-xl hover:bg-[#c8ece8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Konsultasi Sekarang <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Owner Message ── */}
        <OwnerMessageSection />

        {/* ── Therapists ── */}
        <section id="terapis" className="py-20 max-w-7xl mx-auto px-4 md:px-10" aria-labelledby="therapists-heading">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 id="therapists-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] mb-4">Tim Ahli Kami</h2>
              <p className="text-lg text-[#3d4947] max-w-xl">Tenaga medis profesional berdedikasi tinggi untuk kesehatan Anda.</p>
            </div>
            <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="text-[#00685f] font-semibold flex items-center gap-2 hover:gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap">
              Jadwalkan Sesi <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {(apiTherapists.length > 0 ? apiTherapists : THERAPISTS.map((t, i) => ({
              id: i + 1,
              name: t.name,
              specialization: t.role,
              initials: t.initials,
              photo_url: null as string | null,
            }))).map(t => (
              <motion.article key={t.id} variants={fadeInUp} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-300 border border-[#bcc9c6]/20 flex flex-col items-center text-center">
                {/* Top image — foto terapis, rasio 3:4 (data asli 3024x4032) */}
                <div className="relative w-full aspect-[3/4] bg-[#eff4ff]">
                  {t.photo_url ? (
                    <Image
                      src={t.photo_url}
                      alt={t.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      loading="lazy"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#00685f] bg-[#e0f4f1]">
                      {t.initials}
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col items-center w-full">
                  <h3 className="font-bold text-[#0b1c30] text-sm leading-snug">{t.name}</h3>
                  <p className="text-[#00685f] text-xs font-semibold uppercase tracking-wide mt-1">{t.specialization}</p>
                  <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="mt-4 w-full py-2 border border-[#00685f] text-[#00685f] text-sm font-semibold rounded-xl hover:bg-[#e0f4f1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Booking
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* ── Testimonials ── */}
        <section className="bg-[#eff4ff] py-20" aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="text-center mb-12">
              <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] mb-4">Apa Kata Mereka?</h2>
              <p className="text-lg text-[#3d4947]">Kepuasan pasien adalah prioritas utama kami.</p>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {TESTIMONIALS.map(t => (
                <motion.blockquote key={t.name} variants={fadeInUp} className="bg-white p-8 rounded-2xl border border-[#bcc9c6]/30 shadow-sm flex flex-col">
                  <div className="flex gap-1 text-amber-400 mb-4" aria-label="Rating: 5 bintang">
                    {Array.from({ length: 5 }).map((_, i) => <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                  </div>
                  <p className="text-[#0b1c30] italic leading-relaxed flex-grow">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e0f4f1] text-[#00685f] flex items-center justify-center text-sm font-bold">{t.name.charAt(0)}</div>
                    <div>
                      <cite className="font-bold text-[#0b1c30] not-italic">{t.name}</cite>
                      <p className="text-xs text-[#6d7a77]">{t.role}</p>
                    </div>
                  </footer>
                </motion.blockquote>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Process ── */}
        <section className="py-20 max-w-7xl mx-auto px-4 md:px-10" aria-labelledby="process-heading">
          <div className="text-center mb-16">
            <h2 id="process-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] mb-4">Langkah Menuju Pemulihan</h2>
            <p className="text-lg text-[#3d4947]">Proses terapi yang terstruktur untuk hasil maksimal.</p>
          </div>
          <div className="relative">
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-[#00685f]/10 hidden lg:block" />
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-6 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {PROCESS_STEPS.map(step => (
                <motion.div key={step.step} variants={fadeInUp} className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#e2e8f0] shadow-sm flex items-center justify-center relative z-10 hover:border-[#00685f] hover:shadow-md transition-all group">
                    <span className="material-symbols-outlined text-[#00685f] text-[28px] group-hover:scale-110 transition-transform">{step.icon}</span>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#00685f] text-white flex items-center justify-center text-xs font-bold shadow-md">{step.step}</div>
                  </div>
                  <h3 className="font-bold text-[#0b1c30] text-sm">{step.label}</h3>
                  <p className="text-xs text-[#6d7a77]">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-[#eff4ff] py-20" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-4 md:px-10">
            <div className="text-center mb-12">
              <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] mb-4">Pertanyaan Umum</h2>
              <p className="text-lg text-[#3d4947]">Hal-hal yang perlu Anda ketahui tentang layanan kami.</p>
            </div>
            <div className="space-y-3">
              {FAQ.map((item, idx) => (
                <div key={idx} className="bg-white border border-[#bcc9c6]/30 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex justify-between items-center p-6 text-left" aria-expanded={openFaq === idx}>
                    <span className="font-semibold text-[#0b1c30]">{item.q}</span>
                    <span className={`material-symbols-outlined text-[#6d7a77] transition-transform flex-shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-6 text-sm text-[#3d4947] leading-relaxed border-t border-[#bcc9c6]/20 pt-4">{item.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-10 py-20">
          <motion.div
            className="relative overflow-hidden rounded-[32px] bg-[#00685f]"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=70&fit=crop"
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              loading="lazy"
              className="object-cover opacity-20 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_transparent_70%)]" />
            <div className="relative z-10 text-center py-16 px-8 space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white max-w-2xl mx-auto">
                Mulai Perjalanan Pemulihan Anda Hari Ini Bersama Griya Fisioterapi Supra Medika.
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="px-10 py-4 bg-white text-[#00685f] font-bold rounded-xl shadow-lg hover:bg-[#f8f9ff] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95">
                  {clinicInfo.is_operational ? 'Booking Online Sekarang' : 'Booking Sedang Ditutup'}
                </button>
                <a href="tel:+622155550123" className="px-10 py-4 border border-white/40 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                  Hubungi Kami
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Contact + Form ── */}
        <section id="kontak" className="bg-[#eff4ff] py-20" aria-labelledby="contact-heading">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="text-center mb-12">
              <h2 id="contact-heading" className="text-3xl md:text-4xl font-bold text-[#0b1c30] mb-4">Hubungi & Booking</h2>
              <p className="text-lg text-[#3d4947]">Isi form di bawah atau hubungi kami langsung.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-[#0b1c30] mb-6">Informasi Klinik</h3>
                  <div className="space-y-4">
                    {[
                      { icon: 'location_on', label: 'Pandowo, Joho, Kec. Sukoharjo, Kabupaten Sukoharjo, Jawa Tengah 57513' },
                      { icon: 'call', label: '0877-3633-9217' },
                      { icon: 'mail', label: 'griyafisioterapisupramedika@gmail.com' },
                    ].map(({ icon, label }) => (
                      <div key={icon} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#e0f4f1] text-[#00685f] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        </div>
                        <span className="text-[#3d4947] pt-2">{label}</span>
                      </div>
                    ))}
                    <OperationalHoursList clinicInfo={clinicInfo} />
                  </div>
                </div>

                {/* Clinic Image */}
                <div className="rounded-2xl overflow-hidden shadow-md aspect-[16/9] relative">
                  <Image
                    src="/assets/ruang-pendaftaran.jpeg"
                    alt="Area penerimaan pasien klinik Griya Fisioterapi Supra Medika yang ramah"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>

                <div className="bg-[#00685f] rounded-2xl p-6 text-white">
                  <h4 className="font-bold text-lg mb-2">Butuh Respons Cepat?</h4>
                  <p className="text-white/80 text-sm mb-4">Hubungi kami via WhatsApp untuk jadwal & pertanyaan darurat.</p>
                  <a href="https://wa.me/6287736339217" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#00685f] font-semibold rounded-xl hover:bg-[#f0fdf9] transition-colors text-sm">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    Chat WhatsApp
                  </a>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-[#bcc9c6]/30 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#0b1c30]">Kirim Pesan / Booking</h3>
                </div>
                <div className="mb-4 p-3 bg-[#e0f4f1] rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#00685f]" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                  <p className="text-xs text-[#00685f] font-medium">Ingin booking langsung?{' '}
                    <button disabled={!clinicInfo.is_operational} onClick={openBooking} className="underline font-bold hover:no-underline disabled:no-underline disabled:opacity-50 disabled:cursor-not-allowed">{clinicInfo.is_operational ? 'Gunakan sistem booking online kami' : 'Booking sedang ditutup'}</button>
                  </p>
                </div>
                <ContactForm services={services} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#213145] text-white rounded-t-[32px] pt-16 pb-10" aria-label="Footer">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2 space-y-5">
              <div className="flex items-center bg-white inline-flex rounded-lg px-3 py-2 w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Image src="/assets/logo.png" alt="Griya Fisioterapi Supra Medika" width={140} height={36} className="h-9 w-auto object-contain" />
              </div>
              <p className="text-[#94a3b8] max-w-sm leading-relaxed text-sm">
                Memberikan standar baru dalam perawatan rehabilitasi dengan teknologi modern dan kepedulian tulus untuk kualitas hidup yang lebih baik.
              </p>
            </div>
            <div>
              <h6 className="font-bold text-white mb-5 text-sm uppercase tracking-wide">Layanan</h6>
              <ul className="space-y-3">
                {services.slice(0, 4).map(s => (
                  <li key={s.id}><a href="#layanan" className="text-[#94a3b8] hover:text-white text-sm transition-colors">{s.name}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="font-bold text-white mb-5 text-sm uppercase tracking-wide">Kontak</h6>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-[#94a3b8] text-sm"><span className="material-symbols-outlined text-[16px] text-[#6bd8cb] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>Pandowo, Joho, Kec. Sukoharjo, Kabupaten Sukoharjo, Jawa Tengah 57513</li>
                <li className="flex items-center gap-2 text-[#94a3b8] text-sm"><span className="material-symbols-outlined text-[16px] text-[#6bd8cb]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>0877-3633-9217</li>
                <li className="flex items-center gap-2 text-[#94a3b8] text-sm"><span className="material-symbols-outlined text-[16px] text-[#6bd8cb]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>griyafisioterapisupramedika@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#64748b] text-sm">© {new Date().getFullYear()} Griya Fisioterapi Supra Medika. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}
