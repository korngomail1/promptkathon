import { onMounted, ref } from 'vue';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'flood-alert:theme';

const theme = ref<Theme>('light');

/** สลับธีมสว่าง/มืด โดยจำค่าที่ผู้ใช้เลือกไว้ และตั้งต้นตามค่าของระบบ */
export function useTheme() {
  function apply(next: Theme): void {
    theme.value = next;
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage ถูกปิดไว้ — ธีมจะไม่ถูกจำข้ามรอบ แต่ยังใช้งานได้ปกติ
    }
  }

  function toggle(): void {
    apply(theme.value === 'dark' ? 'light' : 'dark');
  }

  onMounted(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }

    if (stored === 'light' || stored === 'dark') {
      apply(stored);
    } else {
      apply(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  });

  return { theme, toggle };
}
