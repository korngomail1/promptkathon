<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RiskFactor } from '@/api/types';
import { useElementWidth } from '@/composables/chart';

const props = defineProps<{ factors: RiskFactor[] }>();

const ROW = 46;
const BAR = 14;
const LABEL_W = 132;
const VALUE_W = 44;

const container = ref<HTMLElement | null>(null);
const width = useElementWidth(container, 520);

const trackWidth = computed(() => Math.max(width.value - LABEL_W - VALUE_W, 60));
const height = computed(() => props.factors.length * ROW);

/** แท่งแนวนอน: ปลายข้อมูลมน 4px ฐานด้านซ้ายเหลี่ยม */
function path(score: number, y: number): string {
  const w = Math.max((score / 100) * trackWidth.value, 0);
  if (w <= 0.5) return '';
  const r = Math.min(4, w);
  const x = LABEL_W;
  return [
    `M ${x} ${y}`,
    `L ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `L ${x + w} ${y + BAR - r}`,
    `Q ${x + w} ${y + BAR} ${x + w - r} ${y + BAR}`,
    `L ${x} ${y + BAR}`,
    'Z',
  ].join(' ');
}

const rows = computed(() =>
  props.factors.map((factor, index) => {
    const y = index * ROW + 16;
    return {
      factor,
      labelY: y + BAR / 2 + 4,
      barY: y,
      detailY: y + BAR + 15,
      path: path(factor.score, y),
      valueX: LABEL_W + Math.max((factor.score / 100) * trackWidth.value, 0) + 8,
    };
  }),
);
</script>

<template>
  <div ref="container" class="factors">
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      aria-label="สัดส่วนของแต่ละปัจจัยที่ทำให้ได้คะแนนความเสี่ยงนี้"
    >
      <g v-for="row in rows" :key="row.factor.key">
        <text :x="0" :y="row.labelY" class="label">{{ row.factor.label }}</text>
        <rect
          :x="LABEL_W"
          :y="row.barY"
          :width="trackWidth"
          :height="BAR"
          rx="4"
          fill="var(--grid)"
        />
        <path v-if="row.path" :d="row.path" fill="var(--series-1)" />
        <text :x="row.valueX" :y="row.labelY" class="value">{{ row.factor.score }}</text>
        <text :x="0" :y="row.detailY" class="detail">{{ row.factor.detail }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.factors {
  width: 100%;
}

svg {
  display: block;
  overflow: visible;
}

.label {
  font-size: 13px;
  font-weight: 500;
  fill: var(--text-primary);
}

.value {
  font-size: 12.5px;
  font-weight: 600;
  fill: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.detail {
  font-size: 11.5px;
  fill: var(--text-muted);
}
</style>
