const mongoose = require('mongoose');

const mistakeRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  resolved: {
    type: Boolean,
    default: false
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

// 组合索引确保每个用户对同一题目只有一条记录
mistakeRecordSchema.index({ user: 1, question: 1 }, { unique: true });
// 索引用于快速查找用户的所有错题
mistakeRecordSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('MistakeRecord', mistakeRecordSchema); 