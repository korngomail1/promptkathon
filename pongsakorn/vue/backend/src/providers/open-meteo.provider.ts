import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import { buildUrl, fetchJson } from '../common/http.util';
import type { SourceRef } from '../types';

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: { time: string; precipitation?: number; rain?: number; weather_code?: number };
  hourly?: {
    time: string[];
    precipitation?: (number | null)[];
    precipitation_probability?: (number | null)[];
  };
  daily?: {
    time: string[];
    precipitation_sum?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_hours?: (number | null)[];
  };
}

export interface FloodResponse {
  latitude: number;
  longitude: number;
  daily?: { time: string[]; river_discharge?: (number | null)[] };
  daily_units?: { river_discharge?: string };
}

export const SOURCE_WEATHER: SourceRef = {
  name: 'Open-Meteo Weather Forecast API',
  model: 'ECMWF IFS / GFS ensemble',
  url: 'https://open-meteo.com/en/docs',
  attribution: 'Weather data by Open-Meteo.com (CC BY 4.0)',
};

export const SOURCE_FLOOD: SourceRef = {
  name: 'Open-Meteo Flood API',
  model: 'GloFAS v4 (Copernicus Emergency Management Service)',
  url: 'https://open-meteo.com/en/docs/flood-api',
  attribution: 'River discharge by GloFAS / Copernicus via Open-Meteo.com',
};

/**
 * ตัวเชื่อม API ภายนอกของ Open-Meteo (ฟรี ไม่ต้องใช้ API key)
 * ถ้าจะสลับไปใช้แหล่งอื่น เช่น API ของกรมอุตุฯ หรือ ThaiWater
 * ให้แก้เฉพาะคลาสนี้ โดยคง shape ของ ForecastResponse / FloodResponse ไว้
 */
@Injectable()
export class OpenMeteoProvider {
  private readonly logger = new Logger(OpenMeteoProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  private get ttl(): number {
    return this.config.get<number>('CACHE_TTL_SECONDS', 600);
  }

  private get httpOptions() {
    return {
      timeoutMs: this.config.get<number>('HTTP_TIMEOUT_MS', 10_000),
      retries: this.config.get<number>('HTTP_RETRIES', 2),
    };
  }

  private get apiKey(): string | undefined {
    return this.config.get<string>('OPEN_METEO_API_KEY') || undefined;
  }

  /** พยากรณ์ฝนรายชั่วโมง/รายวัน ย้อนหลัง 7 วัน + ล่วงหน้า 7 วัน */
  async getForecast(lat: number, lon: number): Promise<ForecastResponse> {
    const url = buildUrl(
      this.config.get<string>('OPEN_METEO_FORECAST_URL', 'https://api.open-meteo.com/v1/forecast'),
      {
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        current: 'precipitation,rain,weather_code',
        hourly: 'precipitation,precipitation_probability',
        daily: 'precipitation_sum,precipitation_probability_max,precipitation_hours',
        past_days: 7,
        forecast_days: 7,
        timezone: 'auto',
        apikey: this.apiKey,
      },
    );

    return this.cache.wrap(`forecast:${lat.toFixed(3)}:${lon.toFixed(3)}`, this.ttl, () =>
      fetchJson<ForecastResponse>(url, this.httpOptions),
    );
  }

  /**
   * อัตราการไหลของน้ำในลำน้ำ (river discharge) จากแบบจำลอง GloFAS
   * ดึงย้อนหลัง 92 วันเพื่อใช้เป็นฐานเทียบของฤดูกาลปัจจุบัน
   * คืน null เมื่อแหล่งข้อมูลล่ม เพื่อให้ระบบยังประเมินจากฝนได้
   */
  async getRiverDischarge(lat: number, lon: number): Promise<FloodResponse | null> {
    const url = buildUrl(
      this.config.get<string>('OPEN_METEO_FLOOD_URL', 'https://flood-api.open-meteo.com/v1/flood'),
      {
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        daily: 'river_discharge',
        past_days: 92,
        forecast_days: 7,
        apikey: this.apiKey,
      },
    );

    try {
      return await this.cache.wrap(`flood:${lat.toFixed(3)}:${lon.toFixed(3)}`, this.ttl, () =>
        fetchJson<FloodResponse>(url, this.httpOptions),
      );
    } catch (error) {
      // จุดที่ไม่มีลำน้ำในแบบจำลอง GloFAS จะตอบ 400 — ถือว่า "ไม่มีข้อมูล" ไม่ใช่ error ของระบบ
      this.logger.warn(
        `ไม่มีข้อมูลลำน้ำที่ ${lat},${lon}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
