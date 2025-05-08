/**
 * 单词发音服务
 * 使用有道词典API提供单词发音功能
 */

// 有道词典发音API基础URL
const YOUDAO_VOICE_API = 'https://dict.youdao.com/dictvoice?type=0&audio=';

/**
 * 播放单词发音
 * @param {string} word - 需要发音的单词
 * @returns {Promise<void>} - 播放完成的Promise
 */
export const pronounceWord = (word) => {
  if (!word || typeof word !== 'string') {
    console.warn('无效的单词:', word);
    return Promise.reject(new Error('无效的单词'));
  }

  // 清理单词，移除非字母字符
  const cleanWord = word.trim().replace(/[^a-zA-Z\s-]/g, '');
  
  if (!cleanWord) {
    console.warn('清理后的单词为空:', word);
    return Promise.reject(new Error('清理后的单词为空'));
  }

  // 创建音频元素
  const audio = new Audio(`${YOUDAO_VOICE_API}${encodeURIComponent(cleanWord)}`);
  
  return new Promise((resolve, reject) => {
    audio.onended = resolve;
    audio.onerror = (error) => {
      console.error('播放单词发音失败:', cleanWord, error);
      reject(error);
    };
    
    // 播放音频
    audio.play().catch(error => {
      console.error('播放单词发音失败:', cleanWord, error);
      reject(error);
    });
  });
};

/**
 * 检查浏览器是否支持音频播放
 * @returns {boolean} - 是否支持音频播放
 */
export const isAudioSupported = () => {
  return typeof Audio !== 'undefined';
};
