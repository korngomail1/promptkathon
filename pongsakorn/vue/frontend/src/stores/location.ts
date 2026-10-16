import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { api } from '@/api/client';
import type { LocationRef } from '@/api/types';

const STORAGE_KEY = 'flood-alert:selected-location';

/** กรุงเทพฯ เป็นค่าตั้งต้นเมื่อยังไม่เคยเลือกพื้นที่และยังไม่ได้ให้สิทธิ์ตำแหน่ง */
const DEFAULT_LOCATION: LocationRef = {
  id: 'th-bangkok',
  name: 'กรุงเทพมหานคร',
  admin1: 'กรุงเทพมหานคร',
  country: 'ไทย',
  latitude: 13.7563,
  longitude: 100.5018,
};

function readStored(): LocationRef | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationRef;
    return typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export const useLocationStore = defineStore('location', () => {
  const selected = ref<LocationRef>(readStored() ?? DEFAULT_LOCATION);
  const presets = ref<LocationRef[]>([]);
  const results = ref<LocationRef[]>([]);
  const searching = ref(false);
  const locating = ref(false);
  const error = ref<string | null>(null);
  /** true เมื่อพิกัดมาจาก GPS ของเครื่อง ไม่ใช่การเลือกจากรายการ */
  const usingDeviceLocation = ref(false);

  const label = computed(() => {
    const { name, admin1 } = selected.value;
    return admin1 && admin1 !== name ? `${name}, ${admin1}` : name;
  });

  watch(
    selected,
    (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // โหมดส่วนตัวหรือปิด storage ไว้ — ไม่ใช่เรื่องคอขาดบาดตาย ข้ามไป
      }
    },
    { deep: true },
  );

  async function loadPresets(): Promise<void> {
    if (presets.value.length > 0) return;
    try {
      presets.value = await api.presets();
    } catch {
      presets.value = [DEFAULT_LOCATION];
    }
  }

  async function search(query: string): Promise<void> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      results.value = [];
      return;
    }
    searching.value = true;
    error.value = null;
    try {
      results.value = await api.searchLocations(trimmed);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'ค้นหาพื้นที่ไม่สำเร็จ';
      results.value = [];
    } finally {
      searching.value = false;
    }
  }

  function select(location: LocationRef): void {
    selected.value = location;
    usingDeviceLocation.value = false;
    results.value = [];
    error.value = null;
  }

  /** ปุ่ม "ใช้ตำแหน่งปัจจุบัน" — ขอพิกัดจากเบราว์เซอร์แล้วแปลงเป็นชื่อพื้นที่ */
  async function useDeviceLocation(): Promise<void> {
    if (!('geolocation' in navigator)) {
      error.value = 'เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง';
      return;
    }

    locating.value = true;
    error.value = null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 300_000,
        });
      });

      const { latitude, longitude } = position.coords;
      selected.value = await api.reverseGeocode(latitude, longitude);
      usingDeviceLocation.value = true;
      results.value = [];
    } catch (e) {
      error.value = describeGeolocationError(e);
    } finally {
      locating.value = false;
    }
  }

  return {
    selected,
    presets,
    results,
    searching,
    locating,
    error,
    usingDeviceLocation,
    label,
    loadPresets,
    search,
    select,
    useDeviceLocation,
  };
});

function describeGeolocationError(error: unknown): string {
  if (typeof GeolocationPositionError !== 'undefined' && error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง — เลือกพื้นที่จากรายการแทนได้';
      case error.POSITION_UNAVAILABLE:
        return 'ระบุตำแหน่งไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง';
      case error.TIMEOUT:
        return 'ระบุตำแหน่งนานเกินไป ลองใหม่อีกครั้ง';
    }
  }
  return error instanceof Error ? error.message : 'ระบุตำแหน่งไม่สำเร็จ';
}
