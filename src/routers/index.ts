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
    {
      path: '/favorite-playlists',
      component: () => import('@/pages/favorite-playlists/index.vue'),
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
      path: '/community/drafts',
      name: 'CommunityDrafts',
      component: () => import('@/pages/community/drafts.vue'),
      meta: { title: '我的草稿' },
    },
    {
      path: '/community/favorite',
      name: 'CommunityFavorite',
      component: () => import('@/pages/community/favorite/index.vue'),
      meta: { title: '我的收藏' },
    },
    {
      path: '/community/tags',
      name: 'CommunityTags',
      component: () => import('@/pages/community/tags.vue'),
      meta: { title: '标签广场' },
    },
    {
      path: '/community/edit/:id',
      name: 'CommunityEdit',
      component: () => import('@/pages/community/create.vue'),
      meta: { title: '编辑帖子' },
    },
    {
      path: '/community/user/:id',
      name: 'CommunityUserProfile',
      component: () => import('@/pages/community/user/[id].vue'),
      meta: { title: '用户主页' },
    },
    {
      path: '/community/user/:id/following',
      name: 'CommunityUserFollowing',
      component: () => import('@/pages/community/user/[id]/following.vue'),
      meta: { title: '关注列表' },
    },
    {
      path: '/community/user/:id/followers',
      name: 'CommunityUserFollowers',
      component: () => import('@/pages/community/user/[id]/followers.vue'),
      meta: { title: '粉丝列表' },
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

    // 积分中心路由
    {
      path: '/points',
      name: 'Points',
      component: () => import('@/pages/points/index.vue'),
      meta: { title: '积分中心' },
    },

    // 积分商城路由
    {
      path: '/mall',
      name: 'Mall',
      component: () => import('@/pages/mall/index.vue'),
      meta: { title: '积分商城' },
    },

    // 每日推荐路由
    {
      path: '/daily',
      name: 'Daily',
      component: () => import('@/pages/daily/index.vue'),
      meta: { title: '每日推荐' },
    },

    // 曲风分类路由
    {
      path: '/genre',
      name: 'Genre',
      component: () => import('@/pages/genre/index.vue'),
      meta: { title: '曲风分类' },
    },
    {
      path: '/genre/:id',
      name: 'GenreDetail',
      component: () => import('@/pages/genre/[id].vue'),
      meta: { title: '曲风歌曲' },
    },
  ],
})

export default router
