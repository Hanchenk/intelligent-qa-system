const mongoose = require('mongoose');

const recommendedQuestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: {
    type: [Object],
    required: true
  },
  mistakeCountVersion: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引以便快速查找特定用户的推荐题目
recommendedQuestionSchema.index({ user: 1 });

module.exports = mongoose.model('RecommendedQuestion', recommendedQuestionSchema); 