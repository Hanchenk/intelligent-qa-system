const mongoose = require('mongoose');

const LearningProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  uniqueAnswered: {
    type: Number,
    default: 0
  },
  totalAnswered: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  tagMastery: [{
    tag: String,
    correct: Number,
    total: Number,
    percentage: Number,
    exerciseCount: Number
  }],
  strongTopics: [{
    tag: String,
    percentage: Number
  }],
  weakTopics: [{
    tag: String,
    percentage: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('LearningProgress', LearningProgressSchema); 