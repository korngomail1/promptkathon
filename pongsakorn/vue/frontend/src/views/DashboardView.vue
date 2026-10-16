<script setup lang="ts">
import { computed } from 'vue';
import ChartCard from '@/components/ChartCard.vue';
import ColumnChart, { type ColumnPoint } from '@/components/ColumnChart.vue';
import LineChart, { type LinePoint } from '@/components/LineChart.vue';
import StatTile from '@/components/StatTile.vue';
import {
  RAIN_CATEGORY_LABEL,
  formatDate,
  formatDayHour,
  formatDischarge,
  formatFullDate,
  formatHour,
  formatMm,
} from '@/composables/format';
import { useFloodStore } from '@/stores/flood';
import { useLocationStore } from '@/stores/location';

const floodStore = useFloodStore();
const locationStore = useLocationStore();

const report = computed(() => floodStore.rainfall);
const river = computed(() => floodStore.status?.river ?? null);

const hourlyPoints = computed<ColumnPoint[]>(
  () =>
    report.value?.hourly.map((point) => ({
      key: point.time,
      label: formatHour(point.time),
      fullLabel: formatDayHour(point.time),
      value: point.precipitation,
      forecast: point.isForecast,
      extra:
        point.probability !== null
          ? { label: 'โอกาสมีฝน', value: `${point.probability}%` }
          : undefined,
    })) ?? [],
);

const dailyPoints = computed<ColumnPoint[]>(
  () =>
    report.value?.daily.map((point) => ({
      key: point.date,
      label: formatDate(point.date),
      fullLabel: formatFullDate(point.date),
      value: point.precipitationSum,
      forecast: point.isForecast,
      extra:
        point.probabilityMax !== null
          ? { label: 'โอกาสมีฝนสูงสุด', value: `${point.probabilityMax}%` }
          : undefined,
    })) ?? [],
);

const riverPoints = computed<LinePoint[]>(
  () =>
    river.value?.series
      .filter((point) => point.discharge !== null)
      .map((point) => ({
        key: point.date,
        label: formatDate(point.date),
        fullLabel: formatFullDate(point.date),
        value: point.discharge as number,
        forecast: point.isForecast,
      })) ?? [],
);

const riverReferences = computed(() => {
  const r = river.value;
  if (!r?.available || r.highThreshold === null || r.seasonalNormal === null) return [];
  return [
    { value: r.highThreshold, label: 'เกณฑ์น้ำสูง' },
    { value: r.seasonalNormal, label: 'ระดับปกติ' },
  ];
});

const RAIN_LEGEND = [
  { label: 'ตรวจวัดแล้ว', color: 'var(--series-1)', shape: 'rect' as const },
  { label: 'พยากรณ์', color: 'var(--series-2)', shape: 'rect' as const },
];

const RIVER_LEGEND = [
  { label: 'ตรวจวัดแล้ว', color: 'var(--series-1)', shape: 'line' as const },
  { label: 'พยากรณ์', color: 'var(--series-2)', shape: 'line' as const },
];

const hourlyTable = computed(() => ({
  columns: ['เวลา', 'ปริมาณฝน (มม.)', 'โอกาสมีฝน', 'ประเภท'],
  rows:
    report.value?.hourly.map((point) => [
      formatDayHour(point.time),
      formatMm(point.precipitation),
      point.probability !== null ? `${point.probability}%` : '—',
      point.isForecast ? 'พยากรณ์' : 'ตรวจวัดแล้ว',
    ]) ?? [],
}));

const dailyTable = computed(() => ({
  columns: ['วันที่', 'ฝนรวม (มม.)', 'โอกาสมีฝนสูงสุด', 'ชั่วโมงที่มีฝน'],
  rows:
    report.value?.daily.map((point) => [
      formatFullDate(point.date),
      formatMm(point.precipitationSum),
      point.probabilityMax !== null ? `${point.probabilityMax}%` : '—',
      point.precipitationHours !== null ? `${point.precipitationHours} ชม.` : '—',
    ]) ?? [],
}));

const riverTable = computed(() => ({
  columns: ['วันที่', `อัตราการไหล (${river.value?.unit ?? 'm³/s'})`, 'ประเภท'],
  rows: riverPoints.value.map((point) => [
    point.fullLabel,
    formatDischarge(point.value),
    point.forecast ? 'พยากรณ์' : 'ตรวจวัดแล้ว',
  ]),
}));

/** 12 ชั่วโมงล่าสุดและ 12 ชั่วโมงข้างหน้า สำหรับ sparkline บน stat tile */
const pastSpark = computed(() =>
  (report.value?.hourly.filter((p) => !p.isForecast) ?? []).slice(-12).map((p) => p.precipitation),
);
const futureSpark = computed(() =>
  (report.value?.hourly.filter((p) => p.isForecast) ?? []).slice(0, 12).map((p) => p.precipitation),
);
const dailySpark = computed(() => report.value?.daily.map((p) => p.precipitationSum) ?? []);
</script>

<template>
  <div class="view">
    <p v-if="floodStore.error" class="error card" role="alert">
      {{ floodStore.error }}
      <button type="button" @click="floodStore.load(locationStore.selected)">ลองใหม่</button>
    </p>

    <p v-else-if="floodStore.initialLoad" class="skeleton card">กำลังโหลดข้อมูลปริมาณน้ำฝน…</p>

    <template v-else-if="report">
      <div class="kpi">
        <StatTile
          label="ฝนสะสม 24 ชม. ที่ผ่านมา"
          :value="formatMm(report.summary.past24h)"
          unit="มม."
          :context="RAIN_CATEGORY_LABEL[report.summary.category]"
          :trend="pastSpark"
        />
        <StatTile
          label="พยากรณ์ฝน 24 ชม. ข้างหน้า"
          :value="formatMm(report.summary.next24h)"
          unit="มม."
          :context="
            report.summary.peakHourNext24h
              ? `หนักสุด ${formatMm(report.summary.maxHourlyNext24h)} มม. เวลา ${formatHour(report.summary.peakHourNext24h)}`
              : 'ไม่มีช่วงฝนหนัก'
          "
          :trend="futureSpark"
          accent
        />
        <StatTile
          label="ฝนสะสม 7 วันที่ผ่านมา"
          :value="formatMm(report.summary.past7d)"
          unit="มม."
          context="ตัวชี้ว่าดินอุ้มน้ำไว้มากแค่ไหน"
          :trend="dailySpark"
        />
        <StatTile
          v-if="river?.available"
          label="อัตราการไหลของลำน้ำ"
          :value="formatDischarge(river.current)"
          :unit="river.unit"
          :context="`${Math.round((river.ratio ?? 0) * 100)}% ของเกณฑ์น้ำสูงผิดปกติ`"
        />
        <StatTile
          v-else
          label="พยากรณ์ฝน 7 วันข้างหน้า"
          :value="formatMm(report.summary.next7d)"
          unit="มม."
          context="รวมทุกวันในช่วงพยากรณ์"
          accent
        />
      </div>

      <ChartCard
        title="ปริมาณฝนรายชั่วโมง"
        subtitle="ย้อนหลัง 24 ชั่วโมง และพยากรณ์ล่วงหน้า 24 ชั่วโมง"
        :legend="RAIN_LEGEND"
        :table="hourlyTable"
      >
        <ColumnChart
          :points="hourlyPoints"
          unit="มม."
          ariaLabel="กราฟแท่งปริมาณฝนรายชั่วโมง ย้อนหลังและพยากรณ์อย่างละ 24 ชั่วโมง"
        />
        <template #footnote>
          เลื่อนเมาส์หรือกด Tab บนแท่งเพื่อดูค่าแต่ละชั่วโมง · เวลาตามเขตเวลา {{ report.timezone }}
        </template>
      </ChartCard>

      <ChartCard
        title="ปริมาณฝนรายวัน"
        subtitle="ย้อนหลัง 3 วัน และพยากรณ์ล่วงหน้า 7 วัน"
        :legend="RAIN_LEGEND"
        :table="dailyTable"
      >
        <ColumnChart
          :points="dailyPoints"
          unit="มม."
          divider-label="วันนี้"
          ariaLabel="กราฟแท่งปริมาณฝนรวมรายวัน ย้อนหลัง 3 วันและพยากรณ์ 7 วัน"
        />
      </ChartCard>

      <ChartCard
        v-if="river?.available && riverPoints.length > 1"
        title="อัตราการไหลของน้ำในลำน้ำ"
        subtitle="ย้อนหลัง 92 วัน และพยากรณ์ล่วงหน้า 7 วัน จากแบบจำลอง GloFAS"
        :legend="RIVER_LEGEND"
        :table="riverTable"
      >
        <LineChart
          :points="riverPoints"
          :unit="river.unit"
          :references="riverReferences"
          ariaLabel="กราฟเส้นอัตราการไหลของน้ำในลำน้ำ ย้อนหลัง 92 วันและพยากรณ์ 7 วัน"
        />
        <template #footnote>
          “เกณฑ์น้ำสูง” คือเปอร์เซ็นไทล์ที่ 90 ของ 92 วันล่าสุด · “ระดับปกติ” คือค่ามัธยฐานช่วงเดียวกัน
        </template>
      </ChartCard>

      <p v-else class="note card">
        พิกัดนี้ไม่มีข้อมูลลำน้ำในแบบจำลอง GloFAS (ครอบคลุมเฉพาะลำน้ำสายหลัก)
        แดชบอร์ดจึงแสดงเฉพาะข้อมูลฝน
      </p>
    </template>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.error,
.skeleton,
.note {
  padding: 18px;
  font-size: 14px;
  color: var(--text-secondary);
}

.error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--status-critical);
}

.error button {
  padding: 5px 12px;
  color: var(--text-primary);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
</style>
