<template>
  <div class="article-input-view">
    <h2>文章输入</h2>

    <div class="card">
      <h3>输入英文文章和单词</h3>
      <p class="mb-2">请输入英文文章和需要学习的单词（及其中文意思）</p>

      <!-- 英文文章输入 -->
      <div class="form-group">
        <label for="articleInput">英文文章:</label>
        <textarea
          id="articleInput"
          v-model="articleInput"
          placeholder="请输入英文文章..."
          rows="10"
          class="form-control"
        ></textarea>
      </div>

      <!-- 单词输入 -->
      <div class="form-group mt-3">
        <label for="wordsInput">单词列表 (格式: 单词：中文意思，每行一个):</label>
        <textarea
          id="wordsInput"
          v-model="wordsInput"
          placeholder="例如:
consumerism：消费主义
manipulation：操纵
unrestricted：不受限制的
infringe：侵犯
rights：权利
screening：筛选"
          rows="8"
          class="form-control"
        ></textarea>
      </div>

      <div class="form-actions">
        <button
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="isSubmitting || !canSubmit"
        >
          {{ isSubmitting ? '处理中...' : '生成学习材料' }}
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="alert alert-danger mt-3">
      {{ error }}
    </div>

    <!-- 加载指示器 -->
    <div v-if="isSubmitting" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="mt-2">正在处理文章和生成学习材料，请稍候...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '../store/learningStore'

const router = useRouter()
const learningStore = useLearningStore()

// 响应式状态
const articleInput = ref('')
const wordsInput = ref('')
const isSubmitting = ref(false)
const error = ref('')

// 计算属性：验证表单是否可提交
const canSubmit = computed(() => {
  return articleInput.value.trim() !== '' && wordsInput.value.trim() !== ''
})

// 解析输入的单词和意思
const parseWordsAndMeanings = (input) => {
  if (!input || input.trim() === '') return { words: [], meanings: {} }

  const lines = input.split('\n').filter(line => line.trim() !== '')
  const words = []
  const meanings = {}

  for (const line of lines) {
    // 使用冒号分隔单词和意思
    const parts = line.split('：')
    if (parts.length >= 2) {
      const word = parts[0].trim()
      const meaning = parts[1].trim()

      if (word && meaning) {
        words.push(word)
        meanings[word] = meaning
      }
    }
  }

  return { words, meanings }
}

// 处理表单提交
const handleSubmit = async () => {
  // 重置错误状态
  error.value = ''

  if (!canSubmit.value) {
    error.value = '请输入英文文章和单词'
    return
  }

  try {
    isSubmitting.value = true

    // 解析单词和意思
    const { words, meanings } = parseWordsAndMeanings(wordsInput.value)

    if (words.length === 0) {
      error.value = '请至少输入一个有效的单词和意思（格式：单词：意思）'
      isSubmitting.value = false
      return
    }

    // 准备高亮数据
    const highlightData = words.map(word => ({
      word,
      positions: [] // 位置信息会在前端自动计算
    }))

    // 设置数据到 store
    learningStore.setInputWords(words)
    learningStore.setWordMeanings(meanings)
    learningStore.setArticleEn(articleInput.value)
    learningStore.setWordListText(wordsInput.value) // 保存原始单词列表文本
    learningStore.setHighlightData(highlightData)

    // 调用后端API获取中文翻译
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: articleInput.value })
    })

    if (!response.ok) {
      let errorMessage = '翻译失败';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // 如果响应不是JSON，尝试获取文本
        try {
          const errorText = await response.text();
          console.error('非JSON错误响应:', errorText);
        } catch (textError) {
          console.error('无法读取错误响应内容');
        }
      }
      throw new Error(errorMessage);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error('解析JSON响应失败:', jsonError);
      throw new Error('服务器返回了无效的数据格式');
    }

    // 设置中文翻译到 store
    learningStore.setArticleZh(result.translation)

    // 跳转到文章展示页面
    router.push('/article-display')
  } catch (err) {
    console.error('处理文章失败:', err)
    error.value = err.message || '处理失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.article-input-view {
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem 1.25rem;
  border: 1px solid #f5c6cb;
  border-radius: 0.25rem;
  margin-top: 1rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}
</style>
