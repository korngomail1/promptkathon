<script setup lang="ts">
/** กล่อง tooltip ลอยเหนือกราฟ — ค่าตัวเลขเด่น ชื่อชุดข้อมูลรอง ตาม interaction spec */
defineProps<{
  visible: boolean;
  x: number;
  y: number;
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}>();
</script>

<template>
  <div
    v-if="visible"
    class="tooltip"
    :style="{ left: `${x}px`, top: `${y}px` }"
    role="status"
    aria-live="polite"
  >
    <p class="tooltip__title">{{ title }}</p>
    <div v-for="row in rows" :key="row.label" class="tooltip__row">
      <span v-if="row.color" class="tooltip__key" :style="{ background: row.color }" />
      <span class="tooltip__value">{{ row.value }}</span>
      <span class="tooltip__label">{{ row.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, -100%);
  min-width: 140px;
  padding: 8px 10px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-card);
  pointer-events: none;
  white-space: nowrap;
}

.tooltip__title {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.tooltip__row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.5;
}

/* line key สั้น ๆ แทนกล่องสี — ที่ความหนาแน่นระดับ tooltip กล่องสีหนักเกินงาน */
.tooltip__key {
  width: 12px;
  height: 2px;
  border-radius: 1px;
  align-self: center;
}

.tooltip__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.tooltip__label {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
