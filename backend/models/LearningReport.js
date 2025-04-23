const mongoose = require('mongoose');

const LearningReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    // 原始JSON数据
    weaknesses: [String],
    improvementSuggestions: [String],
    recommendedResources: [String],
    summary: String
  },
  // Markdown 格式的报告内容
  markdownReport: {
    type: String,
    required: true
  },
  // 报告生成时的错题统计
  mistakeStats: {
    totalMistakes: Number,
    resolvedMistakes: Number,
    mistakeTags: [{
      tag: String,
      count: Number
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LearningReport', LearningReportSchema); 