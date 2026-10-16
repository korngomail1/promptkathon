<script setup lang="ts">
import { computed, ref } from 'vue';
import ChartTooltip from './ChartTooltip.vue';
import { formatTick, labelStride, niceTicks, useElementWidth } from '@/composables/chart';

export interface LinePoint {
  key: string;
  label: string;
  fullLabel: string;
  value: number;
  forecast: boolean;
}

export interface ReferenceLine {
  value: number;
  label: string;
}

const props = withDefaults(
  defineProps<{
    points: LinePoint[];
    unit: string;
    ariaLabel: string;
    references?: ReferenceLine[];
    height?: number;
  }>(),
  { height: 240, references: () => [] },
);

const PAD = { top: 20, right: 84, bottom: 26, left: 48 };

const container = ref<HTMLElement | null>(null);
const width = useElementWidth(container);
const hovered = ref<number | null>(null);

const plot = computed(() => ({
  width: Math.max(width.value - PAD.left - PAD.right, 40),
  height: props.height - PAD.top - PAD.bottom,
}));

const maxValue = computed(() =>
  Math.max(...props.points.map((p) => p.value), ...props.references.map((r) => r.value), 0),
);
const ticks = computed(() => niceTicks(maxValue.value || 1));
const scaleMax = computed(() => ticks.value[ticks.value.length - 1] || 1);

const baseline = computed(() => PAD.top + plot.value.height);
const step = computed(() => plot.value.width / Math.max(props.points.length - 1, 1));

function yFor(value: number): number {
  return PAD.top + plot.value.height * (1 - value / scaleMax.value);
}

function xFor(index: number): number {
  return PAD.left + index * step.value;
}

const coords = computed(() => props.points.map((point, index) => ({ point, index, x: xFor(index), y: yFor(point.value) })));

const splitIndex = computed(() => {
  const index = props.points.findIndex((p) => p.forecast);
  return index === -1 ? props.points.length - 1 : index - 1;
});

function toPath(slice: Array<{ x: number; y: number }>): string {
  if (slice.length === 0) return '';
  return slice.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
}

const observedPath = computed(() => toPath(coords.value.slice(0, splitIndex.value + 1)));
/** เริ่มเส้นพยากรณ์จากจุดสุดท้ายของข้อมูลจริง เส้นจะได้ต่อกันไม่ขาด */
const forecastPath = computed(() => toPath(coords.value.slice(Math.max(splitIndex.value, 0))));

const observedArea = computed(() => {
  const slice = coords.value.slice(0, splitIndex.value + 1);
  if (slice.length < 2) return '';
  const first = slice[0];
  const last = slice[slice.length - 1];
  return `${toPath(slice)} L ${last.x} ${baseline.value} L ${first.x} ${baseline.value} Z`;
});

const stride = computed(() => labelStride(props.points.length, plot.value.width, 64));

const endPoint = computed(() => coords.value[coords.value.length - 1] ?? null);

const tooltip = computed(() => {
  if (hovered.value === null) return null;
  const c = coords.value[hovered.value];
  if (!c) return null;
  return {
    x: c.x,
    y: c.y - 12,
    title: c.point.fullLabel,
    rows: [
      {
        label: c.point.forecast ? 'พยากรณ์' : 'ตรวจวัดแล้ว',
        value: `${c.point.value.toLocaleString('th-TH')} ${props.unit}`,
        color: c.point.forecast ? 'var(--series-2)' : 'var(--series-1)',
      },
    ],
  };
});

function onMove(event: PointerEvent): void {
  const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
  const offset = event.clientX - rect.left;
  const index = Math.round(offset / step.value);
  hovered.value = Math.min(Math.max(index, 0), props.points.length - 1);
}

function onKey(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const current = hovered.value ?? 0;
  const next = event.key === 'ArrowLeft' ? current - 1 : current + 1;
  hovered.value = Math.min(Math.max(next, 0), props.points.length - 1);
}
</script>

<template>
  <div ref="container" class="chart">
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="ariaLabel"
    >
      <g>
        <line
          v-for="tick in ticks"
          :key="`g-${tick}`"
          :x1="PAD.left"
          :x2="width - PAD.right"
          :y1="yFor(tick)"
          :y2="yFor(tick)"
          :stroke="tick === 0 ? 'var(--axis)' : 'var(--grid)'"
          stroke-width="1"
        />
        <text
          v-for="tick in ticks"
          :key="`t-${tick}`"
          :x="PAD.left - 8"
          :y="yFor(tick) + 4"
          text-anchor="end"
          class="tick"
        >
          {{ formatTick(tick) }}
        </text>
      </g>

      <!-- เส้นอ้างอิง (ระดับปกติ / เกณฑ์น้ำสูง) ติดป้ายตรงไว้ทางขวา -->
      <g v-for="ref in references" :key="ref.label">
        <line
          :x1="PAD.left"
          :x2="width - PAD.right"
          :y1="yFor(ref.value)"
          :y2="yFor(ref.value)"
          stroke="var(--axis)"
          stroke-width="1"
        />
        <text :x="width - PAD.right + 6" :y="yFor(ref.value) + 4" class="ref-label">
          {{ ref.label }}
        </text>
      </g>

      <path v-if="observedArea" :d="observedArea" fill="var(--series-1-soft)" />
      <path
        v-if="observedPath"
        :d="observedPath"
        fill="none"
        stroke="var(--series-1)"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <path
        v-if="forecastPath"
        :d="forecastPath"
        fill="none"
        stroke="var(--series-2)"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- จุดปลายเส้น มีวงแหวนสีพื้น 2px กันกลืนกับเส้น -->
      <circle
        v-if="endPoint"
        :cx="endPoint.x"
        :cy="endPoint.y"
        r="4"
        :fill="endPoint.point.forecast ? 'var(--series-2)' : 'var(--series-1)'"
        stroke="var(--surface-1)"
        stroke-width="2"
      />

      <g>
        <text
          v-for="(c, index) in coords"
          v-show="index % stride === 0"
          :key="`x-${c.point.key}`"
          :x="c.x"
          :y="baseline + 16"
          text-anchor="middle"
          class="tick"
        >
          {{ c.point.label }}
        </text>
      </g>

      <!-- crosshair: ผู้อ่านเล็งที่ "วัน" ไม่ใช่เล็งที่เส้นหนา 2px -->
      <g v-if="hovered !== null && coords[hovered]">
        <line
          :x1="coords[hovered].x"
          :x2="coords[hovered].x"
          :y1="PAD.top"
          :y2="baseline"
          stroke="var(--axis)"
          stroke-width="1"
        />
        <circle
          :cx="coords[hovered].x"
          :cy="coords[hovered].y"
          r="4.5"
          :fill="coords[hovered].point.forecast ? 'var(--series-2)' : 'var(--series-1)'"
          stroke="var(--surface-1)"
          stroke-width="2"
        />
      </g>

      <rect
        :x="PAD.left - step / 2"
        :y="PAD.top"
        :width="plot.width + step"
        :height="plot.height"
        fill="transparent"
        tabindex="0"
        class="hit"
        :aria-label="ariaLabel"
        @pointermove="onMove"
        @pointerleave="hovered = null"
        @keydown="onKey"
        @focus="hovered = hovered ?? coords.length - 1"
        @blur="hovered = null"
      />
    </svg>

    <ChartTooltip
      v-if="tooltip"
      :visible="true"
      :x="tooltip.x"
      :y="tooltip.y"
      :title="tooltip.title"
      :rows="tooltip.rows"
    />
  </div>
</template>

<style scoped>
.chart {
  position: relative;
  width: 100%;
}

svg {
  display: block;
  overflow: visible;
}

.tick {
  font-size: 11px;
  fill: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.ref-label {
  font-size: 11px;
  fill: var(--text-secondary);
}

.hit {
  cursor: crosshair;
}

.hit:focus-visible {
  outline: 2px solid var(--series-1);
  outline-offset: -2px;
}
</style>
