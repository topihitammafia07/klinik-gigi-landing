import type { ApiEnvelope, PublicClinicInfo, PublicTherapyService } from '@/types/public-clinic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getPublicData<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Public API request failed: ${response.status}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function fetchPublicClinicInfo(signal?: AbortSignal): Promise<PublicClinicInfo> {
  return getPublicData<PublicClinicInfo>('/public/clinic-info', signal);
}

export function fetchPublicServices(signal?: AbortSignal): Promise<PublicTherapyService[]> {
  return getPublicData<PublicTherapyService[]>('/public/services', signal);
}
