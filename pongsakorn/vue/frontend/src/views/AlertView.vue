<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import FactorBars from '@/components/FactorBars.vue';
import RiskMeter from '@/components/RiskMeter.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { RAIN_CATEGORY_LABEL, RISK_META, formatDischarge, formatMm } from '@/composables/format';
import { useFloodStore } from '@/stores/flood';
import { useLocationStore } from '@/stores/location';

const floodStore = useFloodStore();
const locationStore = useLocationStore();

const status = computed(() => floodStore.status);
const meta = computed(() => (status.value ? RISK_META[status.value.level] : null));

/** คำตอบตรง ๆ ของคำถาม "พื้นที่นี้น้ำท่วมไหม" */
const verdict = computed(() => {
  if (!status.value) return '';
  return status.value.isFlooding
    ? 'พื้นที่นี้เสี่ยงน้ำท่วม'
    : 'พื้นที่นี้ยังไม่มีสัญญาณน้ำท่วม';
});
</script>

<template>
  <div class="view">
    <p v-if="floodStore.error" class="error card" role="alert">
      {{ floodStore.error }}
      <button type="button" @click="floodStore.load(locationStore.selected)">ลองใหม่</button>
    </p>

    <p v-else-if="floodStore.initialLoad" class="skeleton card">กำลังประเมินความเสี่ยงในพื้นที่…</p>

    <template v-else-if="status && meta">
      <section class="card hero" :style="{ borderColor: meta.color }">
        <div class="hero__top">
          <StatusBadge :level="status.level" size="lg" />
          <p class="hero__place">{{ status.location.name }}</p>
        </div>

        <h2 class="hero__verdict">{{ verdict }}</h2>

        <div class="hero__score">
          <p class="hero__number" :style="{ color: meta.color }">{{ status.score }}</p>
          <div class="hero__meter">
            <p class="hero__scale-label">คะแนนความเสี่ยงน้ำท่วม (0–100)</p>
            <RiskMeter :score="status.score" :level="status.level" />
          </div>
        </div>

        <p class="hero__message">{{ status.message }}</p>

        <p v-for="warning in status.warnings" :key="warning" class="hero__warning">
          <span aria-hidden="true">ℹ️</span> {{ warning }}
        </p>
      </section>

      <div class="grid">
        <section class="card panel">
          <h3 class="panel__title">ทำไมถึงได้ระดับนี้</h3>
          <p class="panel__subtitle">
            คะแนนรวมมาจากปัจจัยด้านล่าง ยิ่งแท่งยาวยิ่งดันความเสี่ยงขึ้น (เต็ม 100 ต่อปัจจัย)
          </p>
          <FactorBars :factors="status.factors" />
          <p class="panel__note">
            น้ำหนักที่ใช้รวมคะแนน:
            <template v-for="(factor, index) in status.factors" :key="factor.key">
              {{ factor.label }} {{ Math.round(factor.weight * 100) }}%<!--
              -->{{ index < status.factors.length - 1 ? ' · ' : '' }}
            </template>
          </p>
        </section>

        <section class="card panel">
          <h3 class="panel__title">สิ่งที่ควรทำตอนนี้</h3>
          <ol class="advice">
            <li v-for="item in status.advice" :key="item">{{ item }}</li>
          </ol>
        </section>
      </div>

      <section class="card panel">
        <h3 class="panel__title">ตัวเลขที่ใช้ประเมิน</h3>
        <dl class="facts">
          <div class="fact">
            <dt>ฝนสะสม 24 ชม. ที่ผ่านมา</dt>
            <dd>{{ formatMm(status.rainfall.past24h) }} มม.</dd>
          </div>
          <div class="fact">
            <dt>พยากรณ์ฝน 24 ชม. ข้างหน้า</dt>
            <dd>{{ formatMm(status.rainfall.next24h) }} มม.</dd>
          </div>
          <div class="fact">
            <dt>ฝนสะสม 7 วัน</dt>
            <dd>{{ formatMm(status.rainfall.past7d) }} มม.</dd>
          </div>
          <div class="fact">
            <dt>ระดับฝนตามเกณฑ์กรมอุตุฯ</dt>
            <dd>{{ RAIN_CATEGORY_LABEL[status.rainfall.category] }}</dd>
          </div>
          <template v-if="status.river.available">
            <div class="fact">
              <dt>อัตราการไหลล่าสุด</dt>
              <dd>{{ formatDischarge(status.river.current) }} {{ status.river.unit }}</dd>
            </div>
            <div class="fact">
              <dt>เกณฑ์น้ำสูงผิดปกติ</dt>
              <dd>{{ formatDischarge(status.river.highThreshold) }} {{ status.river.unit }}</dd>
            </div>
          </template>
        </dl>
        <p class="panel__note">
          ดูกราฟฝนรายชั่วโมงและระดับน้ำย้อนหลังได้ที่
          <RouterLink to="/rainfall">แดชบอร์ดน้ำฝน</RouterLink>
        </p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error,
.skeleton {
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

.hero {
  padding: 22px;
  border-left-width: 4px;
  border-left-style: solid;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero__top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hero__place {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-secondary);
}

.hero__verdict {
  margin: 2px 0 0;
  font-size: 24px;
  font-weight: 700;
}

.hero__score {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* hero figure: หนึ่งเดียวของหน้านี้ */
.hero__number {
  margin: 0;
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.hero__meter {
  flex: 1;
  min-width: 220px;
}

.hero__scale-label {
  margin: 0 0 7px;
  font-size: 12px;
  color: var(--text-muted);
}

.hero__message {
  margin: 6px 0 0;
  font-size: 14.5px;
  line-height: 1.65;
}

.hero__warning {
  margin: 0;
  padding: 9px 12px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  padding: 18px;
}

.panel__title {
  font-size: 16px;
  margin-bottom: 4px;
}

.panel__subtitle {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--text-secondary);
}

.panel__note {
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.advice {
  margin: 10px 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin: 12px 0 0;
}

.fact {
  padding: 11px 13px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.fact dt {
  font-size: 12px;
  color: var(--text-secondary);
}

.fact dd {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 600;
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .hero__number {
    font-size: 48px;
  }
}
</style>
