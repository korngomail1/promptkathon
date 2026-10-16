import type { FloodStatus, LocationRef, RainfallReport } from './types';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body?.message.join(', ') : body?.message;
    throw new ApiError(message ?? `โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  presets: () => get<{ items: LocationRef[] }>('/locations/presets').then((r) => r.items),
  searchLocations: (q: string, limit = 8) =>
    get<{ items: LocationRef[] }>('/locations/search', { q, limit }).then((r) => r.items),
  reverseGeocode: (lat: number, lon: number) => get<LocationRef>('/locations/reverse', { lat, lon }),
  rainfall: (lat: number, lon: number, name?: string) =>
    get<RainfallReport>('/rainfall', { lat, lon, name }),
  floodStatus: (lat: number, lon: number, name?: string) =>
    get<FloodStatus>('/flood/status', { lat, lon, name }),
};
