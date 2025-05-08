const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Schema definition based on our project requirements
const LearningSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true,
    default: () => uuidv4()
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  inputWords: [String],
  wordMeanings: {
    type: Map,
    of: String
  },
  articleEn: String,
  articleZh: String,
  highlightData: [{
    word: String,
    meaning: String,
    positions: [{
      start: Number
    }]
  }],
  source: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  // Optional - for future enhancements
  reviewStatus: [{
    word: String,
    forgottenCount: {
      type: Number,
      default: 0
    },
    lastReviewed: Date
  }]
});

// Virtual getter for summary display in history list
LearningSessionSchema.virtual('summary').get(function() {
  return {
    sessionId: this.sessionId,
    date: this.createdAt,
    firstWord: this.inputWords[0] || '',
    wordCount: this.inputWords.length,
    previewText: this.articleEn ? this.articleEn.substring(0, 100) + '...' : ''
  };
});

// Set to make virtuals show up in JSON
LearningSessionSchema.set('toJSON', { virtuals: true });
LearningSessionSchema.set('toObject', { virtuals: true });

const LearningSession = mongoose.model('LearningSession', LearningSessionSchema);

module.exports = LearningSession;
