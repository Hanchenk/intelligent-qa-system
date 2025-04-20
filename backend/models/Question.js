const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['单选题', '多选题', '判断题', '填空题', '简答题', '编程题'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['简单', '中等', '困难'],
    default: '中等'
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 5
  },
  options: [{
    content: {
      type: String,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    // 单选题和多选题: 正确答案在options中标记
    // 判断题: 布尔值（true/false）
    // 填空题: 字符串，多个空用分号分隔
    // 简答题、编程题: 参考答案文本
  },
  explanation: {
    type: String,
    trim: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  useCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// 添加索引以支持搜索功能
questionSchema.index({ title: 'text', type: 1, difficulty: 1 });

// 更新标签使用计数的中间件
questionSchema.pre('save', async function (next) {
  const Tag = mongoose.model('Tag');
  
  // 如果标签发生了变化
  if (this.isModified('tags')) {
    try {
      // 获取当前标签ID列表
      const currentTagIds = this.tags || [];
      
      // 查询当前文档的原始状态（如果存在）
      let oldTagIds = [];
      if (!this.isNew) {
        const oldDoc = await this.constructor.findById(this._id).select('tags');
        oldTagIds = oldDoc ? oldDoc.tags || [] : [];
      }
      
      // 计算要增加计数的标签（新增的）
      const tagsToIncrement = currentTagIds.filter(tagId => 
        !oldTagIds.some(oldId => oldId.toString() === tagId.toString())
      );
      
      // 计算要减少计数的标签（移除的）
      const tagsToDecrement = oldTagIds.filter(oldId => 
        !currentTagIds.some(tagId => tagId.toString() === oldId.toString())
      );
      
      // 增加新标签的使用计数
      if (tagsToIncrement.length > 0) {
        await Tag.updateMany(
          { _id: { $in: tagsToIncrement } },
          { $inc: { useCount: 1 } }
        );
      }
      
      // 减少移除标签的使用计数
      if (tagsToDecrement.length > 0) {
        await Tag.updateMany(
          { _id: { $in: tagsToDecrement } },
          { $inc: { useCount: -1 } }
        );
      }
    } catch (error) {
      console.error('更新标签计数出错:', error);
    }
  }
  
  next();
});

// 删除文档时减少关联标签的使用计数
questionSchema.pre('deleteOne', { document: true }, async function (next) {
  const Tag = mongoose.model('Tag');
  
  try {
    // 获取当前文档的标签ID列表
    const tagIds = this.tags || [];
    
    // 减少所有关联标签的使用计数
    if (tagIds.length > 0) {
      await Tag.updateMany(
        { _id: { $in: tagIds } },
        { $inc: { useCount: -1 } }
      );
    }
  } catch (error) {
    console.error('删除时更新标签计数出错:', error);
  }
  
  next();
});

module.exports = mongoose.model('Question', questionSchema); 