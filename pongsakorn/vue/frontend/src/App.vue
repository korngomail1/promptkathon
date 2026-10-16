<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AreaSelector from '@/components/AreaSelector.vue';
import { useTheme } from '@/composables/useTheme';
import { formatClock, formatRelativeTime } from '@/composables/format';
import { useFloodStore } from '@/stores/flood';
import { useLocationStore } from '@/stores/location';

const locationStore = useLocationStore();
const floodStore = useFloodStore();
const { theme, toggle } = useTheme();

/** บังคับให้ข้อความ "อัปเดตเมื่อ…" คำนวณใหม่ทุกนาที */
const tick = ref(0);
let clock: ReturnType<typeof setInterval> | undefined;
let refresher: ReturnType<typeof setInterval> | undefined;

const freshness = computed(() => {
  void tick.value;
  return formatRelativeTime(floodStore.lastFetchedAt);
});

watch(
  () => locationStore.selected,
  (location) => void floodStore.load(location),
  { immediate: true, deep: true },
);

onMounted(() => {
  void locationStore.loadPresets();
  clock = setInterval(() => (tick.value += 1), 30_000);
  // ข้อมูลฝนรายชั่วโมงเปลี่ยนไม่บ่อย รีเฟรชทุก 10 นาทีก็พอ
  refresher = setInterval(() => void floodStore.load(locationStore.selected), 600_000);
});

onBeforeUnmount(() => {
  clearInterval(clock);
  clearInterval(refresher);
});
</script>

<template>
  <div class="shell">
    <header class="header">
      <div class="header__inner">
        <div class="brand">
          <span class="brand__mark" aria-hidden="true">🌊</span>
          <div>
            <p class="brand__title">ระบบแจ้งเตือนภัยน้ำท่วม</p>
            <p class="brand__subtitle">ตรวจความเสี่ยงน้ำท่วมและปริมาณฝนในพื้นที่ของคุณ</p>
          </div>
        </div>

        <div class="header__tools">
          <AreaSelector />
          <button
            type="button"
            class="icon-button"
            :aria-label="theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'"
            @click="toggle"
          >
            {{ theme === 'dark' ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>

      <nav class="tabs" aria-label="เมนูหลัก">
        <RouterLink to="/" class="tab">หน้าแจ้งเตือน</RouterLink>
        <RouterLink to="/rainfall" class="tab">แดชบอร์ดน้ำฝน</RouterLink>
      </nav>
    </header>

    <main class="main">
      <p v-if="freshness" class="freshness">
        อัปเดต {{ formatClock(floodStore.lastFetchedAt) }} น. ({{ freshness }})
        <span v-if="floodStore.loading" class="freshness__loading"> · กำลังรีเฟรช…</span>
      </p>

      <!-- ระหว่างรีเฟรช ให้คงกราฟเดิมไว้แบบจาง ๆ ไม่ให้หน้ากระโดด -->
      <div :class="{ 'main__content--refreshing': floodStore.loading && !floodStore.initialLoad }">
        <RouterView />
      </div>
    </main>

    <footer class="footer">
      <p>
        แหล่งข้อมูล:
        <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a>
        (พยากรณ์ฝน ECMWF/GFS) และ
        <a href="https://open-meteo.com/en/docs/flood-api" target="_blank" rel="noopener">
          GloFAS v4
        </a>
        (อัตราการไหลของลำน้ำ จาก Copernicus)
      </p>
      <p class="footer__disclaimer">
        ระบบนี้เป็นเครื่องมือช่วยประเมินเบื้องต้นจากแบบจำลองพยากรณ์ ไม่ใช่ประกาศเตือนภัยทางการ —
        กรณีฉุกเฉินโทร 1784 (ปภ.) หรือติดตามประกาศจากกรมป้องกันและบรรเทาสาธารณภัย
      </p>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--page);
  border-bottom: 1px solid var(--border);
}

.header__inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 16px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand__mark {
  font-size: 24px;
}

.brand__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.brand__subtitle {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.header__tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  font-size: 16px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 999px;
}

.tabs {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  gap: 4px;
}

.tab {
  padding: 8px 14px 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-bottom: 2px solid transparent;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.router-link-active {
  color: var(--text-primary);
  border-bottom-color: var(--series-1);
}

.main {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 18px 16px 40px;
}

.freshness {
  margin: 0 0 12px;
  font-size: 12.5px;
  color: var(--text-muted);
}

.freshness__loading {
  color: var(--series-1);
}

.main__content--refreshing {
  opacity: 0.55;
  transition: opacity 0.2s ease;
}

.footer {
  border-top: 1px solid var(--border);
  padding: 18px 16px 28px;
}

.footer p {
  max-width: 1080px;
  margin: 0 auto 6px;
  font-size: 12.5px;
  color: var(--text-muted);
}

.footer__disclaimer {
  line-height: 1.6;
}

@media (max-width: 680px) {
  .header__inner {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .header__tools {
    width: 100%;
  }

  .header__tools :deep(.selector) {
    flex: 1;
    min-width: 0;
  }
}
</style>
