<template>
  <div class="test-image-upload">
    <h2>测试图片上传</h2>
    
    <div class="card">
      <h3>上传图片测试</h3>
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
          <button class="btn btn-primary ml-2" @click="processImage">处理图片</button>
        </div>
      </div>
    </div>
    
    <!-- 处理结果 -->
    <div v-if="result" class="card mt-3">
      <h3>处理结果</h3>
      <div class="result-section">
        <h4>识别的文本:</h4>
        <div class="result-text">{{ result.articleEn }}</div>
      </div>
      
      <div class="result-section mt-2" v-if="result.words && result.words.length > 0">
        <h4>识别的单词:</h4>
        <div class="word-chips">
          <span class="word-chip" v-for="(word, index) in result.words" :key="index">
            {{ word }}
          </span>
        </div>
      </div>
      
      <div class="result-section mt-2" v-if="result.wordMeanings">
        <h4>单词释义:</h4>
        <div class="word-meanings">
          <div class="word-meaning-item" v-for="(word, index) in result.words" :key="index">
            <strong>{{ word }}:</strong> {{ result.wordMeanings[word] || '未找到释义' }}
          </div>
        </div>
      </div>
      
      <div class="actions mt-3">
        <button class="btn btn-success" @click="continueToArticle">
          继续学习
        </button>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="alert alert-danger mt-3">
      {{ error }}
    </div>
    
    <!-- 加载指示器 -->
    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="mt-2">正在处理图片，请稍候...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '../store/learningStore'

const router = useRouter()
const learningStore = useLearningStore()

// 响应式状态
const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)
const isProcessing = ref(false)
const error = ref('')
const result = ref(null)

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
  result.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 处理图片
const processImage = async () => {
  if (!selectedFile.value) {
    error.value = '请先选择图片'
    return
  }
  
  try {
    isProcessing.value = true
    error.value = ''
    
    // 读取图片为base64
    const imageData = await new Promise((resolve, reject) => {
      const reader = new FileReader()
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
      body: JSON.stringify({ 
        imageData,
        apiKey: 'sk-55c3340169734c20b4c13c1719e8cd8c' // 使用提供的API Key
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '图片处理失败')
    }
    
    const data = await response.json()
    result.value = data
    
    // 保存处理结果到store
    learningStore.setArticleEn(data.articleEn)
    learningStore.setArticleZh(data.articleZh)
    
    // 保存翻译结果
    if (data.wordMeanings) {
      learningStore.setWordMeanings(data.wordMeanings)
    }
    
    // 保存高亮数据
    if (data.highlightData) {
      learningStore.setHighlightData(data.highlightData)
    }
    
    // 设置当前会话ID
    if (data.sessionId) {
      learningStore.setCurrentSession(data.sessionId)
    }
    
    // 设置输入的单词
    if (data.words && data.words.length > 0) {
      learningStore.setInputWords(data.words)
    }
    
  } catch (err) {
    console.error('图片处理失败:', err)
    error.value = '图片处理失败: ' + (err.message || '未知错误')
  } finally {
    isProcessing.value = false
  }
}

// 继续到文章页面
const continueToArticle = () => {
  router.push('/words-display')
}
</script>

<style scoped>
.test-image-upload {
  max-width: 800px;
  margin: 0 auto;
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

.result-section {
  margin-bottom: 1.5rem;
}

.result-text {
  background-color: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 0.95rem;
  line-height: 1.6;
}

.word-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.word-chip {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 0.3rem 0.8rem;
  border-radius: 16px;
  font-size: 0.9rem;
  display: inline-block;
}

.word-meanings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.word-meaning-item {
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.word-meaning-item:last-child {
  border-bottom: none;
}

.ml-2 {
  margin-left: 0.75rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
