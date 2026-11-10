import type { PublicClinicInfo, PublicTherapyService, Weekday } from '@/types/public-clinic';

export interface ServicePresentation {
  icon: string;
  desc: string;
  bg: string;
  iconColor: string;
}

export interface LandingService extends PublicTherapyService, ServicePresentation {}

const SERVICE_PRESENTATION: Record<string, ServicePresentation> = {
  fisioterapi: {
    icon: 'physical_therapy',
    desc: 'Penanganan nyeri, gangguan gerak, kelemahan otot, kekakuan sendi, hingga rehabilitasi pasca stroke dan pasca operasi.',
    bg: 'bg-[#e0f4f1]',
    iconColor: 'text-[#00685f]',
  },
  'stimulasi tumbuh kembang': {
    icon: 'child_care',
    desc: 'Stimulasi tumbuh kembang untuk bayi dan anak usia 0 bulan sampai 5 tahun guna mengoptimalkan motorik dan kognitif.',
    bg: 'bg-[#dce9ff]',
    iconColor: 'text-[#0058be]',
  },
  'baby massage': {
    icon: 'baby_changing_station',
    desc: 'Pijat bayi terapeutik usia 0 bulan sampai 5 tahun untuk kualitas tidur, pencernaan, dan ikatan dengan orang tua.',
    bg: 'bg-[#dcfce7]',
    iconColor: 'text-[#006b2d]',
  },
  'okupasi terapi': {
    icon: 'accessibility_new',
    desc: 'Membantu pasien menguasai keterampilan aktivitas sehari-hari untuk kemandirian maksimal.',
    bg: 'bg-[#fef3c7]',
    iconColor: 'text-[#92400e]',
  },
  'terapi wicara': {
    icon: 'record_voice_over',
    desc: 'Penanganan gangguan komunikasi, bahasa, bicara, dan kesulitan menelan pada anak maupun dewasa.',
    bg: 'bg-[#e0f2fe]',
    iconColor: 'text-[#0369a1]',
  },
  akupuntur: {
    icon: 'self_improvement',
    desc: 'Terapi akupuntur untuk membantu meredakan nyeri dan meningkatkan fungsi tubuh secara alami.',
    bg: 'bg-[#ede9fe]',
    iconColor: 'text-[#5b21b6]',
  },
  bekam: {
    icon: 'spa',
    desc: 'Terapi bekam untuk membantu melancarkan peredaran darah dan meredakan pegal serta nyeri otot.',
    bg: 'bg-[#ffe4e6]',
    iconColor: 'text-[#be123c]',
  },
  'ortotik prostetik': {
    icon: 'airline_seat_legroom_extra',
    desc: 'Pembuatan alat bantu seperti tangan/kaki palsu, sepatu koreksi, korset tulang belakang, dan decker lutut.',
    bg: 'bg-[#fce7f3]',
    iconColor: 'text-[#9d174d]',
  },
  'fisioterapi anak': {
    icon: 'child_care',
    desc: 'Fisioterapi pediatrik untuk bayi dan anak guna mengoptimalkan kemampuan gerak, motorik kasar, dan tumbuh kembang.',
    bg: 'bg-[#dce9ff]',
    iconColor: 'text-[#0058be]',
  },
  'fisioterapi remaja': {
    icon: 'directions_run',
    desc: 'Fisioterapi untuk remaja dan usia sekolah guna penanganan cedera olahraga, postur, serta keluhan gerak.',
    bg: 'bg-[#dcfce7]',
    iconColor: 'text-[#006b2d]',
  },
  'fisioterapi dewasa': {
    icon: 'accessibility',
    desc: 'Rehabilitasi dan fisioterapi untuk dewasa pasca cedera, stroke, nyeri punggung, atau keterbatasan gerak.',
    bg: 'bg-[#e0f4f1]',
    iconColor: 'text-[#00685f]',
  },
  ot: {
    icon: 'accessibility_new',
    desc: 'Okupasi Terapi (OT) untuk melatih kemandirian motorik halus, sensorik, dan aktivitas keseharian.',
    bg: 'bg-[#fef3c7]',
    iconColor: 'text-[#92400e]',
  },
  tw: {
    icon: 'record_voice_over',
    desc: 'Terapi Wicara (TW) untuk penanganan gangguan bahasa, komunikasi, artikulasi, dan kesulitan menelan.',
    bg: 'bg-[#e0f2fe]',
    iconColor: 'text-[#0369a1]',
  },
  observasi: {
    icon: 'visibility',
    desc: 'Pemeriksaan awal dan observasi komprehensif tumbuh kembang atau kondisi fisik sebelum program terapi.',
    bg: 'bg-[#ede9fe]',
    iconColor: 'text-[#5b21b6]',
  },
  'konsultasi & evaluasi perkembangan': {
    icon: 'visibility',
    desc: 'Pemeriksaan awal dan observasi komprehensif tumbuh kembang atau kondisi fisik sebelum program terapi.',
    bg: 'bg-[#ede9fe]',
    iconColor: 'text-[#5b21b6]',
  },
  'observasi & konsultasi': {
    icon: 'visibility',
    desc: 'Pemeriksaan awal dan observasi komprehensif tumbuh kembang atau kondisi fisik sebelum program terapi.',
    bg: 'bg-[#ede9fe]',
    iconColor: 'text-[#5b21b6]',
  },
  'observasi & konsultasi perkembangan': {
    icon: 'visibility',
    desc: 'Pemeriksaan awal dan observasi komprehensif tumbuh kembang atau kondisi fisik sebelum program terapi.',
    bg: 'bg-[#ede9fe]',
    iconColor: 'text-[#5b21b6]',
  },
  'obat & alat': {
    icon: 'medication',
    desc: 'Penyediaan obat resep dan perlengkapan penunjang rehabilitasi medik serta terapi fisik.',
    bg: 'bg-[#fce7f3]',
    iconColor: 'text-[#be123c]',
  },
  'obat dan alat': {
    icon: 'medication',
    desc: 'Penyediaan obat resep dan perlengkapan penunjang rehabilitasi medik serta terapi fisik.',
    bg: 'bg-[#fce7f3]',
    iconColor: 'text-[#be123c]',
  },
};

const DEFAULT_PRESENTATION: ServicePresentation = {
  icon: 'medical_services',
  desc: 'Layanan terapi profesional yang disesuaikan dengan kebutuhan dan kondisi pasien.',
  bg: 'bg-[#e0f4f1]',
  iconColor: 'text-[#00685f]',
};

export const FALLBACK_SERVICES: LandingService[] = [
  { id: 1, name: 'Fisioterapi', category: 'Fisioterapi', duration: 60, price: 55000, age_prices: [], ...SERVICE_PRESENTATION.fisioterapi },
  { id: 4, name: 'Okupasi Terapi', category: 'Okupasi Terapi', duration: 45, price: 85000, age_prices: [], ...SERVICE_PRESENTATION['okupasi terapi'] },
  { id: 5, name: 'Terapi Wicara', category: 'Terapi Wicara', duration: 45, price: 85000, age_prices: [], ...SERVICE_PRESENTATION['terapi wicara'] },
  { id: 2, name: 'Stimulasi Tumbuh Kembang', category: 'Tumbuh Kembang', duration: 40, price: 20000, age_prices: [], ...SERVICE_PRESENTATION['stimulasi tumbuh kembang'] },
  { id: 3, name: 'Baby Massage', category: 'Tumbuh Kembang', duration: 40, price: 35000, age_prices: [], ...SERVICE_PRESENTATION['baby massage'] },
  { id: 8, name: 'Ortotik Prostetik', category: 'Ortotik Prostetik', duration: 60, price: 300000, age_prices: [], ...SERVICE_PRESENTATION['ortotik prostetik'] },
  { id: 16, name: 'Observasi', category: 'observasi', duration: 45, price: 100000, age_prices: [], ...SERVICE_PRESENTATION.observasi },
  { id: 6, name: 'Akupuntur', category: 'Akupuntur', duration: 45, price: 0, age_prices: [], ...SERVICE_PRESENTATION.akupuntur },
  { id: 7, name: 'Bekam', category: 'Bekam', duration: 30, price: 0, age_prices: [], ...SERVICE_PRESENTATION.bekam },
];

const WEEKDAYS: Array<{ day: Weekday; label: string }> = [
  { day: 'monday', label: 'Senin' },
  { day: 'tuesday', label: 'Selasa' },
  { day: 'wednesday', label: 'Rabu' },
  { day: 'thursday', label: 'Kamis' },
  { day: 'friday', label: 'Jumat' },
  { day: 'saturday', label: 'Sabtu' },
  { day: 'sunday', label: 'Ahad / Minggu' },
];

export const FALLBACK_CLINIC_INFO: PublicClinicInfo = {
  is_operational: true,
  maintenance_message: null,
  operational_hours: WEEKDAYS.map(({ day, label }) => ({
    day,
    label,
    is_open: day !== 'sunday',
    open_time: day !== 'sunday' ? '08:00' : null,
    close_time: day !== 'sunday' ? '18:00' : null,
    booking_slots: day !== 'sunday' ? ['09:00', '11:00', '13:00', '15:00'] : [],
    allow_custom_booking_time: day !== 'sunday',
  })),
  holiday_dates: [],
  registration_fee: {
    enabled: false,
    amount: 0,
    new_patient_amount: 0,
    existing_patient_amount: 0,
    applies_to_new_patient: true,
    applies_to_existing_patient: false,
  },
};

export function getServiceSortRank(service: PublicTherapyService): number {
  const name = (service.name || '').trim().toLowerCase();
  const cat = (service.category || '').trim().toLowerCase();

  // Fisioterapi ditaruh paling awal/pertama
  if (name.includes('fisioterapi') || cat.includes('fisioterapi')) {
    if (name === 'fisioterapi') return 1;
    if (name.includes('anak')) return 2;
    if (name.includes('dewasa')) return 3;
    if (name.includes('remaja')) return 4;
    return 5;
  }

  // Layanan terapi utama & tumbuh kembang
  if (name.includes('okupasi') || cat.includes('okupasi') || name === 'ot') return 10;
  if (name.includes('wicara') || cat.includes('wicara') || name === 'tw') return 11;
  if (name.includes('tumbuh kembang') || cat.includes('tumbuh kembang')) return 12;
  if (name.includes('baby massage')) return 13;
  if (name.includes('ortotik') || cat.includes('ortotik')) return 14;
  if (name.includes('konsultasi') || name.includes('observasi') || cat.includes('observasi')) return 15;

  // Akupuntur dan Bekam ditaruh di urutan paling akhir (paling belakang)
  if (name.includes('akupuntur') || cat.includes('akupuntur')) return 98;
  if (name.includes('bekam') || cat.includes('bekam')) return 99;

  return 50;
}

export function mergeServicePresentation(services: PublicTherapyService[]): LandingService[] {
  return [...services]
    .filter((service) => {
      const cat = (service.category || '').toLowerCase();
      return cat !== 'obat_alat' && cat !== 'obat & alat' && cat !== 'obat dan alat';
    })
    .sort((a, b) => getServiceSortRank(a) - getServiceSortRank(b))
    .map((service) => {
      const nameKey = service.name.trim().toLowerCase();
      const catKey = (service.category || '').trim().toLowerCase();
      const presentation =
        SERVICE_PRESENTATION[nameKey] ??
        SERVICE_PRESENTATION[catKey] ??
        DEFAULT_PRESENTATION;

      const isObservasi =
        catKey === 'observasi' ||
        nameKey.includes('observasi') ||
        nameKey.includes('konsultasi & evaluasi');

      return {
        ...service,
        name: isObservasi ? 'Observasi' : service.name,
        ...presentation,
      };
    });
}
