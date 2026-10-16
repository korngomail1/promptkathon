<script setup lang="ts">
import { computed } from 'vue';
import type { RiskLevel } from '@/api/types';
import { RISK_META } from '@/composables/format';

const props = withDefaults(defineProps<{ level: RiskLevel; size?: 'sm' | 'lg' }>(), { size: 'sm' });
const meta = computed(() => RISK_META[props.level]);
</script>

<template>
  <!-- สีสถานะมาคู่กับไอคอนและข้อความเสมอ ห้ามให้สีสื่อความหมายลำพัง -->
  <span
    class="badge"
    :class="`badge--${size}`"
    :style="{ background: meta.wash, color: meta.color }"
  >
    <span class="badge__icon" aria-hidden="true">{{ meta.icon }}</span>
    {{ meta.label }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}

.badge--sm {
  padding: 3px 11px;
  font-size: 13px;
}

.badge--lg {
  padding: 6px 15px;
  font-size: 15px;
}

.badge__icon {
  font-size: 0.9em;
  line-height: 1;
}
</style>
