import type { RainfallSummary, RiverStatus } from '../types';
import { assessRisk, levelFromScore, piecewise } from './risk-engine';

const rain = (over: Partial<RainfallSummary> = {}): RainfallSummary => ({
  past24h: 0,
  past7d: 0,
  next24h: 0,
  next7d: 0,
  maxHourlyNext24h: 0,
  peakHourNext24h: null,
  category: 'none',
  ...over,
});

const river = (over: Partial<RiverStatus> = {}): RiverStatus => ({
  available: false,
  unit: 'm³/s',
  current: null,
  seasonalNormal: null,
  highThreshold: null,
  forecastPeak: null,
  forecastPeakDate: null,
  ratio: null,
  series: [],
  ...over,
});

describe('piecewise', () => {
  it('หนีบค่าที่อยู่นอกช่วงไว้ที่ปลายทั้งสองด้าน', () => {
    expect(piecewise(-5, [[0, 0], [10, 100]])).toBe(0);
    expect(piecewise(999, [[0, 0], [10, 100]])).toBe(100);
  });

  it('ประมาณค่าเชิงเส้นภายในช่วง', () => {
    expect(piecewise(5, [[0, 0], [10, 100]])).toBe(50);
  });
});

describe('assessRisk', () => {
  it('อากาศแห้งและไม่มีข้อมูลลำน้ำ ได้ระดับปกติ พร้อมคำเตือนเรื่องข้อมูล', () => {
    const result = assessRisk(rain(), river());
    expect(result.level).toBe('normal');
    expect(result.score).toBe(0);
    expect(result.warnings).toHaveLength(1);
  });

  it('ฝนหนักมากเกิน 90 มม. ถูกยกระดับเป็นเตือนภัยเสมอ', () => {
    const result = assessRisk(rain({ next24h: 95 }), river());
    expect(result.level).toBe('warning');
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('น้ำในลำน้ำสูงเกินสองเท่าของเกณฑ์ ถูกยกระดับเป็นอันตราย', () => {
    const result = assessRisk(
      rain({ past24h: 5 }),
      river({ available: true, ratio: 2.1, forecastPeak: 900, highThreshold: 420 }),
    );
    expect(result.level).toBe('danger');
  });

  it('ใส่ปัจจัยลำน้ำเข้ามาเมื่อมีข้อมูล และกระจายน้ำหนักให้ฝนเมื่อไม่มี', () => {
    const withRiver = assessRisk(rain(), river({ available: true, ratio: 0.6, highThreshold: 100 }));
    expect(withRiver.factors.map((f) => f.key)).toContain('river');

    const withoutRiver = assessRisk(rain(), river());
    const totalWeight = withoutRiver.factors.reduce((sum, f) => sum + f.weight, 0);
    expect(totalWeight).toBeCloseTo(1);
  });
});

describe('levelFromScore', () => {
  it.each([
    [0, 'normal'],
    [24, 'normal'],
    [25, 'watch'],
    [49, 'watch'],
    [50, 'warning'],
    [74, 'warning'],
    [75, 'danger'],
    [100, 'danger'],
  ])('คะแนน %i → %s', (score, expected) => {
    expect(levelFromScore(score)).toBe(expected);
  });
});
