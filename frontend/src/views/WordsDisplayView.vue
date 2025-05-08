<template>
  <div class="words-display-view">
    <h2>单词列表</h2>

    <!-- 无数据提示 -->
    <div v-if="!hasWords" class="card">
      <div class="empty-state">
        <p>还没有单词数据。</p>
        <router-link to="/input" class="btn btn-primary">返回输入页面</router-link>
      </div>
    </div>

    <!-- 单词列表 -->
    <div v-else>
      <div class="card">
        <h3>您的学习单词 ({{ words.length }}个)</h3>

        <div class="words-list">
          <div class="word-item" v-for="(word, index) in words" :key="index">
            <div class="word-english" @click="playWordPronunciation(word)">
              {{ word }}
              <span class="pronunciation-icon" title="点击播放发音">🔊</span>
            </div>
            <div class="word-arrow">→</div>
            <div class="word-chinese">{{ wordMeanings[word] || '加载中...' }}</div>
          </div>
        </div>

        <div class="actions mt-3">
          <router-link to="/article-display" class="btn btn-primary">
            查看生成的文章
          </router-link>
          <button @click="saveToDatabase" class="btn btn-success ml-2" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存到数据库' }}
          </button>
          <router-link to="/input" class="btn btn-secondary ml-2">
            返回修改
          </router-link>
        </div>

        <!-- 保存成功提示 -->
        <div v-if="saveSuccess" class="alert alert-success mt-3">
          保存成功！您可以在历史记录中查看。
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '../store/learningStore'
import { saveStudyRecord } from '../services/studyRecordService'
import { pronounceWord } from '../services/pronunciationService'

const router = useRouter()
const learningStore = useLearningStore()

// 状态变量
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

// 从 store 获取单词数据
const words = computed(() => learningStore.inputWords)
const wordMeanings = computed(() => learningStore.wordMeanings)
const articleEn = computed(() => learningStore.articleEn)
const articleZh = computed(() => learningStore.articleZh)
const error = computed(() => learningStore.error)
const hasWords = computed(() => words.value.length > 0)

// 保存到数据库
const saveToDatabase = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true
    saveSuccess.value = false
    saveError.value = ''

    // 调用保存服务，包括单词意思
    console.log('保存单词列表到数据库...');
    console.log('单词:', words.value);
    console.log('单词意思类型:', typeof wordMeanings.value);

    // 将 wordMeanings 转换为普通对象
    const meaningsObj = {};
    if (wordMeanings.value) {
      words.value.forEach(word => {
        if (wordMeanings.value[word]) {
          meaningsObj[word] = wordMeanings.value[word];
        }
      });
    }

    console.log('处理后的单词意思:', meaningsObj);

    await saveStudyRecord(
      words.value,
      meaningsObj,
      articleEn.value,
      articleZh.value
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

// 播放单词发音
const playWordPronunciation = (word) => {
  if (!word) return

  pronounceWord(word).catch(error => {
    console.warn('播放单词发音失败:', error)
  })
}

// 组件挂载时检查是否有数据
onMounted(() => {
  console.log('WordsDisplayView 组件挂载')
  console.log('当前单词列表:', words.value)
  console.log('当前单词释义:', wordMeanings.value)
  console.log('hasWords:', hasWords.value)
  console.log('isLoading:', learningStore.isLoading)

  // 如果没有单词数据，重定向到输入页面
  if (!hasWords.value && !learningStore.isLoading) {
    console.log('没有单词数据，重定向到输入页面')
    router.replace('/input')
  } else {
    console.log('有单词数据，显示单词列表')
  }
})
</script>

<style scoped>
.words-display-view {
  max-width: 800px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

.words-list {
  margin-top: 1rem;
}

.word-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.word-item:last-child {
  border-bottom: none;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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
}

.ml-2 {
  margin-left: 0.5rem;
}

.word-english {
  font-weight: 600;
  width: 40%;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.word-english:hover {
  color: #007bff;
}

.pronunciation-icon {
  margin-left: 8px;
  font-size: 1rem;
  color: #007bff;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.word-english:hover .pronunciation-icon {
  opacity: 1;
}

.word-arrow {
  width: 5%;
  color: #95a5a6;
  text-align: center;
}

.word-chinese {
  width: 55%;
  color: #333;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.ml-2 {
  margin-left: 0.75rem;
}
</style>
