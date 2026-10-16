import type { RainCategory, RiskLevel } from '@/api/types';

export const RISK_META: Record<
  RiskLevel,
  { label: string; icon: string; color: string; wash: string; short: string }
> = {
  normal: {
    label: 'ปกติ',
    short: 'ไม่ท่วม',
    icon: '✓',
    color: 'var(--status-good)',
    wash: 'var(--status-good-wash)',
  },
  watch: {
    label: 'เฝ้าระวัง',
    short: 'ยังไม่ท่วม',
    icon: '!',
    color: 'var(--status-warning)',
    wash: 'var(--status-warning-wash)',
  },
  warning: {
    label: 'เตือนภัย',
    short: 'เสี่ยงท่วม',
    icon: '▲',
    color: 'var(--status-serious)',
    wash: 'var(--status-serious-wash)',
  },
  danger: {
    label: 'อันตราย',
    short: 'เสี่ยงท่วมสูงมาก',
    icon: '■',
    color: 'var(--status-critical)',
    wash: 'var(--status-critical-wash)',
  },
};

export const RAIN_CATEGORY_LABEL: Record<RainCategory, string> = {
  none: 'ไม่มีฝน',
  light: 'ฝนเล็กน้อย',
  moderate: 'ฝนปานกลาง',
  heavy: 'ฝนหนัก',
  veryHeavy: 'ฝนหนักมาก',
};

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/** Open-Meteo ส่งเวลาท้องถิ่นแบบไม่มี timezone suffix — parse ตรง ๆ ห้ามให้ Date เดาเป็น UTC */
function parseLocal(value: string): Date {
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}

export function formatHour(value: string): string {
  return `${String(parseLocal(value).getHours()).padStart(2, '0')}:00`;
}

export function formatDayHour(value: string): string {
  const date = parseLocal(value);
  return `${WEEKDAYS[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:00`;
}

export function formatDate(value: string): string {
  const date = parseLocal(value);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

export function formatFullDate(value: string): string {
  return parseLocal(value).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMm(value: number): string {
  return value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
}

export function formatDischarge(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1000) return Math.round(value).toLocaleString('th-TH');
  return String(Math.round(value * 10) / 10);
}

export function formatRelativeTime(date: Date | null): string {
  if (!date) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'เมื่อสักครู่';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
}

export function formatClock(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
