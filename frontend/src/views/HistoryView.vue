<template>
  <div class="history-view">
    <h2>学习历史记录</h2>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="card">
      <div class="loading-center">
        <div class="loading-spinner"></div>
        <p class="mt-2">加载历史记录中...</p>
      </div>
    </div>

    <!-- 无历史记录提示 -->
    <div v-else-if="sessions.length === 0 && records.length === 0" class="card">
      <div class="empty-state">
        <p>还没有历史学习记录。</p>
        <router-link to="/input" class="btn btn-primary">返回输入页面</router-link>
      </div>
    </div>

    <!-- MongoDB 历史记录 -->
    <div v-if="records.length > 0" class="history-section">
      <h3>数据库存储记录</h3>
      <div class="history-list">
        <div class="card history-card" v-for="record in records" :key="record._id" @click="viewRecord(record)">
          <div class="session-date">{{ formatDate(record.createdAt) }}</div>
          <div class="session-info">
            <h4>{{ record.words[0] }}{{ record.words.length > 1 ? ` 等 ${record.words.length} 个单词` : '' }}</h4>
            <p class="session-preview" v-if="record.englishText">{{ truncateText(record.englishText, 100) }}</p>
          </div>
          <div class="session-action">
            <span class="view-link">查看详情 &rarr;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 本地存储历史记录 -->
    <div v-if="sessions.length > 0" class="history-section mt-4">
      <h3>本地存储历史记录</h3>
      <div class="history-list">
        <div class="card history-card" v-for="session in sessions" :key="session.sessionId" @click="viewSession(session.sessionId)">
          <div class="session-date">{{ formatDate(session.date) }}</div>
          <div class="session-info">
            <h4>{{ session.firstWord }}{{ session.wordCount > 1 ? ` 等 ${session.wordCount} 个单词` : '' }}</h4>
            <p class="session-preview" v-if="session.previewText">{{ session.previewText }}</p>
          </div>
          <div class="session-action">
            <span class="view-link">查看详情 &rarr;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="alert alert-danger mt-3">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useLearningStore } from '../store/learningStore'
import { getAllStudyRecords } from '../services/studyRecordService'

const router = useRouter()
const learningStore = useLearningStore()

// 状态
const sessions = ref([])
const records = ref([])
const isLoading = ref(false)
const error = ref('')

// 格式化日期
const formatDate = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  return new Date(dateString).toLocaleString('zh-CN', options)
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// 加载历史记录
const loadHistory = async () => {
  isLoading.value = true
  error.value = ''

  try {
    // 加载本地存储的历史记录
    const localResponse = await axios.get('/api/history')
    sessions.value = localResponse.data

    // 加载 MongoDB 中的学习记录
    const dbRecords = await getAllStudyRecords()
    records.value = dbRecords
  } catch (err) {
    error.value = '加载历史记录失败，请稍后重试。'
    console.error('加载历史记录错误:', err)
  } finally {
    isLoading.value = false
  }
}

// 查看特定会话
const viewSession = async (sessionId) => {
  try {
    isLoading.value = true

    // 通过 store 加载会话数据
    await learningStore.loadSessionData(sessionId)

    // 加载成功后跳转到文章页面
    router.push('/article-display')
  } catch (err) {
    error.value = '加载会话数据失败，请稍后重试。'
    console.error('加载会话数据错误:', err)
  } finally {
    isLoading.value = false
  }
}

// 查看 MongoDB 中的记录
const viewRecord = async (record) => {
  try {
    isLoading.value = true

    // 设置学习数据到 store
    learningStore.setInputWords(record.words)

    if (record.englishText) {
      learningStore.setArticleEn(record.englishText)
    }

    if (record.chineseText) {
      learningStore.setArticleZh(record.chineseText)
    }

    // 生成单词释义（如果没有的话）
    if (Object.keys(learningStore.wordMeanings).length === 0) {
      // 这里可以调用 API 获取单词释义，或者暂时使用空对象
      const meanings = {}
      record.words.forEach(word => {
        meanings[word] = '(从数据库加载，暂无释义)'
      })
      learningStore.setWordMeanings(meanings)
    }

    // 跳转到文章页面
    router.push('/article-display')
  } catch (err) {
    error.value = '加载记录数据失败，请稍后重试。'
    console.error('加载记录数据错误:', err)
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-view {
  max-width: 800px;
  margin: 0 auto;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

.history-list {
  margin-top: 1rem;
}

.history-section {
  margin-bottom: 2rem;
}

.mt-4 {
  margin-top: 2rem;
}

.history-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.session-date {
  font-size: 0.9rem;
  color: #777;
  width: 25%;
}

.session-info {
  flex: 1;
}

.session-preview {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.session-action {
  margin-left: 1rem;
}

.view-link {
  color: #3498db;
  font-weight: 600;
}

.history-card:hover .view-link {
  text-decoration: underline;
}
</style>
