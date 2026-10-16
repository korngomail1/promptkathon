import { Injectable } from '@nestjs/common';
import {
  OpenMeteoProvider,
  SOURCE_FLOOD,
  SOURCE_WEATHER,
  type FloodResponse,
} from '../providers/open-meteo.provider';
import { RainfallService } from '../rainfall/rainfall.service';
import type { FloodStatus, RiskLevel, RiverDischargePoint, RiverStatus } from '../types';
import { assessRisk } from './risk-engine';

const EMPTY_RIVER: RiverStatus = {
  available: false,
  unit: 'm³/s',
  current: null,
  seasonalNormal: null,
  highThreshold: null,
  forecastPeak: null,
  forecastPeakDate: null,
  ratio: null,
  series: [],
};

@Injectable()
export class FloodService {
  constructor(
    private readonly openMeteo: OpenMeteoProvider,
    private readonly rainfall: RainfallService,
  ) {}

  async getStatus(lat: number, lon: number, name?: string): Promise<FloodStatus> {
    const [report, floodData] = await Promise.all([
      this.rainfall.getReport(lat, lon, name),
      this.openMeteo.getRiverDischarge(lat, lon),
    ]);

    const river = buildRiverStatus(floodData);
    const { score, level, factors, warnings } = assessRisk(report.summary, river);
    const { headline, message, advice } = describeLevel(level, report.summary, river);

    return {
      location: report.location,
      updatedAt: new Date().toISOString(),
      level,
      score,
      // "ท่วมแล้ว/กำลังจะท่วม" ใช้เกณฑ์ระดับเตือนภัยขึ้นไป
      isFlooding: level === 'warning' || level === 'danger',
      headline,
      message,
      factors,
      rainfall: report.summary,
      river,
      advice,
      warnings,
      sources: river.available ? [SOURCE_WEATHER, SOURCE_FLOOD] : [SOURCE_WEATHER],
    };
  }
}

export function buildRiverStatus(data: FloodResponse | null): RiverStatus {
  const times = data?.daily?.time ?? [];
  const values = data?.daily?.river_discharge ?? [];
  if (times.length === 0) return EMPTY_RIVER;

  const today = new Date().toISOString().slice(0, 10);
  const series: RiverDischargePoint[] = times.map((date, i) => ({
    date,
    discharge: values[i] ?? null,
    isForecast: date > today,
  }));

  const history = series
    .filter((p) => !p.isForecast && p.discharge !== null)
    .map((p) => p.discharge as number);
  const forecast = series.filter((p) => p.isForecast && p.discharge !== null);

  if (history.length === 0) return EMPTY_RIVER;

  const current = history[history.length - 1];
  const seasonalNormal = percentile(history, 0.5);
  const highThreshold = percentile(history, 0.9);

  let peak = { value: current, date: today };
  for (const point of forecast) {
    if ((point.discharge as number) > peak.value) {
      peak = { value: point.discharge as number, date: point.date };
    }
  }

  // ลำน้ำที่แทบไม่มีน้ำไหล (เช่น พิกัดกลางเมืองห่างแม่น้ำ) ให้ถือว่าไม่มีข้อมูลที่ใช้ได้
  if (highThreshold <= 0.1) return { ...EMPTY_RIVER, series };

  return {
    available: true,
    unit: data?.daily_units?.river_discharge ?? 'm³/s',
    current: round2(current),
    seasonalNormal: round2(seasonalNormal),
    highThreshold: round2(highThreshold),
    forecastPeak: round2(peak.value),
    forecastPeakDate: peak.date,
    ratio: Math.round((peak.value / highThreshold) * 100) / 100,
    series,
  };
}

/** เปอร์เซ็นไทล์แบบ linear interpolation */
export function percentile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next !== undefined ? sorted[base] + rest * (next - sorted[base]) : sorted[base];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function describeLevel(
  level: RiskLevel,
  rain: { past24h: number; next24h: number },
  river: RiverStatus,
): { headline: string; message: string; advice: string[] } {
  const rainLine =
    rain.next24h >= rain.past24h
      ? `คาดว่าจะมีฝนอีก ${rain.next24h} มม. ใน 24 ชม. ข้างหน้า`
      : `ฝนตกสะสม ${rain.past24h} มม. ใน 24 ชม. ที่ผ่านมา`;
  const riverLine = river.available
    ? ` ระดับน้ำในลำน้ำอยู่ที่ ${Math.round((river.ratio as number) * 100)}% ของเกณฑ์น้ำสูงผิดปกติ`
    : '';

  switch (level) {
    case 'danger':
      return {
        headline: 'อันตราย — พื้นที่นี้เสี่ยงน้ำท่วมสูงมาก',
        message: `${rainLine}${riverLine} ควรอพยพไปยังพื้นที่สูงและติดตามประกาศทางการอย่างใกล้ชิด`,
        advice: [
          'ขนของมีค่าและเอกสารสำคัญขึ้นที่สูงทันที',
          'เตรียมกระเป๋าฉุกเฉิน น้ำดื่ม ยา ไฟฉาย และ power bank',
          'ย้ายรถไปจอดในที่สูง ก่อนถนนถูกตัดขาด',
          'ตัดไฟในจุดที่น้ำอาจท่วมถึง และห้ามเดินลุยน้ำที่มีสายไฟ',
          'โทร 1784 (ปภ.) หรือ 1669 (การแพทย์ฉุกเฉิน) เมื่อต้องการความช่วยเหลือ',
        ],
      };
    case 'warning':
      return {
        headline: 'เตือนภัย — มีโอกาสน้ำท่วมในพื้นที่นี้',
        message: `${rainLine}${riverLine} ควรเตรียมพร้อมรับมือและเฝ้าระวังระดับน้ำใกล้บ้าน`,
        advice: [
          'ย้ายของมีค่าและเครื่องใช้ไฟฟ้าขึ้นที่สูง',
          'เก็บน้ำดื่ม อาหารแห้ง และชาร์จแบตสำรองให้เต็ม',
          'ตรวจทางระบายน้ำหน้าบ้านไม่ให้มีขยะอุดตัน',
          'วางแผนเส้นทางอพยพและจุดนัดพบของคนในบ้าน',
        ],
      };
    case 'watch':
      return {
        headline: 'เฝ้าระวัง — ยังไม่ท่วม แต่ควรติดตามสถานการณ์',
        message: `${rainLine}${riverLine} สถานการณ์ยังไม่น่ากังวล แต่ควรติดตามข้อมูลเป็นระยะ`,
        advice: [
          'ติดตามพยากรณ์อากาศและประกาศจากหน่วยงานท้องถิ่น',
          'เก็บกวาดท่อระบายน้ำและรางน้ำรอบบ้าน',
          'สำรองน้ำดื่มและของใช้จำเป็นไว้บ้าง',
        ],
      };
    default:
      return {
        headline: 'ปกติ — ยังไม่พบสัญญาณน้ำท่วม',
        message: `${rainLine}${riverLine} ไม่พบปัจจัยเสี่ยงน้ำท่วมในพื้นที่นี้`,
        advice: [
          'ใช้ชีวิตได้ตามปกติ',
          'ตรวจสอบอีกครั้งหากมีประกาศพายุหรือฝนตกหนักต่อเนื่อง',
        ],
      };
  }
}
