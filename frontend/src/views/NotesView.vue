<template>
  <div class="notes-view">
    <h2>学习笔记记录</h2>

    <div class="card">
      <h3>{{ isEditing ? '编辑笔记' : '添加新笔记' }}</h3>
      <div class="form-group">
        <label for="noteTitle">标题</label>
        <input
          type="text"
          id="noteTitle"
          v-model="noteTitle"
          class="form-control"
          placeholder="例如：今日学习单词总结"
        />
      </div>

      <div class="form-group mt-3">
        <label for="noteWords">学到的单词</label>
        <textarea
          id="noteWords"
          v-model="noteWords"
          class="form-control"
          placeholder="输入您学到的单词，每行一个或用逗号分隔"
          rows="4"
        ></textarea>
      </div>

      <div class="form-group mt-3">
        <label for="noteContent">知识点和笔记</label>
        <textarea
          id="noteContent"
          v-model="noteContent"
          class="form-control"
          placeholder="记录您学到的知识点、句型、用法等"
          rows="6"
        ></textarea>
      </div>

      <div class="form-actions mt-3">
        <button
          v-if="!isEditing"
          class="btn btn-primary"
          @click="saveNote"
          :disabled="isSaving || !canSave"
        >
          {{ isSaving ? '保存中...' : '保存笔记' }}
        </button>

        <template v-else>
          <button
            class="btn btn-success"
            @click="updateNote"
            :disabled="isSaving || !canSave"
          >
            {{ isSaving ? '更新中...' : '更新笔记' }}
          </button>

          <button
            class="btn btn-secondary ml-2"
            @click="cancelEdit"
            :disabled="isSaving"
          >
            取消
          </button>
        </template>
      </div>
    </div>

    <!-- 笔记列表 -->
    <div class="card mt-4">
      <h3>我的笔记列表</h3>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-center">
        <div class="loading-spinner"></div>
        <p class="mt-2">加载笔记中...</p>
      </div>

      <!-- 无笔记提示 -->
      <div v-else-if="notes.length === 0" class="empty-state">
        <p>您还没有保存任何笔记。</p>
      </div>

      <!-- 笔记列表 -->
      <div v-else class="notes-list">
        <div v-for="note in notes" :key="note._id" class="note-item">
          <div class="note-header">
            <h4>{{ note.title }}</h4>
            <span class="note-date">{{ formatDate(note.createdAt) }}</span>
          </div>

          <div v-if="note.words && note.words.length > 0" class="note-words">
            <div class="words-header">
              <strong>单词列表</strong>
              <span class="word-count">({{ note.words.length }}个)</span>
            </div>
            <div class="word-tag" v-for="(word, index) in note.words" :key="index">
              {{ word }}
            </div>
          </div>

          <div class="note-content">
            <p>{{ note.content }}</p>
          </div>

          <div class="note-actions">
            <button class="btn btn-sm btn-primary" @click="editNote(note)">
              编辑
            </button>
            <button class="btn btn-sm btn-danger ml-2" @click="deleteNote(note._id)">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="alert alert-danger mt-3">
      <strong>错误：</strong> {{ error }}
      <div v-if="detailedError" class="error-details mt-2">
        <small>{{ detailedError }}</small>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMessage" class="alert alert-success mt-3">
      <strong>成功：</strong> {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import * as noteService from '../services/noteService'

// 确保 axios 请求带有凭证
axios.defaults.withCredentials = true

// 状态
const noteTitle = ref('')
const noteWords = ref('')
const noteContent = ref('')
const notes = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')
const detailedError = ref('')
const successMessage = ref('')
const isEditing = ref(false)
const editingNoteId = ref(null)

// 计算属性：验证表单是否可提交
const canSave = computed(() => {
  return noteTitle.value.trim() !== '' &&
         (noteWords.value.trim() !== '' || noteContent.value.trim() !== '')
})

// 解析输入的单词
const parseWords = (input) => {
  if (!input || input.trim() === '') return []

  // 处理逗号分隔或换行分隔的情况
  return input.split(/[,\n]/)
    .map(word => word.trim())
    .filter(word => word !== '') // 过滤空值
}

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

// 保存笔记
const saveNote = async () => {
  if (!canSave.value) return

  error.value = ''
  successMessage.value = ''
  isSaving.value = true

  try {
    const words = parseWords(noteWords.value)

    // 打印请求数据，用于调试
    console.log('正在发送笔记数据:', {
      title: noteTitle.value,
      words: words,
      content: noteContent.value
    })

    const response = await axios.post('/api/notes', {
      title: noteTitle.value,
      words: words,
      content: noteContent.value
    })

    // 打印响应数据，用于调试
    console.log('服务器响应:', response.data)

    // 添加新笔记到列表
    notes.value.unshift(response.data)

    // 清空表单
    noteTitle.value = ''
    noteWords.value = ''
    noteContent.value = ''

    // 显示成功消息
    successMessage.value = '笔记保存成功！'

    // 3秒后清除成功消息
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    // 详细记录错误信息
    console.error('保存笔记失败:', err)
    console.error('错误详情:', {
      message: err.message,
      response: err.response,
      request: err.request
    })

    // 重置错误信息
    error.value = ''
    detailedError.value = ''

    // 显示更详细的错误信息
    if (err.response) {
      // 服务器返回了错误响应
      error.value = `服务器错误 (${err.response.status}): ${err.response?.data?.error || err.message}`
      detailedError.value = JSON.stringify(err.response.data, null, 2)
    } else if (err.request) {
      // 请求已发送但没有收到响应
      error.value = '无法连接到服务器，请检查网络连接'
      detailedError.value = '请求已发送，但未收到服务器响应。可能是网络问题或服务器未运行。'
    } else {
      // 请求设置时出错
      error.value = `请求错误: ${err.message}`
      detailedError.value = err.stack
    }
  } finally {
    isSaving.value = false
  }
}

// 删除笔记
const deleteNote = async (noteId) => {
  if (!confirm('确定要删除这条笔记吗？此操作不可恢复。')) {
    return
  }

  error.value = ''

  try {
    await axios.delete(`/api/notes/${noteId}`)

    // 从列表中移除
    notes.value = notes.value.filter(note => note._id !== noteId)

    // 显示成功消息
    successMessage.value = '笔记已成功删除'

    // 3秒后清除成功消息
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('删除笔记失败:', err)
    error.value = err.response?.data?.error || '删除笔记失败，请稍后重试'
  }
}

// 加载笔记列表
const loadNotes = async () => {
  isLoading.value = true
  error.value = ''

  try {
    console.log('正在加载笔记列表...')
    const response = await axios.get('/api/notes')
    console.log('笔记列表加载成功:', response.data)
    notes.value = response.data
  } catch (err) {
    console.error('加载笔记失败:', err)
    console.error('错误详情:', {
      message: err.message,
      response: err.response,
      request: err.request
    })

    // 重置错误信息
    error.value = ''
    detailedError.value = ''

    // 显示更详细的错误信息
    if (err.response) {
      error.value = `服务器错误 (${err.response.status}): ${err.response?.data?.error || err.message}`
      detailedError.value = JSON.stringify(err.response.data, null, 2)
    } else if (err.request) {
      error.value = '无法连接到服务器，请检查网络连接'
      detailedError.value = '请求已发送，但未收到服务器响应。可能是网络问题或服务器未运行。'
    } else {
      error.value = `请求错误: ${err.message}`
      detailedError.value = err.stack
    }
  } finally {
    isLoading.value = false
  }
}

// 编辑笔记
const editNote = (note) => {
  // 设置编辑状态
  isEditing.value = true
  editingNoteId.value = note._id

  // 填充表单
  noteTitle.value = note.title
  noteWords.value = note.words ? note.words.join(', ') : ''
  noteContent.value = note.content || ''

  // 滚动到表单
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 取消编辑
const cancelEdit = () => {
  // 重置编辑状态
  isEditing.value = false
  editingNoteId.value = null

  // 清空表单
  noteTitle.value = ''
  noteWords.value = ''
  noteContent.value = ''
}

// 更新笔记
const updateNote = async () => {
  if (!canSave.value || !editingNoteId.value) return

  error.value = ''
  successMessage.value = ''
  isSaving.value = true

  try {
    const words = parseWords(noteWords.value)

    console.log('正在更新笔记:', {
      id: editingNoteId.value,
      title: noteTitle.value,
      words: words,
      content: noteContent.value
    })

    const response = await axios.put(`/api/notes/${editingNoteId.value}`, {
      title: noteTitle.value,
      words: words,
      content: noteContent.value
    })

    console.log('更新成功:', response.data)

    // 更新列表中的笔记
    const index = notes.value.findIndex(note => note._id === editingNoteId.value)
    if (index !== -1) {
      notes.value[index] = response.data
    }

    // 重置编辑状态
    isEditing.value = false
    editingNoteId.value = null

    // 清空表单
    noteTitle.value = ''
    noteWords.value = ''
    noteContent.value = ''

    // 显示成功消息
    successMessage.value = '笔记更新成功！'

    // 3秒后清除成功消息
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    // 详细记录错误信息
    console.error('更新笔记失败:', err)
    console.error('错误详情:', {
      message: err.message,
      response: err.response,
      request: err.request
    })

    // 重置错误信息
    error.value = ''
    detailedError.value = ''

    // 显示更详细的错误信息
    if (err.response) {
      // 服务器返回了错误响应
      error.value = `服务器错误 (${err.response.status}): ${err.response?.data?.error || err.message}`
      detailedError.value = JSON.stringify(err.response.data, null, 2)
    } else if (err.request) {
      // 请求已发送但没有收到响应
      error.value = '无法连接到服务器，请检查网络连接'
      detailedError.value = '请求已发送，但未收到服务器响应。可能是网络问题或服务器未运行。'
    } else {
      // 请求设置时出错
      error.value = `请求错误: ${err.message}`
      detailedError.value = err.stack
    }
  } finally {
    isSaving.value = false
  }
}

// 组件挂载时加载笔记
onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.notes-view {
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
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
  color: #666;
}

.notes-list {
  margin-top: 1rem;
}

.note-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f9f9f9;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.note-header h4 {
  margin: 0;
  color: #2c3e50;
}

.note-date {
  font-size: 0.8rem;
  color: #777;
}

.note-words {
  margin: 0.75rem 0;
  padding: 0.5rem;
  background-color: #f5f9fc; /* 添加浅色背景 */
  border-radius: 4px;
  border: 1px solid #e0e0e0; /* 添加边框 */
}

.word-tag {
  display: block; /* 改为块级元素，使每个单词占据一行 */
  background-color: #e1f5fe;
  color: #0277bd;
  padding: 0.5rem 0.75rem; /* 增加内边距使单词更突出 */
  border-radius: 4px;
  margin-bottom: 0.5rem; /* 保留底部间距 */
  font-size: 0.95rem; /* 稍微增大字体 */
  width: 100%; /* 占满整行 */
  box-sizing: border-box; /* 确保内边距不会增加元素宽度 */
  border-left: 3px solid #0277bd; /* 添加左侧边框增强视觉效果 */
}

.words-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.word-count {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.note-content {
  margin: 0.5rem 0;
  white-space: pre-line;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-success {
  background-color: #28a745;
  color: white;
  border: none;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
}

.btn-secondary:hover {
  background-color: #5a6268;
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

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.ml-2 {
  margin-left: 0.5rem;
}

.error-details {
  background-color: #f8f8f8;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
}
</style>
