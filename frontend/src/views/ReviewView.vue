<template>
  <div class="review-view">
    <h2>文章复习</h2>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="card">
      <div class="loading-center">
        <div class="loading-spinner"></div>
        <p class="mt-2">加载文章记录中...</p>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-else-if="records.length === 0" class="card">
      <div class="empty-state">
        <p>还没有保存的文章可以复习。</p>
        <p class="mt-2">请先在输入页面添加单词并生成学习材料，然后保存到数据库。</p>
        <router-link to="/input" class="btn btn-primary mt-3">去输入单词</router-link>
      </div>
    </div>

    <!-- 文章列表 -->
    <div v-else>
      <div class="article-list">
        <div v-for="record in records" :key="record._id" class="card article-item">
          <div class="article-header">
            <h3>{{ formatArticleTitle(record) }}</h3>
            <span class="article-date">{{ formatDate(record.createdAt) }}</span>
          </div>

          <div class="article-words">
            <strong>单词：</strong>
            <span class="word-tag"
                  v-for="(word, index) in record.words"
                  :key="index"
                  :title="getWordMeaning(record, word)"
                  @click.stop="playWordPronunciation(word)">
              {{ word }}
              <small class="word-sound-icon">🔊</small>
            </span>
          </div>

          <div class="article-preview" @click="viewArticle(record)">
            <p>{{ truncateText(record.englishText, 150) }}</p>
          </div>

          <div class="article-actions">
            <button class="btn btn-primary btn-sm" @click.stop="viewArticle(record)">查看全文</button>
            <button class="btn btn-danger btn-sm ml-2" @click.stop="confirmDelete(record)">删除</button>
          </div>
        </div>
      </div>

      <!-- 操作结果提示 -->
      <div v-if="actionMessage" :class="['alert', actionSuccess ? 'alert-success' : 'alert-danger', 'mt-3']">
        {{ actionMessage }}
      </div>
    </div>

    <!-- 文章详情弹窗 -->
    <div v-if="showArticleModal" class="article-modal-overlay" @click="closeArticleModal">
      <div class="article-modal-content" @click.stop>
        <div class="article-modal-header">
          <h3>{{ formatArticleTitle(selectedArticle) }}</h3>
          <button class="close-button" @click="closeArticleModal">&times;</button>
        </div>

        <div class="article-modal-body">
          <div class="article-container">
            <!-- 英文文章 - 左侧 -->
            <div class="article-section">
              <h4>英文文章</h4>
              <div class="article-content" ref="articleContentRef" v-html="formattedArticle"></div>
            </div>

            <!-- 单词列表 - 右侧 -->
            <div class="article-section">
              <div class="article-section-header">
                <h4>单词列表</h4>
                <button
                  class="review-button"
                  @click="startReviewMode"
                  v-if="!isReviewMode && selectedArticle && ((selectedArticle.wordListText && selectedArticle.wordListText.trim()) || (selectedArticle.words && selectedArticle.words.length > 0))"
                >
                  <i class="fas fa-book"></i> 复习单词
                </button>
              </div>

              <!-- 复习模式 -->
              <div v-if="isReviewMode" class="review-mode">
                <div class="review-header">
                  <span class="review-progress">{{ currentReviewWordIndex + 1 }} / {{ reviewWords.length }}</span>
                  <button class="review-exit-button" @click="exitReviewMode">退出复习</button>
                </div>

                <div class="review-content">
                  <!-- 当前复习的单词 -->
                  <div class="review-word" @click="playWordPronunciation(currentReviewWord.word)">
                    {{ currentReviewWord.word }}
                    <span class="pronunciation-icon-review" title="点击播放发音">🔊</span>
                  </div>

                  <!-- 单词意思（初始隐藏） -->
                  <div v-if="showMeaning" class="review-meaning">
                    {{ currentReviewWord.meaning }}
                  </div>

                  <!-- 复习操作按钮 -->
                  <div class="review-actions">
                    <button
                      v-if="!showMeaning"
                      class="btn btn-secondary"
                      @click="showWordMeaning"
                    >
                      显示意思
                    </button>
                    <button
                      v-if="showMeaning"
                      class="btn btn-success"
                      @click="recordAndNext(true)"
                    >
                      记得
                    </button>
                    <button
                      v-if="showMeaning"
                      class="btn btn-danger"
                      @click="recordAndNext(false)"
                    >
                      不记得
                    </button>
                  </div>
                </div>

                <!-- 复习结果 -->
                <div v-if="reviewCompleted" class="review-results">
                  <h4>复习完成！</h4>
                  <div class="review-stats">
                    <div class="stat-item">
                      <span class="stat-label">总单词数:</span>
                      <span class="stat-value">{{ reviewResults.length }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">记得:</span>
                      <span class="stat-value">{{ reviewResults.filter(r => r.remembered).length }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">不记得:</span>
                      <span class="stat-value">{{ reviewResults.filter(r => !r.remembered).length }}</span>
                    </div>
                  </div>

                  <div class="review-again-actions">
                    <button class="btn btn-primary" @click="restartReview">再次复习</button>
                    <button class="btn btn-secondary" @click="exitReviewMode">退出复习</button>
                  </div>
                </div>
              </div>

              <!-- 正常单词列表模式 -->
              <div v-else>
                <!-- 如果有原始单词列表文本，解析并显示 -->
                <div v-if="selectedArticle && selectedArticle.wordListText" class="word-list-parsed">
                  <div v-for="(line, index) in parseWordListForDisplay(selectedArticle.wordListText)" :key="index" class="word-list-line">
                    <span class="word-list-word" @click="playWordPronunciation(line.word)">
                      {{ line.word }}
                      <span class="pronunciation-icon" title="点击播放发音">🔊</span>
                    </span>
                    <span class="word-list-meaning">{{ line.meaning }}</span>
                  </div>
                </div>
                <!-- 否则显示单词列表 -->
                <div v-else class="article-content article-zh">
                  <div v-for="(word, index) in selectedArticle?.words" :key="index" class="word-item-review" @click="playWordPronunciation(word)">
                    <span class="word-text-review">{{ word }}</span>
                    <span class="word-meaning-review">{{ getWordMeaning(selectedArticle, word) }}</span>
                    <span class="pronunciation-icon" title="点击播放发音">🔊</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 单词释义弹窗 -->
    <div class="word-popup" v-if="showWordPopup" :style="popupStyle">
      <div class="word-popup-content">
        <div class="word-popup-header">
          <div class="word-popup-word">{{ currentWord }}</div>
          <button class="word-popup-sound" @click="playWordPronunciation(currentWord)" title="播放发音">🔊</button>
        </div>
        <div class="word-popup-meaning">{{ currentWordMeaning }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '../store/learningStore'
import { getAllStudyRecords, deleteStudyRecord } from '../services/studyRecordService'
import { pronounceWord } from '../services/pronunciationService'
import DOMPurify from 'dompurify'

const router = useRouter()
const learningStore = useLearningStore()
const articleContentRef = ref(null)

// 状态
const isLoading = ref(true)
const records = ref([])
const loadError = ref('')
const actionMessage = ref('')
const actionSuccess = ref(false)
const isDeleting = ref(false)

// 文章详情弹窗状态
const showArticleModal = ref(false)
const selectedArticle = ref(null)

// 高亮单词弹窗状态
const showWordPopup = ref(false)
const currentWord = ref('')
const currentWordMeaning = ref('')
const popupStyle = ref({
  top: '0px',
  left: '0px'
})

// 复习模式状态
const isReviewMode = ref(false)
const currentReviewWordIndex = ref(0)
const showMeaning = ref(false)
const reviewWords = ref([])
const reviewResults = ref([])
const reviewCompleted = ref(false)

// 当前复习的单词
const currentReviewWord = computed(() => {
  if (reviewWords.value.length === 0 || currentReviewWordIndex.value >= reviewWords.value.length) {
    return { word: '', meaning: '' }
  }
  return reviewWords.value[currentReviewWordIndex.value]
})

// 加载所有学习记录
const loadStudyRecords = async () => {
  try {
    console.log('开始加载学习记录...')
    isLoading.value = true
    loadError.value = ''

    const data = await getAllStudyRecords()
    console.log('获取到学习记录数据:', data)

    if (!data || data.length === 0) {
      console.log('没有找到学习记录')
      records.value = []
      return
    }

    // 检查数据结构
    console.log('第一条记录示例:', data[0])
    console.log('第一条记录ID:', data[0]._id)
    console.log('第一条记录单词列表:', data[0].words)

    // 检查 wordMeanings 字段
    if (data[0].wordMeanings) {
      console.log('wordMeanings 类型:', typeof data[0].wordMeanings)
      console.log('wordMeanings 值:', data[0].wordMeanings)
      console.log('wordMeanings 是否为 Map:', data[0].wordMeanings instanceof Map)

      if (typeof data[0].wordMeanings === 'object') {
        console.log('wordMeanings 对象的键:', Object.keys(data[0].wordMeanings))

        // 检查第一个单词的释义
        if (data[0].words && data[0].words.length > 0) {
          const firstWord = data[0].words[0]
          console.log('第一个单词:', firstWord)
          console.log('第一个单词的释义:', data[0].wordMeanings[firstWord])
        }
      }

      // 如果是字符串，尝试解析
      if (typeof data[0].wordMeanings === 'string') {
        try {
          const parsed = JSON.parse(data[0].wordMeanings)
          console.log('解析后的 wordMeanings:', parsed)
        } catch (e) {
          console.log('无法解析 wordMeanings 字符串:', e)
        }
      }
    } else {
      console.log('记录中没有 wordMeanings 字段')
    }

    // 确保每条记录的 wordMeanings 都是可用的
    const processedData = data.map(record => {
      // 如果 wordMeanings 不存在或为空，创建一个空对象
      if (!record.wordMeanings) {
        console.log(`记录 ${record._id} 没有 wordMeanings，创建空对象`)
        record.wordMeanings = {}
      }

      // 如果 wordMeanings 是字符串，尝试解析为对象
      if (typeof record.wordMeanings === 'string') {
        try {
          record.wordMeanings = JSON.parse(record.wordMeanings)
          console.log(`记录 ${record._id} 的 wordMeanings 已从字符串解析为对象`)
        } catch (e) {
          console.error(`解析记录 ${record._id} 的 wordMeanings 失败:`, e)
          record.wordMeanings = {}
        }
      }

      return record
    })

    records.value = processedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    console.log('学习记录加载完成，共', records.value.length, '条记录')
    console.log('处理后的第一条记录:', records.value[0])

  } catch (err) {
    console.error('加载学习记录失败:', err)
    loadError.value = err.message || '加载失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 查看文章详情
const viewArticle = (record) => {
  selectedArticle.value = record
  showArticleModal.value = true
}

// 关闭文章详情弹窗
const closeArticleModal = () => {
  showArticleModal.value = false
  // 如果在复习模式中，退出复习模式
  if (isReviewMode.value) {
    exitReviewMode()
  }
}

// 解析单词列表文本
const parseWordListText = (text) => {
  if (!text || typeof text !== 'string') return []

  const lines = text.split('\n').filter(line => line.trim())
  return lines.map(line => {
    // 支持多种分隔符：冒号、空格等
    const separators = ['：', ':', ' - ', '-', '=']
    let word = '', meaning = ''

    for (const separator of separators) {
      if (line.includes(separator)) {
        [word, meaning] = line.split(separator, 2)
        break
      }
    }

    // 如果没有找到分隔符，整行作为单词
    if (!meaning) {
      word = line
      meaning = '无释义'
    }

    return { word: word.trim(), meaning: meaning.trim() }
  })
}

// 随机打乱数组
const shuffleArray = (array) => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// 开始复习模式
const startReviewMode = () => {
  if (!selectedArticle.value) return

  let wordsToReview = []

  // 如果有原始单词列表文本，解析它
  if (selectedArticle.value.wordListText) {
    wordsToReview = parseWordListText(selectedArticle.value.wordListText)
  }
  // 否则使用已有的单词和释义
  else if (selectedArticle.value.words && selectedArticle.value.words.length > 0) {
    wordsToReview = selectedArticle.value.words.map(word => ({
      word: word,
      meaning: getWordMeaning(selectedArticle.value, word)
    }))
  }

  if (wordsToReview.length === 0) {
    alert('没有可复习的单词！')
    return
  }

  // 随机打乱单词顺序，增加复习效果
  reviewWords.value = shuffleArray(wordsToReview)

  // 设置复习状态
  currentReviewWordIndex.value = 0
  isReviewMode.value = true
  showMeaning.value = false
  reviewResults.value = []
  reviewCompleted.value = false
}

// 显示当前单词的意思
const showWordMeaning = () => {
  showMeaning.value = true

  // 当显示单词意思时，自动播放单词发音
  if (currentReviewWord.value && currentReviewWord.value.word) {
    playWordPronunciation(currentReviewWord.value.word)
  }
}

// 记录复习结果并前进到下一个单词
const recordAndNext = (remembered) => {
  // 记录当前单词的复习结果
  if (reviewWords.value[currentReviewWordIndex.value]) {
    reviewResults.value.push({
      word: reviewWords.value[currentReviewWordIndex.value].word,
      meaning: reviewWords.value[currentReviewWordIndex.value].meaning,
      remembered: remembered
    })
  }

  // 前进到下一个单词
  currentReviewWordIndex.value++
  showMeaning.value = false

  // 检查是否已完成所有单词
  if (currentReviewWordIndex.value >= reviewWords.value.length) {
    reviewCompleted.value = true
  }
}

// 重新开始复习
const restartReview = () => {
  // 重新打乱单词顺序
  reviewWords.value = shuffleArray(reviewWords.value)

  // 重置复习状态
  currentReviewWordIndex.value = 0
  showMeaning.value = false
  reviewResults.value = []
  reviewCompleted.value = false
}

// 退出复习模式
const exitReviewMode = () => {
  isReviewMode.value = false
  reviewWords.value = []
  reviewResults.value = []
  reviewCompleted.value = false
}

// 播放单词发音
const playWordPronunciation = (word) => {
  if (!word) return

  pronounceWord(word).catch(error => {
    console.warn('播放单词发音失败:', error)
  })
}

// 解析单词列表文本用于显示
const parseWordListForDisplay = (text) => {
  if (!text || typeof text !== 'string') return []

  const lines = text.split('\n').filter(line => line.trim())
  return lines.map(line => {
    // 支持多种分隔符：冒号、空格等
    const separators = ['：', ':', ' - ', '-', '=']
    let word = '', meaning = ''

    for (const separator of separators) {
      if (line.includes(separator)) {
        [word, meaning] = line.split(separator, 2)
        break
      }
    }

    // 如果没有找到分隔符，整行作为单词
    if (!meaning) {
      word = line
      meaning = '无释义'
    }

    return { word: word.trim(), meaning: meaning.trim() }
  })
}

// 格式化文章标题
const formatArticleTitle = (record) => {
  if (!record) return ''

  // 使用前5个单词作为标题
  const words = record.words || []
  const titleWords = words.slice(0, 5).join(', ')

  return titleWords || '未命名文章'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取单词释义
const getWordMeaning = (record, word) => {
  if (!record || !word) return '无释义'

  console.log('getWordMeaning 函数被调用，单词:', word)

  // 如果记录有单词释义数据
  if (record.wordMeanings && typeof record.wordMeanings === 'object') {
    console.log('wordMeanings 存在，类型:', typeof record.wordMeanings)
    console.log('wordMeanings 内容:', record.wordMeanings)
    console.log('对象的键:', Object.keys(record.wordMeanings))

    // 直接检查对象中是否有该单词的键
    if (word in record.wordMeanings) {
      console.log('单词在对象中找到:', record.wordMeanings[word])
      return record.wordMeanings[word]
    }

    // 尝试使用不区分大小写的方式查找
    const lowerCaseWord = word.toLowerCase()
    for (const key in record.wordMeanings) {
      if (key.toLowerCase() === lowerCaseWord) {
        console.log('单词在对象中找到（不区分大小写）:', record.wordMeanings[key])
        return record.wordMeanings[key]
      }
    }

    console.log('单词在对象中未找到')
  } else {
    console.log('记录中没有有效的 wordMeanings 字段')
  }

  return '无释义'
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return ''

  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength) + '...'
}

// 格式化中文文章内容
const formattedArticleZh = computed(() => {
  if (!selectedArticle.value) return ''

  let content = selectedArticle.value.chineseText || ''

  // 对输入进行安全处理
  content = DOMPurify.sanitize(content)

  // 保留换行符，将其转换为HTML的<br>标签
  content = content.replace(/\n/g, '<br>')

  return content
})

// 格式化英文文章内容，添加高亮
const formattedArticle = computed(() => {
  if (!selectedArticle.value) return ''

  let content = selectedArticle.value.englishText || ''
  const words = selectedArticle.value.words || []

  // 对输入进行安全处理
  content = DOMPurify.sanitize(content)

  // 保留换行符，将其转换为HTML的<br>标签
  content = content.replace(/\n/g, '<br>')

  // 为文章中的单词添加高亮
  if (words.length > 0) {
    // 按照单词长度降序排序，避免短单词替换长单词的一部分
    const sortedWords = [...words].sort((a, b) => b.length - a.length)

    // 遍历所有单词
    for (const word of sortedWords) {
      // 对每个单词，创建一个正则表达式来匹配它（确保匹配整个单词）
      const wordRegex = new RegExp(`(\\b${escapeRegExp(word)}\\b)`, 'gi')

      // 替换所有匹配的单词为高亮版本
      content = content.replace(wordRegex, `<span class="highlighted-word" data-word="${word}">$1</span>`)
    }
  }

  return content
})

// 辅助函数：转义正则表达式中的特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 处理单词点击
const handleWordClick = (event) => {
  const target = event.target

  // 如果点击的是高亮单词
  if (target.classList.contains('highlighted-word')) {
    // 获取单词
    const word = target.getAttribute('data-word')

    // 获取单词释义
    let meaning = '未找到释义'

    // 如果选中的文章有单词释义数据
    if (selectedArticle.value) {
      console.log('选中的文章:', selectedArticle.value)
      console.log('单词:', word)
      console.log('单词释义数据类型:', typeof selectedArticle.value.wordMeanings)
      console.log('单词释义数据:', selectedArticle.value.wordMeanings)

      // 使用通用的 getWordMeaning 方法获取释义
      meaning = getWordMeaning(selectedArticle.value, word)
      console.log('获取到的单词释义:', meaning)
    }

    currentWord.value = word
    currentWordMeaning.value = meaning

    // 播放单词发音
    pronounceWord(word).catch(error => {
      console.warn('播放单词发音失败:', error)
    })

    // 计算弹窗位置
    const rect = target.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop

    popupStyle.value = {
      top: rect.top + scrollTop - 50 + 'px',
      left: rect.left + (rect.width / 2) + 'px'
    }

    showWordPopup.value = true
  } else {
    // 点击其他位置时隐藏弹窗
    showWordPopup.value = false
  }
}

// 点击其他地方隐藏弹窗
const handleDocumentClick = (event) => {
  const target = event.target
  if (!target.classList.contains('highlighted-word')) {
    showWordPopup.value = false
  }
}

// 确认删除文章
const confirmDelete = (record) => {
  if (confirm(`确定要删除文章 "${formatArticleTitle(record)}" 吗？此操作不可恢复。`)) {
    deleteArticle(record._id)
  }
}

// 删除文章
const deleteArticle = async (recordId) => {
  if (isDeleting.value) return

  try {
    isDeleting.value = true
    actionMessage.value = ''

    console.log('删除文章:', recordId)
    const result = await deleteStudyRecord(recordId)

    // 从列表中移除
    records.value = records.value.filter(record => record._id !== recordId)

    // 显示成功消息
    actionSuccess.value = true
    actionMessage.value = '文章已成功删除'

    // 3秒后清除消息
    setTimeout(() => {
      actionMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('删除文章失败:', error)

    // 显示错误消息
    actionSuccess.value = false
    actionMessage.value = `删除失败: ${error.message || '未知错误'}`

    // 5秒后清除错误消息
    setTimeout(() => {
      actionMessage.value = ''
    }, 5000)
  } finally {
    isDeleting.value = false
  }
}

// 组件挂载和卸载时的事件监听
onMounted(() => {
  // 加载学习记录
  loadStudyRecords()

  // 添加全局点击监听
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.review-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.empty-state, .loading-center {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-state p, .loading-center p {
  font-size: 1.1rem;
  color: #555;
  max-width: 500px;
  margin: 0 auto;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mt-2 {
  margin-top: 0.75rem;
}

.mt-3 {
  margin-top: 1.5rem;
}

.ml-2 {
  margin-left: 0.75rem;
}

/* 文章列表样式 */
.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.article-item {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.article-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.article-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.article-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.article-date {
  display: block;
  font-size: 0.8rem;
  color: #777;
  margin-top: 0.5rem;
}

.article-words {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.word-tag {
  background-color: #e1f5fe;
  color: #0277bd;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s;
}

.word-tag:hover {
  background-color: #b3e5fc;
}

.word-sound-icon {
  margin-left: 4px;
  font-size: 0.8rem;
  opacity: 0.6;
}

.word-tag:hover .word-sound-icon {
  opacity: 1;
}

.article-preview {
  padding: 1rem;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
  height: 100px;
  overflow: hidden;
}

.article-actions {
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #c82333;
}

.alert {
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 文章详情弹窗样式 */
.article-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.article-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.article-modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
}

.article-modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #777;
}

.close-button:hover {
  color: #333;
}

.article-modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.word-list-section {
  margin-top: 1.5rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
}

.word-list-content {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #eaeaea;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.word-list-parsed {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #eaeaea;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  max-height: 500px;
  overflow-y: auto;
}

.word-list-line {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
  background-color: #fff;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
}

.word-list-word {
  font-weight: bold;
  margin-right: 10px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.word-list-word:hover {
  color: #007bff;
}

.word-list-meaning {
  color: #555;
  flex: 1;
}

.word-item-review {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: #f8f9fa;
  border: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s;
}

.word-item-review:hover {
  background-color: #e9ecef;
}

.word-text-review {
  font-weight: bold;
  margin-right: 8px;
  color: #333;
  flex: 0 0 auto;
}

.word-meaning-review {
  color: #555;
  flex: 1;
}

.pronunciation-icon {
  margin-left: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  color: #007bff;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.pronunciation-icon:hover {
  opacity: 1;
}

.pronunciation-icon-review {
  margin-left: 10px;
  font-size: 1.2rem;
  color: #007bff;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  vertical-align: middle;
}

.pronunciation-icon-review:hover {
  opacity: 1;
}

/* 左右布局容器 */
.article-container {
  display: flex;
  gap: 20px;
  margin-bottom: 1rem;
}

/* 响应式布局 - 在小屏幕上切换为上下布局 */
@media (max-width: 768px) {
  .article-container {
    flex-direction: column;
  }

  .article-list {
    grid-template-columns: 1fr;
  }

  .article-modal-content {
    width: 95%;
    max-height: 95vh;
  }
}

.article-section {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

.article-section h4 {
  margin-top: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.article-content {
  line-height: 1.8;
  font-size: 1.1rem;
  margin-top: 1rem;
  min-height: 300px; /* 最小高度 */
  max-height: 500px; /* 最大高度 */
  overflow-y: auto; /* 内容过多时可滚动 */
  padding: 0.5rem;
  background-color: #fafafa;
  border-radius: 4px;
  white-space: pre-line; /* 保留换行符 */
  text-align: left; /* 确保文本左对齐 */
}

.article-zh {
  color: #555;
}

/* 单词弹窗样式 */
.word-popup {
  position: absolute;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  border-radius: 4px;
  padding: 8px 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 1100;
}

.word-popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

.word-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.word-popup-word {
  font-weight: bold;
  font-size: 1rem;
}

.word-popup-sound {
  background: none;
  border: none;
  color: #007bff;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.word-popup-sound:hover {
  opacity: 1;
}

.word-popup-meaning {
  font-size: 0.9rem;
  color: #f8f8f8;
}

:deep(.highlighted-word) {
  background-color: #ffeb3b !important; /* 更亮的黄色，使用!important确保样式生效 */
  padding: 0 2px;
  border-radius: 3px;
  cursor: pointer;
  display: inline-block;
  position: relative;
  z-index: 1;
  font-weight: 500;
  border-bottom: 1px dotted #007bff; /* 添加下划线，表示可点击 */
  transition: all 0.2s ease;
}

:deep(.highlighted-word:hover) {
  background-color: #ffd54f;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

/* 文章部分标题栏 */
.article-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.article-section-header h4 {
  margin: 0;
}

/* 复习按钮样式 */
.review-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-button:hover {
  background-color: #0069d9;
}

/* 复习模式样式 */
.review-mode {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 300px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.review-progress {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.review-exit-button {
  background-color: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 0.9rem;
}

.review-exit-button:hover {
  color: #343a40;
  text-decoration: underline;
}

.review-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2rem 1rem;
}

.review-word {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #343a40;
  text-align: center;
}

.review-meaning {
  font-size: 1.5rem;
  color: #495057;
  margin-bottom: 2rem;
  text-align: center;
  animation: fadeIn 0.5s;
}

.review-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* 复习结果样式 */
.review-results {
  padding: 1.5rem;
  text-align: center;
  animation: fadeIn 0.5s;
}

.review-results h4 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #343a40;
}

.review-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #343a40;
}

.review-again-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
