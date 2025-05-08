<template>
  <div class="input-view">
    <h2>输入单词学习</h2>

    <!-- 图片上传区域 -->
    <div class="card">
      <h3>上传图片</h3>
      <p class="mb-2">上传包含英文文章的图片，系统将识别图片中的内容和标记的单词</p>

      <div class="image-upload-area">
        <div class="upload-container" @click="triggerFileUpload" :class="{'has-image': previewImage}">
          <div v-if="!previewImage" class="upload-placeholder">
            <i class="upload-icon">📷</i>
            <p>点击上传图片或拍照</p>
            <p class="upload-hint">支持jpg、png格式</p>
          </div>
          <img v-else :src="previewImage" alt="预览" class="preview-image" />
        </div>
        <input
          type="file"
          ref="fileInput"
          @change="handleFileChange"
          accept="image/*"
          class="file-input"
        />
        <div class="image-actions" v-if="previewImage">
          <button class="btn btn-danger" @click="removeImage">删除图片</button>
        </div>
      </div>
    </div>

    <!-- 单词输入区域 -->
    <div class="card mt-3">
      <h3>输入要学习的单词</h3>
      <p class="mb-2">请输入英语单词和中文意思，每行一个</p>
      <p class="hint-text"><i>提示: 使用图片上传后，系统将自动识别标记的单词</i></p>

      <div class="words-input">
        <label for="wordsInput">单词列表 (格式: 单词：中文意思，每行一个):</label>
        <textarea
          id="wordsInput"
          v-model="wordsInput"
          placeholder="例如:
apple：苹果
banana：香蕉
orange：橙子
grape：葡萄
watermelon：西瓜"
          rows="8"
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
        <p class="mt-2">正在处理图片和生成学习材料，请稍候...</p>
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
const wordsInput = ref('')
const isSubmitting = ref(false)
const error = ref('')
const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)

// 计算属性：验证表单是否可提交
const canSubmit = computed(() => {
  return wordsInput.value.trim() !== '' || selectedFile.value
})

// 触发文件上传对话框
const triggerFileUpload = () => {
  fileInput.value.click()
}

// 处理文件选择变化
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file

  // 创建图片预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// 移除选择的图片
const removeImage = () => {
  previewImage.value = null
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 解析输入的单词
const parseWords = (input) => {
  // 处理逗号分隔或换行分隔的情况
  return input.split(/[,\n]/)
    .map(word => word.trim())
    .filter(word => word !== '') // 过滤空值
}

// 处理表单提交
const handleSubmit = async () => {
  // 重置错误状态
  error.value = ''

  if (!canSubmit.value) {
    error.value = '请输入单词或上传图片'
    return
  }

  try {
    isSubmitting.value = true

    // 如果有图片，先处理图片
    if (selectedFile.value) {
      const reader = new FileReader()

      try {
        // 读取图片为base64
        const imageData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('读取图片失败'))
          reader.readAsDataURL(selectedFile.value)
        })

        // 调用后端API处理图片
        const response = await fetch('/api/process-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageData })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '图片处理失败')
        }

        const result = await response.json()
        console.log('图片处理成功，结果:', result)

        // 设置从图片识别出的单词到 store 中
        if (result.words && result.words.length > 0) {
          console.log('设置识别出的单词到 store:', result.words)
          // 只设置到 store 中，不设置到输入框
          learningStore.setInputWords(result.words)
        }

        // 保存处理结果到store
        console.log('设置英文文章到 store')
        learningStore.setArticleEn(result.articleEn)

        // 保存翻译结果
        if (result.wordMeanings) {
          console.log('设置单词释义到 store')
          learningStore.setWordMeanings(result.wordMeanings)
        }

        // 保存高亮数据
        if (result.highlightData) {
          console.log('设置高亮数据到 store')
          learningStore.setHighlightData(result.highlightData)
        }

        // 设置当前会话ID
        if (result.sessionId) {
          console.log('设置会话ID到 store:', result.sessionId)
          learningStore.setCurrentSession(result.sessionId)
        }

        console.log('准备直接跳转到文章显示页面')
        // 处理成功，直接跳转到文章显示页面
        router.push('/article-display')
        console.log('已发送跳转请求')
        return // 已完成处理，返回
      } catch (err) {
        console.error('图片处理失败:', err)
        error.value = '图片处理失败: ' + (err.message || '未知错误')
        isSubmitting.value = false
        return // 失败后直接返回
      }
    }

    // 如果没有图片，处理输入的单词
    const words = parseWords(wordsInput.value)

    if (words.length === 0) {
      error.value = '请至少输入一个有效单词或上传图片'
      isSubmitting.value = false
      return
    }

    // 调用 store action 处理单词
    await learningStore.processWords(words)

    // 处理成功，跳转到单词展示页面
    router.push('/words-display')
  } catch (err) {
    // 显示错误信息
    error.value = err.response?.data?.error || '处理失败，请稍后重试'
    console.error('处理单词时出错:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.input-view {
  max-width: 800px;
  margin: 0 auto;
}

.loading-content {
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.spacer {
  flex: 1;
}

.image-upload-area {
  margin: 1.5rem 0;
}

.upload-container {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
  position: relative;
}

.upload-container:hover {
  border-color: #3498db;
  background-color: #f0f8ff;
}

.upload-container.has-image {
  border-style: solid;
  padding: 0;
  overflow: hidden;
  height: 300px;
}

.upload-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.upload-placeholder {
  color: #666;
}

.upload-hint {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.5rem;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.file-input {
  display: none;
}

.image-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.hint-text {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
}
</style>
