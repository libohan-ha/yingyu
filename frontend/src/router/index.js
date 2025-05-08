import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/input'
  },
  {
    path: '/input',
    name: 'Input',
    component: () => import('../views/InputView.vue'),
    meta: { title: '输入单词' }
  },
  {
    path: '/article-input',
    name: 'ArticleInput',
    component: () => import('../views/ArticleInputView.vue'),
    meta: { title: '文章输入' }
  },
  {
    path: '/words-display',
    name: 'WordsDisplay',
    component: () => import('../views/WordsDisplayView.vue'),
    meta: { title: '单词列表' }
  },
  {
    path: '/article-display',
    name: 'ArticleDisplay',
    component: () => import('../views/ArticleDisplayView.vue'),
    meta: { title: '阅读文章' }
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('../views/ReviewView.vue'),
    meta: { title: '单词复习' }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/HistoryView.vue'),
    meta: { title: '历史记录' }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('../views/NotesView.vue'),
    meta: { title: '学习笔记' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Update document title based on route meta
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} | AI 英语单词学习` : 'AI 英语单词学习'
  next()
})

export default router
