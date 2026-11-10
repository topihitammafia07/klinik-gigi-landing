import { formatClock, getOperationalHours } from '@/lib/clinic-format';
import type { PublicClinicInfo } from '@/types/public-clinic';

export function OperationalHoursList({ clinicInfo }: { clinicInfo: PublicClinicInfo }) {
  const hours = getOperationalHours(clinicInfo);

  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#e0f4f1] text-[#00685f] flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          schedule
        </span>
      </div>
      <div className="flex-1 pt-1">
        <p className="font-semibold text-[#0b1c30] mb-2">Jam Operasional</p>
        {hours.length === 0 ? (
          <p className="text-sm text-[#6d7a77]">Jam operasional belum tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {hours.map((hour) => (
              <div key={hour.day} className="flex items-center justify-between gap-4 text-sm text-[#3d4947]">
                <span>{hour.label}</span>
                <span className={hour.is_open ? 'font-medium text-[#0b1c30]' : 'font-medium text-[#ba1a1a]'}>
                  {hour.is_open && hour.open_time && hour.close_time
                    ? `${formatClock(hour.open_time)}–${formatClock(hour.close_time)}`
                    : 'Libur'}
                </span>
              </div>
            ))}
          </div>
        )}

        {clinicInfo.holiday_dates && clinicInfo.holiday_dates.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#e2e8f0]">
            <p className="text-xs font-semibold text-[#0b1c30] mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#ba1a1a]">event_busy</span>
              Hari Libur Klinik / Nasional:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {clinicInfo.holiday_dates.map((h) => (
                <span
                  key={h.date}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#fee2e2] text-[#991b1b] font-medium"
                >
                  <span className="font-semibold">{h.date}:</span> {h.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
