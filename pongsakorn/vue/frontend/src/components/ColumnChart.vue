<script setup lang="ts">
import { computed, ref } from 'vue';
import ChartTooltip from './ChartTooltip.vue';
import { barPath, formatTick, labelStride, niceTicks, useElementWidth } from '@/composables/chart';

export interface ColumnPoint {
  key: string;
  /** ป้ายสั้นใต้แกน X */
  label: string;
  /** ป้ายเต็มใน tooltip */
  fullLabel: string;
  value: number;
  /** true = ค่าพยากรณ์ (ชุดสีที่ 2) */
  forecast: boolean;
  /** แถวเสริมใน tooltip เช่น โอกาสมีฝน */
  extra?: { label: string; value: string };
}

const props = withDefaults(
  defineProps<{
    points: ColumnPoint[];
    unit: string;
    ariaLabel: string;
    height?: number;
    /** ป้ายกำกับเส้นแบ่ง "ตอนนี้" ระหว่างข้อมูลจริงกับพยากรณ์ */
    dividerLabel?: string;
  }>(),
  { height: 220, dividerLabel: 'ตอนนี้' },
);

const PAD = { top: 26, right: 14, bottom: 26, left: 42 };
const MAX_BAR = 24;
const GAP = 2;

const container = ref<HTMLElement | null>(null);
const width = useElementWidth(container);
const hovered = ref<number | null>(null);

const plot = computed(() => ({
  width: Math.max(width.value - PAD.left - PAD.right, 40),
  height: props.height - PAD.top - PAD.bottom,
}));

const maxValue = computed(() => Math.max(...props.points.map((p) => p.value), 0));
const ticks = computed(() => niceTicks(maxValue.value || 1));
const scaleMax = computed(() => ticks.value[ticks.value.length - 1] || 1);

const band = computed(() => plot.value.width / Math.max(props.points.length, 1));
const barWidth = computed(() => Math.max(Math.min(band.value - GAP, MAX_BAR), 2));

const baseline = computed(() => PAD.top + plot.value.height);

function yFor(value: number): number {
  return PAD.top + plot.value.height * (1 - value / scaleMax.value);
}

function xFor(index: number): number {
  return PAD.left + index * band.value + (band.value - barWidth.value) / 2;
}

const bars = computed(() =>
  props.points.map((point, index) => ({
    point,
    index,
    x: xFor(index),
    y: yFor(point.value),
    bandX: PAD.left + index * band.value,
    path: barPath(xFor(index), yFor(point.value), barWidth.value, baseline.value),
  })),
);

/** ป้ายค่าติดบนแท่ง — ติดเฉพาะยอดสูงสุด ไม่ติดทุกแท่ง */
const peakIndex = computed(() => {
  if (maxValue.value <= 0) return -1;
  return props.points.findIndex((p) => p.value === maxValue.value);
});

/** หนีบตำแหน่งป้ายไม่ให้ล้นขอบการ์ด เวลายอดสูงสุดตกอยู่แท่งแรกหรือแท่งสุดท้าย */
const peakLabelX = computed(() => {
  const bar = peakIndex.value >= 0 ? bars.value[peakIndex.value] : null;
  if (!bar) return 0;
  const halfLabel = 26;
  const center = bar.x + barWidth.value / 2;
  return Math.min(Math.max(center, PAD.left + halfLabel), width.value - PAD.right - halfLabel);
});

const stride = computed(() => labelStride(props.points.length, plot.value.width));

const dividerX = computed(() => {
  const firstForecast = props.points.findIndex((p) => p.forecast);
  if (firstForecast <= 0) return null;
  return PAD.left + firstForecast * band.value - GAP / 2;
});

const tooltip = computed(() => {
  if (hovered.value === null) return null;
  const bar = bars.value[hovered.value];
  if (!bar) return null;

  const rows: Array<{ label: string; value: string; color?: string }> = [
    {
      label: bar.point.forecast ? 'พยากรณ์' : 'ตรวจวัดแล้ว',
      value: `${bar.point.value} ${props.unit}`,
      color: bar.point.forecast ? 'var(--series-2)' : 'var(--series-1)',
    },
  ];
  if (bar.point.extra) rows.push(bar.point.extra);

  return {
    x: bar.bandX + band.value / 2,
    y: Math.min(bar.y, baseline.value) - 10,
    title: bar.point.fullLabel,
    rows,
  };
});
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
      <!-- เส้นกริดเป็น hairline ทึบ ถอยอยู่ด้านหลังเสมอ -->
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

      <!-- เส้นแบ่งข้อมูลจริง / พยากรณ์ -->
      <g v-if="dividerX !== null">
        <line
          :x1="dividerX"
          :x2="dividerX"
          :y1="PAD.top - 6"
          :y2="baseline"
          stroke="var(--axis)"
          stroke-width="1"
        />
        <text :x="dividerX + 4" :y="PAD.top - 12" class="divider-label">{{ dividerLabel }}</text>
      </g>

      <g>
        <path
          v-for="bar in bars"
          :key="bar.point.key"
          :d="bar.path"
          :fill="bar.point.forecast ? 'var(--series-2)' : 'var(--series-1)'"
          :opacity="hovered === null || hovered === bar.index ? 1 : 0.55"
        />
      </g>

      <!-- ป้ายค่ายอดสูงสุด วางบนหัวแท่ง -->
      <text
        v-if="peakIndex >= 0 && bars[peakIndex]"
        :x="peakLabelX"
        :y="bars[peakIndex].y - 7"
        text-anchor="middle"
        class="peak-label"
      >
        {{ maxValue }} {{ unit }}
      </text>

      <g>
        <text
          v-for="(bar, index) in bars"
          v-show="index % stride === 0"
          :key="`x-${bar.point.key}`"
          :x="bar.bandX + band / 2"
          :y="baseline + 16"
          text-anchor="middle"
          class="tick"
        >
          {{ bar.point.label }}
        </text>
      </g>

      <!-- พื้นที่รับ hover เต็มความสูงของช่อง กว้างกว่าตัวแท่งเสมอ -->
      <g>
        <rect
          v-for="bar in bars"
          :key="`hit-${bar.point.key}`"
          :x="bar.bandX"
          :y="PAD.top"
          :width="band"
          :height="plot.height"
          fill="transparent"
          tabindex="0"
          class="hit"
          :aria-label="`${bar.point.fullLabel}: ${bar.point.value} ${unit}`"
          @pointerenter="hovered = bar.index"
          @pointerleave="hovered = null"
          @focus="hovered = bar.index"
          @blur="hovered = null"
        />
      </g>
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

.peak-label {
  font-size: 12px;
  font-weight: 600;
  fill: var(--text-primary);
}

.divider-label {
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
