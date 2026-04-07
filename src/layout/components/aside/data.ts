export const MenuData = [
  // 顶部快捷入口
  {
    title: '',
    children: [
      {
        title: '首页',
        icon: 'ri:home-5-line',
        router: '/',
      },
    ],
  },

  // 发现
  {
    title: '发现',
    children: [
      { title: '曲库', icon: 'ri:music-2-line', router: '/library' },
      { title: '每日推荐', icon: 'ri:calendar-2-line', router: '/daily' },
      { title: '曲风', icon: 'ri:price-tag-3-line', router: '/genre' },
      { title: '歌手', icon: 'ri:user-star-line', router: '/artist' },
      { title: '歌单', icon: 'ri:album-line', router: '/playlist' },
      { title: '社区', icon: 'ri:discuss-line', router: '/community' },
      { title: 'AI 创作', icon: 'ri:magic-line', router: '/ai' },
    ],
  },

  // 我的
  {
    title: '我的',
    children: [
      { title: '喜欢', icon: 'ri:heart-line', router: '/like' },
      { title: '收藏歌单', icon: 'ri:album-fill', router: '/favorite-playlists' },
      { title: '个人中心', icon: 'mi:user', router: '/user' },
    ],
  },
]
