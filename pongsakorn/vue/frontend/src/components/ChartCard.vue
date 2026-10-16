<script setup lang="ts">
import { ref } from 'vue';

export interface LegendItem {
  label: string;
  color: string;
  /** rect สำหรับแท่ง/พื้นที่, line สำหรับเส้น — ให้ legend สะท้อนรูปร่างของ mark จริง */
  shape?: 'rect' | 'line';
}

export interface TableSpec {
  columns: string[];
  rows: string[][];
}

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    legend?: LegendItem[];
    table?: TableSpec;
  }>(),
  { legend: () => [], subtitle: '' },
);

const showTable = ref(false);
</script>

<template>
  <section class="card chart-card">
    <header class="chart-card__head">
      <div>
        <h3 class="chart-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="chart-card__subtitle">{{ subtitle }}</p>
      </div>
      <button
        v-if="table"
        type="button"
        class="chart-card__toggle"
        :aria-pressed="showTable"
        @click="showTable = !showTable"
      >
        {{ showTable ? 'ดูเป็นกราฟ' : 'ดูเป็นตาราง' }}
      </button>
    </header>

    <!-- legend อยู่ครบเสมอเมื่อมีตั้งแต่ 2 ชุดข้อมูลขึ้นไป ไม่ให้ผู้อ่านต้องเดาจากสีอย่างเดียว -->
    <ul v-if="legend.length > 1 && !showTable" class="legend">
      <li v-for="item in legend" :key="item.label" class="legend__item">
        <span
          class="legend__mark"
          :class="`legend__mark--${item.shape ?? 'rect'}`"
          :style="{ background: item.color }"
        />
        {{ item.label }}
      </li>
    </ul>

    <div v-show="!showTable" class="chart-card__body">
      <slot />
    </div>

    <div v-if="table && showTable" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th v-for="column in table.columns" :key="column" scope="col">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in table.rows" :key="index">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="$slots.footnote" class="chart-card__footnote"><slot name="footnote" /></p>
  </section>
</template>

<style scoped>
.chart-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chart-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chart-card__title {
  font-size: 16px;
}

.chart-card__subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.chart-card__toggle {
  flex-shrink: 0;
  padding: 5px 11px;
  font-size: 12.5px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  transition: background 0.15s ease;
}

.chart-card__toggle:hover {
  background: var(--surface-2);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend__item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.legend__mark--rect {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}

.legend__mark--line {
  width: 16px;
  height: 2px;
  border-radius: 1px;
}

.chart-card__body {
  min-height: 60px;
}

.table-wrap {
  max-height: 320px;
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.table th,
.table td {
  padding: 7px 10px;
  text-align: left;
  border-bottom: 1px solid var(--grid);
  white-space: nowrap;
}

.table th {
  position: sticky;
  top: 0;
  background: var(--surface-1);
  color: var(--text-secondary);
  font-weight: 500;
}

.table td {
  color: var(--text-primary);
}

.chart-card__footnote {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
