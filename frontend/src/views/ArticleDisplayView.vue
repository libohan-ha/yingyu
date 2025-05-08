<template>
  <div class="article-display-view">
    <h2>阅读学习</h2>

    <!-- 无数据提示 -->
    <div v-if="!hasArticle" class="card">
      <div class="empty-state">
        <p>还没有文章数据。</p>
        <router-link to="/input" class="btn btn-primary">返回输入页面</router-link>
      </div>
    </div>

    <!-- 文章内容 -->
    <div v-else>
      <div class="content-container">
        <!-- 文章内容区域 - 左侧 -->
        <div class="article-container">
          <!-- 英文文章 -->
          <div class="card article-card">
            <h3>英文文章</h3>
            <div class="article-content" ref="articleContentRef" v-html="formattedArticle"></div>
          </div>
        </div>

        <!-- 单词列表 - 右侧 -->
        <div class="words-list-container">
          <div class="card words-list-card">
            <div class="card-header">
              <h3>单词列表</h3>
              <button
                class="review-button"
                @click="startReviewMode"
                v-if="!isReviewMode && ((wordListText && wordListText.trim()) || (words && words.length > 0))"
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
                <div class="review-word" @click="playWordFromText(currentReviewWord.word)">
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
            <div v-else class="words-list">
              <!-- 如果有原始单词列表文本，解析并显示 -->
              <div v-if="wordListText" class="word-list-parsed">
                <div v-for="(line, index) in parseWordListForDisplay(wordListText)" :key="index" class="word-list-line">
                  <span class="word-list-word" @click="playWordFromText(line.word)">
                    {{ line.word }}
                    <span class="pronunciation-icon" title="点击播放发音">🔊</span>
                  </span>
                  <span class="word-list-meaning">{{ line.meaning }}</span>
                </div>
              </div>
              <!-- 否则显示单词列表 -->
              <div
                v-else
                v-for="word in words"
                :key="word"
                class="word-item"
                @click="highlightWordInArticle(word)"
                :class="{ 'active': activeWord === word }"
              >
                <div class="word-text">
                  {{ word }}
                  <span class="pronunciation-icon" title="点击播放发音">🔊</span>
                </div>
                <div class="word-meaning">{{ wordMeanings[word] || '无释义' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导航操作 -->
      <div class="actions mt-3">
        <router-link to="/review" class="btn btn-primary">
          开始复习单词
        </router-link>
        <button @click="saveToDatabase" class="btn btn-success ml-2" :disabled="isSaving">
          {{ isSaving ? '保存中...' : '保存到数据库' }}
        </button>
        <router-link to="/words-display" class="btn btn-secondary ml-2">
          返回单词列表
        </router-link>
      </div>

      <!-- 保存成功提示 -->
      <div v-if="saveSuccess" class="alert alert-success mt-3">
        保存成功！您可以在历史记录中查看。
      </div>
    </div>

    <!-- 单词释义弹窗 -->
    <div class="word-popup" v-if="showWordPopup" :style="popupStyle">
      <div class="word-popup-content">
        <div class="word-popup-header">
          <div class="word-popup-word">{{ currentWord }}</div>
          <button class="word-popup-sound" @click="playWordFromText(currentWord)" title="播放发音">🔊</button>
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
import { saveStudyRecord } from '../services/studyRecordService'
import { pronounceWord } from '../services/pronunciationService'
import DOMPurify from 'dompurify'

const router = useRouter()
const learningStore = useLearningStore()
const articleContentRef = ref(null)

// 保存状态
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

// 从 store 获取数据
const articleEn = computed(() => learningStore.articleEn)
const wordMeanings = computed(() => learningStore.wordMeanings)
const words = computed(() => learningStore.inputWords)
const wordListText = computed(() => learningStore.wordListText)
const hasArticle = computed(() => articleEn.value && articleEn.value.trim() !== '')

// 保存到数据库
const saveToDatabase = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true
    saveSuccess.value = false
    saveError.value = ''

    // 调用保存服务，包括单词意思
    console.log('保存文章到数据库...');
    console.log('单词:', words.value);
    console.log('单词意思类型:', typeof wordMeanings.value);
    console.log('单词意思内容:', wordMeanings.value);

    // 确保 wordMeanings 是一个有效的对象
    const meaningsObj = {};
    if (wordMeanings.value) {
      // 遍历所有单词，确保每个单词都有对应的释义
      words.value.forEach(word => {
        if (wordMeanings.value[word]) {
          meaningsObj[word] = wordMeanings.value[word];
        } else {
          console.log(`单词 ${word} 没有找到释义`);
        }
      });
    }

    console.log('处理后的单词意思:', meaningsObj);
    console.log('单词意思对象的键:', Object.keys(meaningsObj));

    // 获取中文翻译和原始单词列表文本
    const chineseText = learningStore.articleZh || "";
    const wordListText = learningStore.wordListText || "";
    console.log('中文翻译:', chineseText ? '有翻译' : '无翻译');
    console.log('原始单词列表文本:', wordListText ? '有单词列表' : '无单词列表');

    await saveStudyRecord(
      words.value,
      meaningsObj,
      articleEn.value,
      chineseText, // 保存中文翻译，如果有的话
      wordListText // 保存原始单词列表文本
    )

    // 保存成功
    saveSuccess.value = true

    // 3秒后隐藏成功提示
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('保存到数据库失败:', err)
    saveError.value = err.message || '保存失败，请稍后重试'
  } finally {
    isSaving.value = false
  }
}

// 高亮单词弹窗状态
const showWordPopup = ref(false)
const currentWord = ref('')
const currentWordMeaning = ref('')
const popupStyle = ref({
  top: '0px',
  left: '0px'
})

// 当前激活的单词
const activeWord = ref('')

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
  let wordsToReview = []

  // 如果有原始单词列表文本，解析它
  if (wordListText.value) {
    wordsToReview = parseWordListText(wordListText.value)
  }
  // 否则使用已有的单词和释义
  else if (words.value && words.value.length > 0) {
    wordsToReview = words.value.map(word => ({
      word: word,
      meaning: wordMeanings.value[word] || '无释义'
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
    playWordFromText(currentReviewWord.value.word)
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

// 从文本中播放单词发音
const playWordFromText = (word) => {
  if (!word) return

  pronounceWord(word).catch(error => {
    console.warn('播放单词发音失败:', error)
  })
}

// 在文章中高亮特定单词
const highlightWordInArticle = (word) => {
  activeWord.value = word

  // 播放单词发音
  pronounceWord(word).catch(error => {
    console.warn('播放单词发音失败:', error)
  })

  // 如果文章内容已加载
  if (articleContentRef.value) {
    // 先移除所有当前的激活高亮
    const allHighlightedWords = articleContentRef.value.querySelectorAll('.highlighted-word')
    allHighlightedWords.forEach(el => {
      el.classList.remove('active-highlight')
    })

    // 找到匹配的单词并添加激活高亮
    const matchingWords = articleContentRef.value.querySelectorAll(`.highlighted-word[data-word="${word}"]`)
    matchingWords.forEach(el => {
      el.classList.add('active-highlight')

      // 滚动到第一个匹配的单词
      if (matchingWords.length > 0) {
        matchingWords[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }
}

// 不再需要格式化中文文章内容

// 格式化英文文章内容，添加高亮
const formattedArticle = computed(() => {
  if (!articleEn.value) return ''

  let content = articleEn.value

  // 对输入进行安全处理
  content = DOMPurify.sanitize(content)

  // 保留换行符，将其转换为HTML的<br>标签
  content = content.replace(/\n/g, '<br>')

  // 始终使用单词列表进行高亮处理
  if (words.value && words.value.length > 0) {
    // 按照单词长度降序排序，避免短单词替换长单词的一部分
    const sortedWords = [...words.value].sort((a, b) => b.length - a.length)

    // 遍历所有单词
    for (const word of sortedWords) {
      // 对每个单词，创建一个正则表达式来匹配它（确保匹配整个单词）
      const wordRegex = new RegExp(`(\\b${escapeRegExp(word)}\\b)`, 'gi')

      // 替换所有匹配的单词为高亮版本（使用黄色背景）
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
    // 获取单词和它的释义
    const word = target.getAttribute('data-word')
    const meaning = wordMeanings.value[word] || '未找到释义'

    currentWord.value = word
    currentWordMeaning.value = meaning

    // 设置当前激活的单词
    activeWord.value = word

    // 播放单词发音
    pronounceWord(word).catch(error => {
      console.warn('播放单词发音失败:', error)
    })

    // 高亮所有相同的单词
    const allMatchingWords = articleContentRef.value.querySelectorAll(`.highlighted-word[data-word="${word}"]`)

    // 先移除所有当前的激活高亮
    const allHighlightedWords = articleContentRef.value.querySelectorAll('.highlighted-word')
    allHighlightedWords.forEach(el => {
      el.classList.remove('active-highlight')
    })

    // 添加激活高亮
    allMatchingWords.forEach(el => {
      el.classList.add('active-highlight')
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
  // 检查是否点击了高亮单词或单词列表项
  const isHighlightedWord = target.classList.contains('highlighted-word')
  const isWordItem = target.closest('.word-item')

  if (!isHighlightedWord && !isWordItem) {
    showWordPopup.value = false

    // 如果不是点击单词列表项，也清除激活状态
    if (!isWordItem) {
      activeWord.value = ''
      // 移除所有激活高亮
      if (articleContentRef.value) {
        const allHighlightedWords = articleContentRef.value.querySelectorAll('.highlighted-word')
        allHighlightedWords.forEach(el => {
          el.classList.remove('active-highlight')
        })
      }
    }
  }
}

// 组件挂载和卸载时的事件监听
onMounted(() => {
  // 如果没有文章数据，重定向到输入页面
  if (!hasArticle.value && !learningStore.isLoading) {
    router.replace('/input')
    return
  }

  // 给文章内容添加事件委托
  if (articleContentRef.value) {
    articleContentRef.value.addEventListener('click', handleWordClick)
  }

  // 添加全局点击监听
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  // 移除事件监听
  if (articleContentRef.value) {
    articleContentRef.value.removeEventListener('click', handleWordClick)
  }

  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.article-display-view {
  max-width: 1200px;
  margin: 0 auto;
}

/* 内容容器 - 左右布局 */
.content-container {
  display: flex;
  gap: 20px;
  margin-bottom: 1rem;
}

/* 文章容器 */
.article-container {
  flex: 3; /* 占据3/5的空间 */
}

/* 响应式布局 - 在小屏幕上调整为上下布局 */
@media (max-width: 1200px) {
  .content-container {
    flex-direction: column;
  }
}

/* 文章卡片样式 */
.article-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.article-content {
  line-height: 1.8;
  font-size: 1.15rem;
  margin-top: 1rem;
  min-height: 400px; /* 最小高度 */
  max-height: 70vh; /* 最大高度 */
  overflow-y: auto; /* 内容过多时可滚动 */
  padding: 0 10px;
  white-space: pre-line; /* 保留换行符 */
  text-align: left; /* 确保文本左对齐 */
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ml-2 {
  margin-left: 0.75rem;
}

.btn-success {
  background-color: #28a745;
  color: white;
  border: none;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-success:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  padding: 0.75rem 1.25rem;
  border: 1px solid #c3e6cb;
  border-radius: 0.25rem;
  margin-top: 1rem;
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
  z-index: 100;
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
}

:deep(.highlighted-word:hover) {
  background-color: #ffd54f;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
}

:deep(.active-highlight) {
  background-color: #ffb300;
  font-weight: bold;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
}

/* 单词列表样式 */
.words-list-container {
  flex: 2; /* 占据2/5的空间 */
  max-height: calc(100vh - 150px);
  z-index: 10;
}

.words-list-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.words-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}

.word-item {
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 6px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #eaeaea;
}

.word-item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.word-item.active {
  background-color: #fff8e1;
  border-left: 3px solid #ffb300;
  box-shadow: 0 2px 8px rgba(255, 179, 0, 0.2);
}

.word-text {
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 1.1rem;
  color: #333;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.word-text:hover {
  color: #007bff;
}

.word-meaning {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.4;
}

.word-list-parsed {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #eaeaea;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  max-height: 100%;
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

.pronunciation-icon {
  margin-left: 6px;
  font-size: 0.9rem;
  color: #007bff;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.word-list-word:hover .pronunciation-icon,
.word-text:hover .pronunciation-icon {
  opacity: 1;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
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
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.review-word:hover {
  color: #007bff;
}

.pronunciation-icon-review {
  margin-left: 10px;
  font-size: 1.2rem;
  color: #007bff;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.review-word:hover .pronunciation-icon-review {
  opacity: 1;
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

/* 响应式调整 */
@media (max-width: 1200px) {
  .words-list-container {
    width: 100%;
    margin-bottom: 20px;
  }

  .words-list-card {
    height: auto;
  }

  .words-list {
    max-height: 300px;
  }
}


</style>
