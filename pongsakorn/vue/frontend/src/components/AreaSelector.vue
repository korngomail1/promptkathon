<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { LocationRef } from '@/api/types';
import { useLocationStore } from '@/stores/location';

const store = useLocationStore();
const open = ref(false);
const query = ref('');
const root = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

let debounce: ReturnType<typeof setTimeout> | undefined;

watch(query, (value) => {
  clearTimeout(debounce);
  debounce = setTimeout(() => void store.search(value), 300);
});

watch(open, async (isOpen) => {
  if (!isOpen) return;
  void store.loadPresets();
  await nextTick();
  searchInput.value?.focus();
});

function choose(location: LocationRef): void {
  store.select(location);
  open.value = false;
  query.value = '';
}

async function locate(): Promise<void> {
  await store.useDeviceLocation();
  if (!store.error) open.value = false;
}

function describe(location: LocationRef): string {
  return [location.admin1, location.country].filter((part) => part && part !== location.name).join(' · ');
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) open.value = false;
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  clearTimeout(debounce);
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div ref="root" class="selector">
    <button
      type="button"
      class="trigger"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <span class="trigger__pin" aria-hidden="true">📍</span>
      <span class="trigger__text">
        <span class="trigger__caption">พื้นที่ที่คุณอยู่</span>
        <span class="trigger__name">{{ store.label }}</span>
      </span>
      <span class="trigger__chevron" :class="{ 'trigger__chevron--open': open }" aria-hidden="true">
        ▾
      </span>
    </button>

    <div v-if="open" class="panel card" role="dialog" aria-label="เลือกพื้นที่">
      <button type="button" class="locate" :disabled="store.locating" @click="locate">
        <span aria-hidden="true">🎯</span>
        {{ store.locating ? 'กำลังหาตำแหน่ง…' : 'ใช้ตำแหน่งปัจจุบันของฉัน' }}
      </button>

      <label class="search">
        <span class="sr-only">ค้นหาชื่อพื้นที่</span>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          placeholder="ค้นหาอำเภอ จังหวัด หรือเมือง…"
          autocomplete="off"
        />
      </label>

      <p v-if="store.error" class="message message--error" role="alert">{{ store.error }}</p>
      <p v-else-if="store.searching" class="message">กำลังค้นหา…</p>
      <p v-else-if="query.trim().length >= 2 && store.results.length === 0" class="message">
        ไม่พบพื้นที่ที่ตรงกับ “{{ query }}” — ลองพิมพ์เป็นภาษาอังกฤษดู
      </p>

      <ul v-if="store.results.length > 0" class="results">
        <li v-for="item in store.results" :key="item.id">
          <button type="button" class="result" @click="choose(item)">
            <span class="result__name">{{ item.name }}</span>
            <span class="result__meta">{{ describe(item) }}</span>
          </button>
        </li>
      </ul>

      <template v-if="store.results.length === 0 && query.trim().length < 2">
        <p class="panel__heading">พื้นที่ยอดนิยม</p>
        <ul class="chips">
          <li v-for="item in store.presets" :key="item.id">
            <button
              type="button"
              class="chip"
              :class="{ 'chip--active': item.name === store.selected.name }"
              @click="choose(item)"
            >
              {{ item.name }}
            </button>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.selector {
  position: relative;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 13px;
  text-align: left;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: var(--shadow-card);
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}

.trigger:hover {
  border-color: var(--axis);
}

.trigger__pin {
  font-size: 16px;
}

.trigger__text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}

.trigger__caption {
  font-size: 11px;
  color: var(--text-muted);
}

.trigger__name {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger__chevron {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.18s ease;
}

.trigger__chevron--open {
  transform: rotate(180deg);
}

.panel {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  width: min(380px, calc(100vw - 32px));
  max-height: 440px;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.locate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: var(--series-1);
  border: none;
  border-radius: var(--radius-sm);
}

.locate:disabled {
  opacity: 0.65;
  cursor: progress;
}

.search input {
  width: 100%;
  padding: 9px 12px;
  font: inherit;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.search input::placeholder {
  color: var(--text-muted);
}

.message {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.message--error {
  color: var(--status-critical);
}

.results {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.result {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.result:hover {
  background: var(--surface-2);
}

.result__name {
  font-size: 14px;
  font-weight: 500;
}

.result__meta {
  font-size: 12px;
  color: var(--text-muted);
}

.panel__heading {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  padding: 5px 11px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--surface-2);
  border: 1px solid transparent;
  border-radius: 999px;
}

.chip:hover {
  border-color: var(--axis);
}

.chip--active {
  color: #fff;
  background: var(--series-1);
}
</style>
