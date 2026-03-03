import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'

const mode = import.meta.env.VITE_ROUTER_MODE

const routerMode = {
  hash: () => createWebHashHistory(),
  history: () => createWebHistory(),
}

const router = createRouter({
  history: routerMode[mode](),
  strict: false,
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes: [
    {
      path: '/',
      component: () => import('@/pages/index.vue'),
    },
    {
      path: '/library',
      component: () => import('@/pages/library/index.vue'),
    },
    {
      path: '/artist',
      component: () => import('@/pages/artist/index.vue'),
    },
    {
      path: '/artist/:id',
      component: () => import('@/pages/artist/[id].vue'),
    },
    {
      path: '/playlist',
      component: () => import('@/pages/playlist/index.vue'),
    },
    {
      path: '/playlist/:id',
      component: () => import('@/pages/playlist/[id].vue'),
    },
    {
      path: '/like',
      component: () => import('@/pages/like/index.vue'),
    },
    {
      path: '/user',
      component: () => import('@/pages/user/index.vue'),
    },

    //AI创作页面路由
    {
      path: '/ai',
      name: 'AiCreate',
      component: () => import('@/pages/ai/index.vue'),
      meta: {
        title: 'AI 创作',
      },
    },

    //社区页面路由
    {
      path: '/community',
      name: 'Community',
      component: () => import('@/pages/community/index.vue'),
      meta: { title: '音乐社区' },
    },
    {
      path: '/community/create',
      name: 'CommunityCreate',
      component: () => import('@/pages/community/create.vue'),
      meta: { title: '发布帖子' },
    },
    {
      path: '/community/:id',
      name: 'CommunityDetail',
      component: () => import('@/pages/community/[id].vue'),
      meta: { title: '帖子详情' },
    },

    // 通知页面路由
    {
      path: '/notification',
      name: 'Notification',
      component: () => import('@/pages/notification/index.vue'),
      meta: { title: '我的通知' },
    },
    {
      path: '/notification/:id',
      name: 'NotificationDetail',
      component: () => import('@/pages/notification/[id].vue'),
      meta: { title: '通知详情' },
    },
  ],
})

export default router
