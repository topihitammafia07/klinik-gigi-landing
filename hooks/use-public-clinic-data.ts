'use client';

import { useEffect, useState } from 'react';
import {
  FALLBACK_CLINIC_INFO,
  FALLBACK_SERVICES,
  mergeServicePresentation,
  type LandingService,
} from '@/lib/landing-data';
import { fetchPublicClinicInfo, fetchPublicServices } from '@/lib/public-api';
import type { PublicClinicInfo, PublicOperationalHour } from '@/types/public-clinic';

export interface PublicClinicData {
  clinicInfo: PublicClinicInfo;
  services: LandingService[];
  isLoading: boolean;
  isUsingFallback: boolean;
}

function normalizeOperationalHours(info: PublicClinicInfo): PublicOperationalHour[] {
  const apiHours = Array.isArray(info?.operational_hours) ? info.operational_hours : [];

  return FALLBACK_CLINIC_INFO.operational_hours.map((fallbackHour) => {
    const apiHour = apiHours.find((item) => item?.day === fallbackHour.day);
    if (!apiHour) return fallbackHour;

    return {
      ...fallbackHour,
      ...apiHour,
      booking_slots: Array.isArray(apiHour.booking_slots)
        ? apiHour.booking_slots
        : fallbackHour.booking_slots,
      allow_custom_booking_time:
        typeof apiHour.allow_custom_booking_time === 'boolean'
          ? apiHour.allow_custom_booking_time
          : false,
    };
  });
}

function normalizeClinicInfo(info: PublicClinicInfo): PublicClinicInfo {
  return {
    is_operational:
      typeof info?.is_operational === 'boolean'
        ? info.is_operational
        : FALLBACK_CLINIC_INFO.is_operational,
    maintenance_message:
      typeof info?.maintenance_message === 'string' || info?.maintenance_message === null
        ? info.maintenance_message
        : FALLBACK_CLINIC_INFO.maintenance_message,
    operational_hours: normalizeOperationalHours(info),
    holiday_dates: Array.isArray(info?.holiday_dates) ? info.holiday_dates : [],
    registration_fee: {
      ...FALLBACK_CLINIC_INFO.registration_fee,
      ...(info?.registration_fee ?? {}),
    },
  };
}

export function usePublicClinicData(): PublicClinicData {
  const [clinicInfo, setClinicInfo] = useState<PublicClinicInfo>(FALLBACK_CLINIC_INFO);
  const [services, setServices] = useState<LandingService[]>(FALLBACK_SERVICES);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPublicData() {
      const [clinicResult, servicesResult] = await Promise.allSettled([
        fetchPublicClinicInfo(controller.signal),
        fetchPublicServices(controller.signal),
      ]);

      if (controller.signal.aborted) return;

      let fallbackUsed = false;

      if (clinicResult.status === 'fulfilled') {
        setClinicInfo(normalizeClinicInfo(clinicResult.value));
      } else {
        fallbackUsed = true;
      }

      if (servicesResult.status === 'fulfilled' && servicesResult.value.length > 0) {
        setServices(mergeServicePresentation(servicesResult.value));
      } else {
        fallbackUsed = true;
      }

      setIsUsingFallback(fallbackUsed);
      setIsLoading(false);
    }

    loadPublicData().catch(() => {
      if (!controller.signal.aborted) {
        setIsUsingFallback(true);
        setIsLoading(false);
      }
    });

    return () => controller.abort();
  }, []);

  return { clinicInfo, services, isLoading, isUsingFallback };
}
