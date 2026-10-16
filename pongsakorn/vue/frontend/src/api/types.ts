export type RiskLevel = 'normal' | 'watch' | 'warning' | 'danger';
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

export interface SourceRef {
  name: string;
  model: string;
  url: string;
  attribution: string;
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
  seasonalNormal: number | null;
  highThreshold: number | null;
  forecastPeak: number | null;
  forecastPeakDate: string | null;
  ratio: number | null;
  series: RiverDischargePoint[];
}

export interface RiskFactor {
  key: string;
  label: string;
  detail: string;
  value: number;
  unit: string;
  score: number;
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
