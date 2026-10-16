<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string;
    unit?: string;
    /** บริบทใต้ตัวเลข เช่น ช่วงเวลาที่เทียบ */
    context?: string;
    /** 12 จุดล่าสุดสำหรับ sparkline */
    trend?: number[];
    accent?: boolean;
  }>(),
  { unit: '', context: '', trend: () => [], accent: false },
);

const W = 92;
const H = 26;

/** sparkline เป็น polyline ธรรมดา — ไม่มีแกน ไม่มีป้าย ตัวเลขด้านบนคือพระเอก */
const sparkline = computed(() => {
  const points = props.trend;
  if (points.length < 2) return '';
  const max = Math.max(...points, 0.1);
  const step = W / (points.length - 1);
  return points
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${index * step} ${H - (value / max) * (H - 3) - 1.5}`)
    .join(' ');
});
</script>

<template>
  <div class="card tile">
    <p class="tile__label">{{ label }}</p>
    <p class="tile__value">
      {{ value }}<span v-if="unit" class="tile__unit">{{ unit }}</span>
    </p>
    <p v-if="context" class="tile__context">{{ context }}</p>
    <svg
      v-if="sparkline"
      class="tile__spark"
      :width="W"
      :height="H"
      :viewBox="`0 0 ${W} ${H}`"
      aria-hidden="true"
    >
      <path
        :d="sparkline"
        fill="none"
        :stroke="accent ? 'var(--series-2)' : 'var(--series-1)'"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.tile {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tile__label {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.tile__value {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--text-primary);
}

.tile__unit {
  margin-left: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.tile__context {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.tile__spark {
  margin-top: 8px;
  display: block;
}
</style>
