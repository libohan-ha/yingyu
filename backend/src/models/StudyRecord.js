const mongoose = require('mongoose');

const StudyRecordSchema = new mongoose.Schema({
  words: {
    type: [String],
    required: true
  },
  wordMeanings: {
    type: Object,  // 普通对象类型，而不是 Map
    required: false
  },
  wordListText: {
    type: String,  // 添加新字段，存储原始单词列表文本
    required: false
  },
  englishText: {
    type: String,
    required: false
  },
  chineseText: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudyRecord', StudyRecordSchema);
