/**
 * 学习记录服务
 * 用于与后端 API 交互，保存、获取和删除学习记录
 */

// 保存学习记录
export const saveStudyRecord = async (words, wordMeanings, englishText, chineseText, wordListText) => {
  try {
    const response = await fetch('/api/study-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        words,
        wordMeanings,
        englishText,
        chineseText,
        wordListText // 添加原始单词列表文本
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '保存学习记录失败');
    }

    return await response.json();
  } catch (error) {
    console.error('保存学习记录失败:', error);
    throw error;
  }
};

// 获取所有学习记录
export const getAllStudyRecords = async () => {
  try {
    const response = await fetch('/api/study-records');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取学习记录失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取学习记录失败:', error);
    throw error;
  }
};

// 删除学习记录
export const deleteStudyRecord = async (recordId) => {
  try {
    console.log('尝试删除学习记录:', recordId);

    const response = await fetch(`/api/study-records/${recordId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除学习记录失败');
    }

    return await response.json();
  } catch (error) {
    console.error('删除学习记录失败:', error);
    throw error;
  }
};
