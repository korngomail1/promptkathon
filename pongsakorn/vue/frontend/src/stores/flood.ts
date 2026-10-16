import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '@/api/client';
import type { FloodStatus, LocationRef, RainfallReport } from '@/api/types';

export const useFloodStore = defineStore('flood', () => {
  const status = ref<FloodStatus | null>(null);
  const rainfall = ref<RainfallReport | null>(null);
  const loading = ref(false);
  /** true เฉพาะตอนโหลดรอบแรก — ใช้แยกสเกเลตันออกจากการรีเฟรช */
  const initialLoad = ref(true);
  const error = ref<string | null>(null);
  const lastFetchedAt = ref<Date | null>(null);

  /** กันไม่ให้คำขอเก่าที่กลับมาช้าเขียนทับผลของพื้นที่ที่เลือกใหม่ */
  let requestToken = 0;

  const hasData = computed(() => status.value !== null && rainfall.value !== null);

  async function load(location: LocationRef): Promise<void> {
    const token = ++requestToken;
    loading.value = true;
    error.value = null;

    try {
      const [nextStatus, nextRainfall] = await Promise.all([
        api.floodStatus(location.latitude, location.longitude, location.name),
        api.rainfall(location.latitude, location.longitude, location.name),
      ]);

      if (token !== requestToken) return;

      status.value = nextStatus;
      rainfall.value = nextRainfall;
      lastFetchedAt.value = new Date();
    } catch (e) {
      if (token !== requestToken) return;
      error.value = e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ';
    } finally {
      if (token === requestToken) {
        loading.value = false;
        initialLoad.value = false;
      }
    }
  }

  return { status, rainfall, loading, initialLoad, error, lastFetchedAt, hasData, load };
});
