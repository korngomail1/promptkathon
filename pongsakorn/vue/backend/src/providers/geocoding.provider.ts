import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import { buildUrl, fetchJson } from '../common/http.util';
import { nearestThaiLocation } from '../locations/thai-locations.data';
import type { LocationRef } from '../types';

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    admin2?: string;
    timezone?: string;
  }>;
}

interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  localityInfo?: { administrative?: Array<{ name: string; adminLevel: number }> };
}

/** ค้นหาพื้นที่จากชื่อ และแปลงพิกัด GPS กลับเป็นชื่อพื้นที่ */
@Injectable()
export class GeocodingProvider {
  private readonly logger = new Logger(GeocodingProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  private get httpOptions() {
    return {
      timeoutMs: this.config.get<number>('HTTP_TIMEOUT_MS', 10_000),
      retries: this.config.get<number>('HTTP_RETRIES', 2),
    };
  }

  async search(query: string, limit = 10): Promise<LocationRef[]> {
    const url = buildUrl(
      this.config.get<string>(
        'OPEN_METEO_GEOCODING_URL',
        'https://geocoding-api.open-meteo.com/v1/search',
      ),
      { name: query, count: Math.min(Math.max(limit, 1), 20), language: 'th', format: 'json' },
    );

    const data = await this.cache.wrap(`geo:${query.toLowerCase()}:${limit}`, 86_400, () =>
      fetchJson<GeocodingResponse>(url, this.httpOptions),
    );

    return (data.results ?? []).map((item) => ({
      id: `om-${item.id}`,
      name: item.name,
      admin1: item.admin1,
      admin2: item.admin2,
      country: item.country,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
    }));
  }

  /**
   * แปลงพิกัดเป็นชื่อพื้นที่ ถ้าบริการภายนอกล่มจะตกไปใช้จังหวัดไทยที่ใกล้ที่สุดแทน
   * เพื่อให้ปุ่ม "ใช้ตำแหน่งปัจจุบัน" ใช้งานได้เสมอ
   */
  async reverse(lat: number, lon: number): Promise<LocationRef> {
    const url = buildUrl(
      this.config.get<string>(
        'REVERSE_GEOCODE_URL',
        'https://api.bigdatacloud.net/data/reverse-geocode-client',
      ),
      { latitude: lat.toFixed(4), longitude: lon.toFixed(4), localityLanguage: 'th' },
    );

    try {
      const data = await this.cache.wrap(`rev:${lat.toFixed(3)}:${lon.toFixed(3)}`, 86_400, () =>
        fetchJson<ReverseGeocodeResponse>(url, this.httpOptions),
      );

      const name = data.city || data.locality || data.principalSubdivision;
      if (!name) throw new Error('ไม่พบชื่อพื้นที่ในผลลัพธ์');

      return {
        id: `rev-${lat.toFixed(3)}-${lon.toFixed(3)}`,
        name,
        admin1: data.principalSubdivision,
        country: data.countryName,
        latitude: lat,
        longitude: lon,
      };
    } catch (error) {
      this.logger.warn(
        `reverse geocode ล้มเหลว ใช้จังหวัดใกล้เคียงแทน: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { ...nearestThaiLocation(lat, lon), latitude: lat, longitude: lon };
    }
  }
}
