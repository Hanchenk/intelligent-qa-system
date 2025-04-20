const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#1976d2'  // 默认蓝色
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  useCount: {
    type: Number,
    default: 0
  },
  isGlobal: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// 添加索引以支持搜索
tagSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Tag', tagSchema); 