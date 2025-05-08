import { defineStore } from 'pinia'
import axios from 'axios'

export const useLearningStore = defineStore('learning', {
  state: () => ({
    apiKey: '',
    inputWords: [],
    wordMeanings: {},
    wordListText: '', // 添加原始单词列表文本
    articleEn: '',
    articleZh: '',
    highlightData: [],
    isLoading: false,
    error: null,
    currentSession: null,
    uploadedImage: null
  }),

  getters: {
    hasWordData: (state) => Object.keys(state.wordMeanings).length > 0,
    hasArticleData: (state) => state.articleEn && state.articleZh,
    getWordMeaning: (state) => (word) => state.wordMeanings[word] || '未找到释义',
    hasUploadedImage: (state) => !!state.uploadedImage
  },

  actions: {
    // 设置API Key
    setApiKey(key) {
      this.apiKey = key
    },

    // 设置输入的单词列表
    setInputWords(words) {
      console.log('learningStore: 设置输入的单词列表', words)
      this.inputWords = words
    },

    // 设置原始单词列表文本
    setWordListText(text) {
      console.log('learningStore: 设置原始单词列表文本')
      this.wordListText = text
    },

    // 设置单词释义
    setWordMeanings(meanings) {
      console.log('learningStore: 设置单词释义')
      this.wordMeanings = meanings
    },

    // 设置英文文章
    setArticleEn(article) {
      console.log('learningStore: 设置英文文章', article ? article.substring(0, 50) + '...' : 'null')
      this.articleEn = article
    },

    // 设置中文文章
    setArticleZh(article) {
      console.log('learningStore: 设置中文文章', article ? article.substring(0, 50) + '...' : 'null')
      this.articleZh = article
    },

    // 重置学习状态
    resetLearningState() {
      this.inputWords = []
      this.wordMeanings = {}
      this.wordListText = ''
      this.articleEn = ''
      this.articleZh = ''
      this.highlightData = []
      this.error = null
      this.currentSession = null
    },

    // 处理单词列表及生成文章
    async processWords(words) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.post('/api/process', {
          apiKey: this.apiKey,
          words: words
        })

        const data = response.data
        this.wordMeanings = data.wordMeanings
        this.articleEn = data.articleEn
        this.articleZh = data.articleZh
        this.highlightData = data.highlightData
        this.currentSession = data.sessionId
        this.inputWords = words

        return data
      } catch (err) {
        this.error = err.response?.data?.error || '处理失败，请稍后重试'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // 从会话中加载数据
    async loadSessionData(sessionId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.get(`/api/history/${sessionId}`)
        const data = response.data

        this.inputWords = data.inputWords
        this.wordMeanings = data.wordMeanings
        this.articleEn = data.articleEn
        this.articleZh = data.articleZh
        this.highlightData = data.highlightData
        this.currentSession = data.sessionId

        return data
      } catch (err) {
        this.error = err.response?.data?.error || '加载会话数据失败'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // 设置上传的图片
    setUploadedImage(imageData) {
      this.uploadedImage = imageData
    },

    // 重置图片
    resetUploadedImage() {
      this.uploadedImage = null
    },



    // 设置高亮数据
    setHighlightData(data) {
      this.highlightData = data
    },

    // 设置当前会话ID
    setCurrentSession(sessionId) {
      this.currentSession = sessionId
    }
  }
})
