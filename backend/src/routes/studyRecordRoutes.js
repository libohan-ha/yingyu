const express = require('express');
const router = express.Router();
const { saveStudyRecord, getAllStudyRecords, deleteStudyRecord } = require('../services/studyRecordService');

// 保存学习记录
router.post('/', async (req, res) => {
  try {
    const { words, wordMeanings, englishText, chineseText, wordListText } = req.body;

    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ message: '单词列表是必需的' });
    }

    const record = await saveStudyRecord(words, wordMeanings, englishText, chineseText, wordListText);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: '保存学习记录失败', error: error.message });
  }
});

// 获取所有学习记录
router.get('/', async (req, res) => {
  try {
    const records = await getAllStudyRecords();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: '获取学习记录失败', error: error.message });
  }
});

// 删除学习记录
router.delete('/:id', async (req, res) => {
  try {
    const recordId = req.params.id;

    if (!recordId) {
      return res.status(400).json({ message: '记录ID是必需的' });
    }

    const result = await deleteStudyRecord(recordId);
    res.status(200).json(result);
  } catch (error) {
    console.error('删除学习记录路由错误:', error);
    res.status(error.message === '学习记录不存在' ? 404 : 500)
      .json({ message: '删除学习记录失败', error: error.message });
  }
});

module.exports = router;
