import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'alert',
      component: () => import('@/views/AlertView.vue'),
      meta: { title: 'แจ้งเตือนน้ำท่วม' },
    },
    {
      path: '/rainfall',
      name: 'rainfall',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'แดชบอร์ดปริมาณน้ำฝน' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'ระบบแจ้งเตือนภัยน้ำท่วม'} · ระบบแจ้งเตือนภัยน้ำท่วม`;
});

export default router;
