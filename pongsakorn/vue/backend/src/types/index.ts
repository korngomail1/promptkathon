/** ระดับการแจ้งเตือนภัยน้ำท่วม (เรียงจากเบาไปหนัก) */
export type RiskLevel = 'normal' | 'watch' | 'warning' | 'danger';

export const RISK_LEVELS: RiskLevel[] = ['normal', 'watch', 'warning', 'danger'];

/** หมวดปริมาณฝน 24 ชม. ตามเกณฑ์กรมอุตุนิยมวิทยา */
export type RainCategory = 'none' | 'light' | 'moderate' | 'heavy' | 'veryHeavy';

export interface LocationRef {
  id: string;
  name: string;
  admin1?: string;
  admin2?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  /** ระยะห่างจากพิกัดที่ผู้ใช้ส่งมา (กม.) ใช้ตอน reverse geocode */
  distanceKm?: number;
}

export interface HourlyRainPoint {
  time: string;
  precipitation: number;
  probability: number | null;
  isForecast: boolean;
}

export interface DailyRainPoint {
  date: string;
  precipitationSum: number;
  probabilityMax: number | null;
  precipitationHours: number | null;
  isForecast: boolean;
}

export interface RainfallSummary {
  past24h: number;
  past7d: number;
  next24h: number;
  next7d: number;
  maxHourlyNext24h: number;
  peakHourNext24h: string | null;
  category: RainCategory;
}

export interface RainfallReport {
  location: LocationRef;
  updatedAt: string;
  timezone: string;
  current: { time: string; precipitation: number; rain: number } | null;
  summary: RainfallSummary;
  hourly: HourlyRainPoint[];
  daily: DailyRainPoint[];
  source: SourceRef;
}

export interface RiverDischargePoint {
  date: string;
  discharge: number | null;
  isForecast: boolean;
}

export interface RiverStatus {
  available: boolean;
  unit: string;
  current: number | null;
  /** ค่ามัธยฐานย้อนหลัง ~92 วัน ใช้เป็นระดับ "ปกติ" ของฤดูกาลนี้ */
  seasonalNormal: number | null;
  /** เปอร์เซ็นไทล์ 90 ย้อนหลัง ~92 วัน ใช้เป็นเกณฑ์ "สูงผิดปกติ" */
  highThreshold: number | null;
  /** ค่าสูงสุดที่พยากรณ์ไว้ในช่วงล่วงหน้า */
  forecastPeak: number | null;
  forecastPeakDate: string | null;
  /** forecastPeak / highThreshold */
  ratio: number | null;
  series: RiverDischargePoint[];
}

export interface RiskFactor {
  key: string;
  label: string;
  detail: string;
  value: number;
  unit: string;
  /** คะแนนย่อย 0-100 */
  score: number;
  /** น้ำหนักที่ใช้จริงในการรวมคะแนน 0-1 */
  weight: number;
}

export interface FloodStatus {
  location: LocationRef;
  updatedAt: string;
  level: RiskLevel;
  score: number;
  isFlooding: boolean;
  headline: string;
  message: string;
  factors: RiskFactor[];
  rainfall: RainfallSummary;
  river: RiverStatus;
  advice: string[];
  warnings: string[];
  sources: SourceRef[];
}

export interface SourceRef {
  name: string;
  model: string;
  url: string;
  attribution: string;
}
