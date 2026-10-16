<script setup lang="ts">
import { computed } from 'vue';
import type { RiskLevel } from '@/api/types';
import { RISK_META } from '@/composables/format';

const props = defineProps<{ score: number; level: RiskLevel }>();

const SEGMENTS: Array<{ level: RiskLevel; from: number; to: number }> = [
  { level: 'normal', from: 0, to: 25 },
  { level: 'watch', from: 25, to: 50 },
  { level: 'warning', from: 50, to: 75 },
  { level: 'danger', from: 75, to: 100 },
];

const meta = computed(() => RISK_META[props.level]);
const clamped = computed(() => Math.min(Math.max(props.score, 0), 100));
</script>

<template>
  <div class="meter">
    <div
      class="meter__track"
      :style="{ background: meta.wash }"
      role="meter"
      :aria-valuenow="clamped"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`คะแนนความเสี่ยงน้ำท่วม ${clamped} จาก 100 — ระดับ${meta.label}`"
    >
      <div class="meter__fill" :style="{ width: `${clamped}%`, background: meta.color }" />
      <!-- ขีดแบ่งระดับ ให้อ่านได้ว่าคะแนนนี้ตกอยู่ช่วงไหน ไม่ใช่แค่แถบยาว ๆ -->
      <span
        v-for="segment in SEGMENTS.slice(1)"
        :key="segment.level"
        class="meter__divider"
        :style="{ left: `${segment.from}%` }"
      />
    </div>
    <ul class="meter__scale">
      <li
        v-for="segment in SEGMENTS"
        :key="segment.level"
        :class="{ 'meter__scale-item--active': segment.level === level }"
      >
        {{ RISK_META[segment.level].label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.meter {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meter__track {
  position: relative;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
}

.meter__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.meter__divider {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--surface-1);
}

.meter__scale {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 11.5px;
  color: var(--text-muted);
}

.meter__scale li {
  flex: 1;
  text-align: center;
}

.meter__scale li:first-child {
  text-align: left;
}

.meter__scale li:last-child {
  text-align: right;
}

.meter__scale-item--active {
  color: var(--text-primary);
  font-weight: 600;
}
</style>
