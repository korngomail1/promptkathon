import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/** ติดตามความกว้างจริงของ container เพื่อวาด SVG ตามขนาดพิกเซลจริง (ตัวอักษรจะได้ไม่ยืด) */
export function useElementWidth(target: Ref<HTMLElement | null>, fallback = 640) {
  const width = ref(fallback);
  let observer: ResizeObserver | null = null;

  onMounted(() => {
    if (!target.value) return;
    observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? fallback;
      if (next > 0) width.value = next;
    });
    observer.observe(target.value);
    width.value = target.value.clientWidth || fallback;
  });

  onBeforeUnmount(() => observer?.disconnect());

  return width;
}

/** ขีดแกน Y ที่ลงตัว (1 / 2 / 2.5 / 5 × 10^n) */
export function niceTicks(max: number, desired = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];

  const rawStep = max / desired;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;

  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.5; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks.length > 1 ? ticks : [0, step];
}

export function formatTick(value: number): string {
  if (value >= 1000) return (value / 1000) % 1 === 0 ? `${value / 1000}k` : value.toLocaleString('th-TH');
  return String(Math.round(value * 100) / 100);
}

/** เส้นทางแท่ง: หัวมน 4px ฐานเหลี่ยม ตาม mark spec */
export function barPath(x: number, y: number, width: number, baseline: number, radius = 4): string {
  const height = baseline - y;
  if (height <= 0.5) return '';
  const r = Math.min(radius, width / 2, height);
  return [
    `M ${x} ${baseline}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${baseline}`,
    'Z',
  ].join(' ');
}

/** เลือกระยะห่างของป้ายแกน X ให้ไม่ชนกัน โดยคิดจากความกว้างที่มีจริง */
export function labelStride(count: number, available: number, minSpacing = 52): number {
  if (count <= 1) return 1;
  const perLabel = available / count;
  return Math.max(1, Math.ceil(minSpacing / Math.max(perLabel, 1)));
}
