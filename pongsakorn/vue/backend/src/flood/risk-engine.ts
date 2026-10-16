import type { RainfallSummary, RiskFactor, RiskLevel, RiverStatus } from '../types';

/** เกณฑ์แบ่งระดับจากคะแนนรวม 0-100 */
export const LEVEL_THRESHOLDS: Array<{ level: RiskLevel; min: number }> = [
  { level: 'danger', min: 75 },
  { level: 'warning', min: 50 },
  { level: 'watch', min: 25 },
  { level: 'normal', min: 0 },
];

const LEVEL_ORDER: Record<RiskLevel, number> = { normal: 0, watch: 1, warning: 2, danger: 3 };

/** แปลงค่าดิบเป็นคะแนน 0-100 ด้วยการประมาณเชิงเส้นแบบช่วง */
export function piecewise(value: number, points: Array<[number, number]>): number {
  if (value <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (value >= last[0]) return last[1];

  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (value >= x0 && value <= x1) {
      const ratio = x1 === x0 ? 0 : (value - x0) / (x1 - x0);
      return y0 + ratio * (y1 - y0);
    }
  }
  return last[1];
}

/** ฝนหนักในช่วง 24 ชม. — ตัวกระตุ้นหลักของน้ำท่วมฉับพลัน */
const RAIN_24H_CURVE: Array<[number, number]> = [
  [0, 0],
  [10, 12],
  [35, 35],
  [60, 55],
  [90, 75],
  [150, 100],
];

/** ฝนสะสม 7 วัน — ดินอิ่มน้ำแล้วฝนรอบใหม่จะไหลบ่าเร็วขึ้น */
const RAIN_7D_CURVE: Array<[number, number]> = [
  [0, 0],
  [50, 15],
  [100, 35],
  [200, 65],
  [350, 100],
];

/** สัดส่วนอัตราการไหลที่พยากรณ์ เทียบกับเปอร์เซ็นไทล์ 90 ของ 92 วันล่าสุด */
const RIVER_RATIO_CURVE: Array<[number, number]> = [
  [0.5, 0],
  [0.8, 15],
  [1.0, 40],
  [1.2, 65],
  [1.5, 85],
  [2.0, 100],
];

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  warnings: string[];
}

/**
 * รวมคะแนนความเสี่ยงจากฝนปัจจุบัน ฝนสะสม และระดับน้ำในลำน้ำ
 * ถ้าไม่มีข้อมูลลำน้ำ จะกระจายน้ำหนักของมันไปให้สองปัจจัยที่เหลือ
 * แล้วแจ้งไว้ใน warnings เพื่อให้หน้าเว็บบอกผู้ใช้ตามตรงว่าประเมินจากอะไร
 */
export function assessRisk(rain: RainfallSummary, river: RiverStatus): RiskAssessment {
  const warnings: string[] = [];
  const rain24h = Math.max(rain.past24h, rain.next24h);

  const rainScore = piecewise(rain24h, RAIN_24H_CURVE);
  const wetScore = piecewise(rain.past7d, RAIN_7D_CURVE);
  const riverAvailable = river.available && river.ratio !== null;
  const riverScore = riverAvailable ? piecewise(river.ratio as number, RIVER_RATIO_CURVE) : 0;

  const weights = riverAvailable
    ? { rain: 0.4, wet: 0.2, river: 0.4 }
    : { rain: 0.65, wet: 0.35, river: 0 };

  if (!riverAvailable) {
    warnings.push(
      'ไม่มีข้อมูลอัตราการไหลของลำน้ำในพิกัดนี้ (แบบจำลอง GloFAS ครอบคลุมเฉพาะลำน้ำสายหลัก) — ผลประเมินคิดจากปริมาณฝนอย่างเดียว',
    );
  }

  const factors: RiskFactor[] = [
    {
      key: 'rain24h',
      label: 'ฝน 24 ชั่วโมง',
      detail:
        rain.next24h > rain.past24h
          ? `พยากรณ์ฝน 24 ชม. ข้างหน้า ${rain.next24h} มม. (${describeRain(rain24h)})`
          : `ฝนสะสม 24 ชม. ที่ผ่านมา ${rain.past24h} มม. (${describeRain(rain24h)})`,
      value: rain24h,
      unit: 'มม.',
      score: Math.round(rainScore),
      weight: weights.rain,
    },
    {
      key: 'rain7d',
      label: 'ฝนสะสม 7 วัน',
      detail: `ดินอุ้มน้ำไว้แล้ว ${rain.past7d} มม. ในสัปดาห์ที่ผ่านมา`,
      value: rain.past7d,
      unit: 'มม.',
      score: Math.round(wetScore),
      weight: weights.wet,
    },
  ];

  if (riverAvailable) {
    const ratio = river.ratio as number;
    factors.push({
      key: 'river',
      label: 'ระดับน้ำในลำน้ำ',
      detail: `คาดว่าน้ำจะไหลสูงสุด ${formatNumber(river.forecastPeak)} ลบ.ม./วินาที หรือ ${Math.round(ratio * 100)}% ของเกณฑ์น้ำสูงผิดปกติ`,
      value: Math.round(ratio * 100) / 100,
      unit: 'เท่าของเกณฑ์',
      score: Math.round(riverScore),
      weight: weights.river,
    });
  }

  const raw =
    rainScore * weights.rain + wetScore * weights.wet + riverScore * weights.river;
  let score = Math.round(Math.min(100, Math.max(0, raw)));
  let level = levelFromScore(score);

  // กติกาเพดานล่าง: ค่าที่อันตรายชัดเจนต้องไม่ถูกคะแนนเฉลี่ยกลบ
  if (rain24h >= 90) level = atLeast(level, 'warning');
  if (rain24h >= 150) level = atLeast(level, 'danger');
  if (riverAvailable && (river.ratio as number) >= 1.5) level = atLeast(level, 'warning');
  if (riverAvailable && (river.ratio as number) >= 2) level = atLeast(level, 'danger');

  // ถ้าถูกยกระดับด้วยกติกาข้างบน ดันคะแนนขึ้นให้สอดคล้องกับระดับที่แสดง
  const floor = LEVEL_THRESHOLDS.find((t) => t.level === level)?.min ?? 0;
  if (score < floor) score = floor;

  return { score, level, factors, warnings };
}

export function levelFromScore(score: number): RiskLevel {
  return LEVEL_THRESHOLDS.find((t) => score >= t.min)?.level ?? 'normal';
}

function atLeast(current: RiskLevel, minimum: RiskLevel): RiskLevel {
  return LEVEL_ORDER[current] >= LEVEL_ORDER[minimum] ? current : minimum;
}

function describeRain(mm: number): string {
  if (mm < 0.1) return 'ไม่มีฝน';
  if (mm <= 10) return 'ฝนเล็กน้อย';
  if (mm <= 35) return 'ฝนปานกลาง';
  if (mm <= 90) return 'ฝนหนัก';
  return 'ฝนหนักมาก';
}

function formatNumber(value: number | null): string {
  if (value === null) return '-';
  return value >= 100 ? Math.round(value).toLocaleString('th-TH') : String(Math.round(value * 10) / 10);
}
