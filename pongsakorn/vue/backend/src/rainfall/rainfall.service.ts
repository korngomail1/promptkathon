import { Injectable } from '@nestjs/common';
import { GeocodingProvider } from '../providers/geocoding.provider';
import { OpenMeteoProvider, SOURCE_WEATHER, type ForecastResponse } from '../providers/open-meteo.provider';
import type {
  DailyRainPoint,
  HourlyRainPoint,
  LocationRef,
  RainCategory,
  RainfallReport,
  RainfallSummary,
} from '../types';

const HOURS_BACK = 24;
const HOURS_AHEAD = 24;

/** เกณฑ์ปริมาณฝนสะสม 24 ชม. ของกรมอุตุนิยมวิทยา (มม.) */
export function classifyRain(mm: number): RainCategory {
  if (mm < 0.1) return 'none';
  if (mm <= 10) return 'light';
  if (mm <= 35) return 'moderate';
  if (mm <= 90) return 'heavy';
  return 'veryHeavy';
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

@Injectable()
export class RainfallService {
  constructor(
    private readonly openMeteo: OpenMeteoProvider,
    private readonly geocoding: GeocodingProvider,
  ) {}

  async getReport(lat: number, lon: number, name?: string): Promise<RainfallReport> {
    const [forecast, location] = await Promise.all([
      this.openMeteo.getForecast(lat, lon),
      this.resolveLocation(lat, lon, name),
    ]);

    const hourly = this.buildHourly(forecast);
    const daily = this.buildDaily(forecast);
    const summary = buildSummary(hourly, daily);

    return {
      location: { ...location, timezone: forecast.timezone ?? location.timezone },
      updatedAt: new Date().toISOString(),
      timezone: forecast.timezone ?? 'UTC',
      current: forecast.current
        ? {
            time: forecast.current.time,
            precipitation: forecast.current.precipitation ?? 0,
            rain: forecast.current.rain ?? 0,
          }
        : null,
      summary,
      hourly,
      daily,
      source: SOURCE_WEATHER,
    };
  }

  private async resolveLocation(lat: number, lon: number, name?: string): Promise<LocationRef> {
    if (name) {
      return { id: `sel-${lat.toFixed(3)}-${lon.toFixed(3)}`, name, latitude: lat, longitude: lon };
    }
    return this.geocoding.reverse(lat, lon);
  }

  /** ตัดอนุกรมรายชั่วโมงให้เหลือ -24h ถึง +24h รอบเวลาปัจจุบัน */
  private buildHourly(forecast: ForecastResponse): HourlyRainPoint[] {
    const times = forecast.hourly?.time ?? [];
    if (times.length === 0) return [];

    const precipitation = forecast.hourly?.precipitation ?? [];
    const probability = forecast.hourly?.precipitation_probability ?? [];
    const nowIndex = findCurrentIndex(times, forecast.current?.time);
    const start = Math.max(0, nowIndex - HOURS_BACK);
    const end = Math.min(times.length, nowIndex + HOURS_AHEAD + 1);

    const points: HourlyRainPoint[] = [];
    for (let i = start; i < end; i++) {
      points.push({
        time: times[i],
        precipitation: round1(precipitation[i] ?? 0),
        probability: probability[i] ?? null,
        isForecast: i > nowIndex,
      });
    }
    return points;
  }

  /** รายวัน: ย้อนหลัง 3 วัน + วันนี้ + ล่วงหน้า 6 วัน */
  private buildDaily(forecast: ForecastResponse): DailyRainPoint[] {
    const times = forecast.daily?.time ?? [];
    if (times.length === 0) return [];

    const sums = forecast.daily?.precipitation_sum ?? [];
    const probabilities = forecast.daily?.precipitation_probability_max ?? [];
    const hours = forecast.daily?.precipitation_hours ?? [];
    const today = (forecast.current?.time ?? new Date().toISOString()).slice(0, 10);
    const todayIndex = Math.max(0, times.indexOf(today));
    const start = Math.max(0, todayIndex - 3);
    const end = Math.min(times.length, todayIndex + 7);

    const points: DailyRainPoint[] = [];
    for (let i = start; i < end; i++) {
      points.push({
        date: times[i],
        precipitationSum: round1(sums[i] ?? 0),
        probabilityMax: probabilities[i] ?? null,
        precipitationHours: hours[i] ?? null,
        isForecast: i >= todayIndex,
      });
    }
    return points;
  }
}

function findCurrentIndex(times: string[], currentTime?: string): number {
  // Open-Meteo คืนเวลาเป็น local time ของพื้นที่ (ไม่มี timezone suffix) จึงเทียบเป็นสตริงตรง ๆ
  if (currentTime) {
    const hourKey = `${currentTime.slice(0, 13)}:00`;
    const exact = times.indexOf(hourKey);
    if (exact >= 0) return exact;
  }
  const nowKey = `${new Date().toISOString().slice(0, 13)}:00`;
  const index = times.findIndex((t) => t >= nowKey);
  return index >= 0 ? index : Math.floor(times.length / 2);
}

export function buildSummary(hourly: HourlyRainPoint[], daily: DailyRainPoint[]): RainfallSummary {
  const past = hourly.filter((p) => !p.isForecast);
  const future = hourly.filter((p) => p.isForecast);

  const past24h = round1(sum(past.map((p) => p.precipitation)));
  const next24h = round1(sum(future.map((p) => p.precipitation)));

  const forecastDays = daily.filter((d) => d.isForecast);
  const pastDays = daily.filter((d) => !d.isForecast);
  const next7d = round1(sum(forecastDays.map((d) => d.precipitationSum)));
  const past7d = round1(sum(pastDays.map((d) => d.precipitationSum)) + past24h);

  let peak = { value: 0, time: null as string | null };
  for (const point of future) {
    if (point.precipitation > peak.value) peak = { value: point.precipitation, time: point.time };
  }

  return {
    past24h,
    past7d,
    next24h,
    next7d,
    maxHourlyNext24h: round1(peak.value),
    peakHourNext24h: peak.time,
    category: classifyRain(Math.max(past24h, next24h)),
  };
}
