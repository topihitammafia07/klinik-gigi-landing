export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface PublicOperationalHour {
  day: Weekday;
  label: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  /**
   * Slot booking yang dikonfigurasi Owner untuk hari ini.
   * Contoh: ['09:00', '11:00', '13:30', '16:00'].
   * Landing TIDAK membuat slot otomatis per 60 menit.
   */
  booking_slots: string[];
  /**
   * Jika true, pasien boleh memilih jam digital di luar slot rekomendasi Owner.
   * Jam custom tetap harus berada di jam operasional dan lolos validasi ketersediaan.
   */
  allow_custom_booking_time: boolean;
}

export interface PublicRegistrationFee {
  enabled: boolean;
  amount: number;
  new_patient_amount?: number;
  existing_patient_amount?: number;
  applies_to_new_patient: boolean;
  applies_to_existing_patient: boolean;
}

export interface PublicClinicHoliday {
  date: string;
  name: string;
}

export interface PublicClinicInfo {
  is_operational: boolean;
  maintenance_message: string | null;
  operational_hours: PublicOperationalHour[];
  holiday_dates?: PublicClinicHoliday[];
  registration_fee: PublicRegistrationFee;
}

export interface PublicServiceAgePrice {
  id?: number;
  category_name: string;
  min_age: number;
  max_age: number | null;
  price: number;
}

export interface PublicTherapyService {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
  is_flexible?: boolean;
  age_prices: PublicServiceAgePrice[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
