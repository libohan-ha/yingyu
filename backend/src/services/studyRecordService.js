const StudyRecord = require('../models/StudyRecord');

/**
 * 保存学习记录
 * @param {Array} words - 学习的单词列表
 * @param {Object} wordMeanings - 单词及其释义的映射
 * @param {String} englishText - 英文文章
 * @param {String} chineseText - 中文翻译
 * @returns {Object} 保存的记录
 */
const saveStudyRecord = async (words, wordMeanings, englishText, chineseText, wordListText) => {
  try {
    console.log('保存学习记录，单词:', words);
    console.log('单词意思类型:', typeof wordMeanings);
    console.log('单词意思:', wordMeanings);
    console.log('原始单词列表文本:', wordListText);

    // 确保 wordMeanings 是一个对象
    let processedMeanings = wordMeanings;

    // 如果 wordMeanings 是 undefined 或 null，创建一个空对象
    if (!wordMeanings) {
      processedMeanings = {};
      console.log('单词意思为空，创建空对象');
    }

    // 直接使用普通对象，不再转换为 Map
    const record = new StudyRecord({
      words,
      wordMeanings: processedMeanings, // 直接使用普通对象
      wordListText, // 保存原始单词列表文本
      englishText,
      chineseText
    });

    const savedRecord = await record.save();
    console.log('学习记录保存成功，ID:', savedRecord._id);
    return savedRecord;
  } catch (error) {
    console.error('保存学习记录失败:', error);
    throw error;
  }
};

/**
 * 获取所有学习记录
 * @returns {Array} 学习记录列表
 */
const getAllStudyRecords = async () => {
  try {
    console.log('获取所有学习记录...');
    const records = await StudyRecord.find().sort({ createdAt: -1 });
    console.log(`找到 ${records.length} 条学习记录`);

    // 检查第一条记录的结构
    if (records.length > 0) {
      const firstRecord = records[0];
      console.log('第一条记录ID:', firstRecord._id);
      console.log('第一条记录单词:', firstRecord.words);
      console.log('第一条记录单词意思类型:', typeof firstRecord.wordMeanings);

      // 处理记录，确保 wordMeanings 是普通对象
      const processedRecords = records.map(record => {
        const processedRecord = record.toObject(); // 转换为普通 JavaScript 对象

        // 如果 wordMeanings 不存在，添加一个空对象
        if (!processedRecord.wordMeanings) {
          processedRecord.wordMeanings = {};
          console.log(`记录 ${processedRecord._id} 没有 wordMeanings，创建空对象`);
        }

        // 确保 wordMeanings 是一个普通对象
        if (typeof processedRecord.wordMeanings !== 'object' || processedRecord.wordMeanings === null) {
          console.log(`记录 ${processedRecord._id} 的 wordMeanings 不是对象，重置为空对象`);
          processedRecord.wordMeanings = {};
        }

        return processedRecord;
      });

      console.log('处理后的第一条记录单词意思:', processedRecords[0].wordMeanings);
      return processedRecords;
    }

    return records;
  } catch (error) {
    console.error('获取学习记录失败:', error);
    throw error;
  }
};

/**
 * 删除学习记录
 * @param {String} recordId - 要删除的记录ID
 * @returns {Object} 删除结果
 */
const deleteStudyRecord = async (recordId) => {
  try {
    console.log('尝试删除学习记录:', recordId);

    // 检查记录是否存在
    const record = await StudyRecord.findById(recordId);
    if (!record) {
      throw new Error('学习记录不存在');
    }

    // 删除记录
    const result = await StudyRecord.findByIdAndDelete(recordId);
    console.log('学习记录删除成功:', result);

    return { success: true, message: '学习记录已删除' };
  } catch (error) {
    console.error('删除学习记录失败:', error);
    throw error;
  }
};

module.exports = {
  saveStudyRecord,
  getAllStudyRecords,
  deleteStudyRecord
};
