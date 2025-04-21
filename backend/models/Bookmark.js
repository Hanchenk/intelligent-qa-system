const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exerciseId: {
    type: String,
    required: true
  },
  exerciseTitle: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 创建复合索引确保用户对同一个练习只能收藏一次
BookmarkSchema.index({ user: 1, exerciseId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema); 