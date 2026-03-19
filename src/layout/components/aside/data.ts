export const MenuData = [
  // 1. 最顶层：原来是推荐，现在改成【AI 创作】
  {
    title: '',
    children: [
      {
        title: 'AI 创作',
        icon: 'ri:magic-line', // 魔棒图标
        router: '/ai', // 对应生成页面
      },
    ],
  },

  // 2. 发现栏目：第一项改成【社区】
  {
    title: '发现',
    children: [
      { title: '曲库', icon: 'ri:music-2-line', router: '/library' },
      { title: '每日推荐', icon: 'ri:calendar-2-line', router: '/daily' },
      { title: '曲风', icon: 'ri:price-tag-3-line', router: '/genre' },
      { title: '歌手', icon: 'ri:user-star-line', router: '/artist' },
      { title: '歌单', icon: 'ri:album-line', router: '/playlist' },
      {
        title: '社区',
        icon: 'ri:discuss-line',
        router: '/community',
      },
    ],
  },

  // 3. 我的
  {
    title: '我的',
    children: [
      { title: '喜欢', icon: 'ri:heart-line', router: '/like' },
      { title: '收藏歌单', icon: 'ri:album-fill', router: '/favorite-playlists' },
      { title: '个人中心', icon: 'mi:user', router: '/user' },
    ],
  },
]
