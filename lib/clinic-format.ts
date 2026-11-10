import type { LandingService } from '@/lib/landing-data';
import type { PublicClinicInfo, PublicOperationalHour } from '@/types/public-clinic';

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatServiceDuration(minutes: number): string {
  if (minutes <= 0) return 'Sesuai Kondisi';
  return `${minutes} Menit`;
}

export function calculateAge(birthDate: string, referenceDate = new Date()): number | null {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > referenceDate) return null;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDifference = referenceDate.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && referenceDate.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

export function getServicePrice(service: LandingService, birthDate?: string): {
  amount: number;
  age: number | null;
  categoryLabel: string | null;
} {
  const age = birthDate ? calculateAge(birthDate) : null;

  if (age !== null) {
    const matched = service.age_prices.find((rule) => {
      const withinMin = age >= rule.min_age;
      const withinMax = rule.max_age === null || age <= rule.max_age;
      return withinMin && withinMax;
    });

    if (matched) {
      return { amount: matched.price, age, categoryLabel: matched.category_name };
    }
  }

  return { amount: service.price, age, categoryLabel: null };
}

export function getServiceStartingPrice(service: LandingService): number {
  const candidates = [service.price, ...service.age_prices.map((rule) => rule.price)];
  const validCandidates = candidates.filter((value) => Number.isFinite(value) && value >= 0);
  return validCandidates.length > 0 ? Math.min(...validCandidates) : 0;
}

export function formatClock(value: string | null): string {
  return value ? value.slice(0, 5).replace(':', '.') : '';
}

export function getOperationalHours(info: PublicClinicInfo): PublicOperationalHour[] {
  return Array.isArray(info?.operational_hours) ? info.operational_hours : [];
}

export function getOperationalHourForDate(
  info: PublicClinicInfo,
  date: string,
): PublicOperationalHour | null {
  if (!date) return null;

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  return getOperationalHours(info).find((item) => item.day === keys[parsed.getDay()]) ?? null;
}

export function isValidClock(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function clockToMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

/**
 * Mengembalikan slot booking persis seperti yang diatur Owner.
 * Tidak ada generate interval 60 menit di landing.
 */

function minutesToClock(value: number): string {
  const normalized = Math.max(0, Math.min((24 * 60) - 1, value));
  const hour = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minute = String(normalized % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function getLatestBookingStartTime(
  hour: PublicOperationalHour | null,
  durationMinutes: number,
): string | null {
  if (
    !hour?.is_open
    || !hour.open_time
    || !hour.close_time
    || !isValidClock(hour.open_time.slice(0, 5))
    || !isValidClock(hour.close_time.slice(0, 5))
  ) {
    return null;
  }

  const duration = Math.max(1, durationMinutes || 1);
  const open = clockToMinutes(hour.open_time.slice(0, 5));
  const latestStart = clockToMinutes(hour.close_time.slice(0, 5)) - duration;
  return latestStart >= open ? minutesToClock(latestStart) : null;
}

export function isBookingTimeWithinOperationalHours(
  hour: PublicOperationalHour | null,
  time: string,
  durationMinutes: number,
): boolean {
  if (
    !hour?.is_open
    || !hour.open_time
    || !hour.close_time
    || !isValidClock(time)
    || !isValidClock(hour.open_time.slice(0, 5))
    || !isValidClock(hour.close_time.slice(0, 5))
  ) {
    return false;
  }

  const start = clockToMinutes(time);
  const open = clockToMinutes(hour.open_time.slice(0, 5));
  const close = clockToMinutes(hour.close_time.slice(0, 5));
  const duration = Math.max(1, durationMinutes || 1);

  return start >= open && start + duration <= close;
}

export function getConfiguredBookingSlots(hour: PublicOperationalHour | null): string[] {
  if (!hour?.is_open || !hour.open_time || !hour.close_time) return [];

  const slots = Array.isArray(hour.booking_slots) ? hour.booking_slots : [];
  const openMinute = clockToMinutes(hour.open_time.slice(0, 5));
  const closeMinute = clockToMinutes(hour.close_time.slice(0, 5));

  return [...new Set(slots)]
    .filter(isValidClock)
    .filter((slot) => {
      const minute = clockToMinutes(slot);
      return minute >= openMinute && minute < closeMinute;
    })
    .sort((a, b) => clockToMinutes(a) - clockToMinutes(b));
}
