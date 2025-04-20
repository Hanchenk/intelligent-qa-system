const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
  userAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引用于快速查找用户的所有提交记录
submissionSchema.index({ user: 1, submittedAt: -1 });
// 索引用于快速查找题目的所有提交记录
submissionSchema.index({ question: 1, submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema); 