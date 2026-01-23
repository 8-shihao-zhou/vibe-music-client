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
      // 👇 新增的社区入口
      {
        title: '社区',
        icon: 'ri:discuss-line', // 讨论/社区图标
        router: '/community', // 对应新做的社区页面
      },

      // 原有的其他菜单
      { title: '曲库', icon: 'ri:music-2-line', router: '/library' },
      { title: '歌手', icon: 'ri:user-star-line', router: '/artist' },
      { title: '歌单', icon: 'ri:album-line', router: '/playlist' },
    ],
  },

  // 3. 我的
  {
    title: '我的',
    children: [
      { title: '喜欢', icon: 'ri:heart-line', router: '/like' },
      { title: '个人中心', icon: 'mi:user', router: '/user' },
    ],
  },
]
