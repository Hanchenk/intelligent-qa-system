/**
 * 答题记录服务
 * 用于管理学生的答题记录、分数统计和进度跟踪
 */

// 用于生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * 保存练习记录
 * @param {Object} record - 练习记录对象
 * @returns {Object} 保存的记录，带有ID和时间戳
 */
export const saveExerciseRecord = (record) => {
  try {
    // 确保有用户ID
    if (!record.userId) {
      console.error('保存记录失败：缺少用户ID');
      return null;
    }

    // 获取现有记录
    const existingRecords = getExerciseRecords() || [];
    
    // 创建新记录
    const newRecord = {
      ...record,
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'exercise'
    };
    
    // 添加到记录列表并保存
    const updatedRecords = [newRecord, ...existingRecords];
    localStorage.setItem('qa_records', JSON.stringify(updatedRecords));
    
    // 更新统计信息
    updateStatistics(newRecord);
    
    return newRecord;
  } catch (error) {
    console.error('保存练习记录失败:', error);
    return null;
  }
};

/**
 * 获取所有答题记录
 * @param {string} userId - 用户ID
 * @returns {Array} 用户的所有答题记录
 */
export const getExerciseRecords = (userId = null) => {
  try {
    const records = JSON.parse(localStorage.getItem('qa_records') || '[]');
    
    // 如果提供了用户ID，只返回该用户的记录
    if (userId) {
      return records.filter(record => record.userId === userId);
    }
    
    return records;
  } catch (error) {
    console.error('获取练习记录失败:', error);
    return [];
  }
};

/**
 * 获取特定记录
 * @param {string} recordId - 记录ID
 * @returns {Object|null} 找到的记录或null
 */
export const getRecordById = (recordId) => {
  try {
    const records = getExerciseRecords();
    return records.find(record => record.id === recordId) || null;
  } catch (error) {
    console.error('获取记录失败:', error);
    return null;
  }
};

/**
 * 删除记录
 * @param {string} recordId - 要删除的记录ID
 * @returns {boolean} 是否成功删除
 */
export const deleteRecord = (recordId) => {
  try {
    const records = getExerciseRecords();
    const filteredRecords = records.filter(record => record.id !== recordId);
    
    if (filteredRecords.length < records.length) {
      localStorage.setItem('qa_records', JSON.stringify(filteredRecords));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('删除记录失败:', error);
    return false;
  }
};

/**
 * 获取用户的错题集
 * @param {string} userId - 用户ID
 * @returns {Array} 错题列表
 */
export const getMistakes = (userId) => {
  try {
    if (!userId) return [];
    
    // 尝试从localStorage获取记录
    const records = getExerciseRecords(userId);
    
    // 如果没有记录，返回空数组
    if (!Array.isArray(records) || records.length === 0) {
      console.log('用户没有练习记录，无法生成错题');
      return [];
    }
    
    const mistakeMap = new Map();
    
    // 遍历所有记录，收集错题
    records.forEach(record => {
      const { questions, answers, results } = record;
      
      if (!questions || !answers) {
        console.log('记录缺少问题或答案数据', record.id);
        return;
      }
      
      // 使用正确的答案字段名称
      const userAnswers = answers;
      
      questions.forEach((question, index) => {
        // 检查答案是否正确
        let isCorrect = false;
        
        // 首先检查结果对象中是否有明确的正确/错误标记
        if (results && results.questionResults && results.questionResults[index]) {
          isCorrect = results.questionResults[index].isCorrect;
        } else {
          // 如果没有明确标记，自行判断
          if (question.type === '多选题') {
            const userAnswer = userAnswers[question.id] || [];
            const correctAnswer = question.correctAnswer || [];
            
            isCorrect = userAnswer.length === correctAnswer.length && 
              correctAnswer.every(value => userAnswer.includes(value));
          } else if (question.type === '编程题' || question.type === '填空题' || question.type === '简答题') {
            // 这些题型需要评分，默认假设错误
            isCorrect = false;
          } else {
            isCorrect = userAnswers[question.id] === question.correctAnswer;
          }
        }
        
        // 如果答错了，将题目添加到错题集
        if (!isCorrect) {
          // 确保题目有基本属性
          const safeQuestion = {
            ...question,
            // 确保选择题有options数组
            options: question.type === '单选题' || question.type === '多选题' 
              ? (Array.isArray(question.options) ? question.options : [])
              : [],
            // 确保多选题的答案是数组
            correctAnswer: question.type === '多选题' && !Array.isArray(question.correctAnswer)
              ? []
              : question.correctAnswer,
          };
          
          // 使用题目ID作为键，避免重复
          if (!mistakeMap.has(question.id)) {
            mistakeMap.set(question.id, {
              question: safeQuestion,
              count: 1,
              lastWrongTime: record.date || record.timestamp,
              userAnswer: userAnswers[question.id]
            });
          } else {
            const mistakeEntry = mistakeMap.get(question.id);
            mistakeMap.set(question.id, {
              ...mistakeEntry,
              count: mistakeEntry.count + 1,
              lastWrongTime: record.date || record.timestamp,
              userAnswer: userAnswers[question.id]
            });
          }
        }
      });
    });
    
    // 转换为数组并按最近错误时间排序
    return Array.from(mistakeMap.values())
      .sort((a, b) => new Date(b.lastWrongTime) - new Date(a.lastWrongTime));
  } catch (error) {
    console.error('获取错题集失败:', error);
    // 返回空数组，而不是抛出错误
    return [];
  }
};

/**
 * 获取用户的学习统计数据
 * @param {string} userId - 用户ID
 * @returns {Object} 统计数据
 */
export const getUserStatistics = (userId) => {
  try {
    if (!userId) return null;
    
    // 尝试从localStorage获取统计信息
    const statsString = localStorage.getItem(`qa_stats_${userId}`);
    if (statsString) {
      return JSON.parse(statsString);
    }
    
    // 如果没有统计信息，则计算
    const records = getExerciseRecords(userId);
    if (!records.length) {
      return {
        userId,
        totalExercises: 0,
        totalQuestions: 0,
        correctQuestions: 0,
        totalScore: 0,
        averageScore: 0,
        exercisesByCategory: {},
        recentScores: [],
        strongTopics: [],
        weakTopics: []
      };
    }
    
    // 计算初始统计数据
    const stats = calculateStatistics(records, userId);
    
    // 保存统计数据
    localStorage.setItem(`qa_stats_${userId}`, JSON.stringify(stats));
    
    return stats;
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    return null;
  }
};

/**
 * 计算统计数据
 * @param {Array} records - 练习记录
 * @param {string} userId - 用户ID
 * @returns {Object} 统计数据
 */
const calculateStatistics = (records, userId) => {
  // 初始化统计信息
  const stats = {
    userId,
    totalExercises: 0,
    totalQuestions: 0,
    correctQuestions: 0,
    totalScore: 0,
    averageScore: 0,
    exercisesByCategory: {},
    recentScores: [],
    strongTopics: [],
    weakTopics: [],
    lastUpdated: new Date().toISOString()
  };
  
  // 用于跟踪主题正确率
  const topicStats = new Map();
  
  // 遍历所有记录
  records.forEach(record => {
    if (record.type !== 'exercise') return;
    
    stats.totalExercises++;
    
    // 如果没有结果信息，跳过
    if (!record.results) return;
    
    const { questions, results, tags = [] } = record;
    
    // 添加分数到最近成绩
    if (results.percentage !== undefined) {
      stats.recentScores.push({
        exerciseId: record.exerciseId,
        exerciseTitle: record.exerciseTitle || `练习 ${record.exerciseId}`,
        score: results.percentage,
        timestamp: record.timestamp
      });
    }
    
    // 更新总分
    if (results.totalScore !== undefined && results.maxScore !== undefined) {
      stats.totalScore += results.totalScore;
      stats.totalQuestions += results.maxScore;
      stats.correctQuestions += results.correctCount || 0;
    }
    
    // 按分类统计
    tags.forEach(tag => {
      if (!stats.exercisesByCategory[tag]) {
        stats.exercisesByCategory[tag] = {
          count: 0,
          totalScore: 0,
          averageScore: 0
        };
      }
      
      stats.exercisesByCategory[tag].count++;
      stats.exercisesByCategory[tag].totalScore += results.percentage || 0;
      stats.exercisesByCategory[tag].averageScore = 
        stats.exercisesByCategory[tag].totalScore / stats.exercisesByCategory[tag].count;
    });
    
    // 统计主题正确率
    if (questions && Array.isArray(questions)) {
      questions.forEach((question, index) => {
        // 获取题目的分类（可以从题目属性或者练习标签推断）
        const topics = question.tags || tags;
        
        topics.forEach(topic => {
          if (!topicStats.has(topic)) {
            topicStats.set(topic, { correct: 0, total: 0 });
          }
          
          const topicStat = topicStats.get(topic);
          topicStat.total++;
          
          // 检查是否回答正确
          if (results.questionResults?.[index]?.isCorrect) {
            topicStat.correct++;
          }
        });
      });
    }
  });
  
  // 计算平均分
  if (stats.totalExercises > 0) {
    stats.averageScore = stats.totalScore / stats.totalQuestions * 100 || 0;
  }
  
  // 只保留最近10次的成绩
  stats.recentScores = stats.recentScores
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  
  // 计算强项和弱项
  const topicAccuracy = Array.from(topicStats.entries())
    .map(([topic, stat]) => ({
      topic,
      accuracy: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
      total: stat.total
    }))
    .filter(item => item.total >= 3); // 至少回答过3题才统计
  
  if (topicAccuracy.length > 0) {
    // 按正确率排序
    const sortedTopics = [...topicAccuracy].sort((a, b) => b.accuracy - a.accuracy);
    
    // 强项是正确率最高的前3个
    stats.strongTopics = sortedTopics.slice(0, 3)
      .map(item => ({ topic: item.topic, accuracy: item.accuracy }));
    
    // 弱项是正确率最低的前3个
    stats.weakTopics = sortedTopics.slice(-3)
      .map(item => ({ topic: item.topic, accuracy: item.accuracy }))
      .reverse();
  }
  
  return stats;
};

/**
 * 更新用户统计信息
 * @param {Object} newRecord - 新的练习记录
 */
const updateStatistics = (newRecord) => {
  if (!newRecord.userId) return;
  
  try {
    const userId = newRecord.userId;
    const stats = getUserStatistics(userId);
    
    if (!stats) return;
    
    // 增加练习总数
    stats.totalExercises++;
    
    // 如果有结果信息
    if (newRecord.results) {
      const { results, tags = [] } = newRecord;
      
      // 添加分数到最近成绩
      if (results.percentage !== undefined) {
        stats.recentScores.unshift({
          exerciseId: newRecord.exerciseId,
          exerciseTitle: newRecord.exerciseTitle || `练习 ${newRecord.exerciseId}`,
          score: results.percentage,
          timestamp: newRecord.timestamp
        });
        
        // 只保留最近10次
        stats.recentScores = stats.recentScores.slice(0, 10);
      }
      
      // 更新总分
      if (results.totalScore !== undefined && results.maxScore !== undefined) {
        stats.totalScore += results.totalScore;
        stats.totalQuestions += results.maxScore;
        stats.correctQuestions += results.correctCount || 0;
        stats.averageScore = stats.totalQuestions > 0 ? 
          (stats.totalScore / stats.totalQuestions * 100) : 0;
      }
      
      // 按分类统计
      tags.forEach(tag => {
        if (!stats.exercisesByCategory[tag]) {
          stats.exercisesByCategory[tag] = {
            count: 0,
            totalScore: 0,
            averageScore: 0
          };
        }
        
        stats.exercisesByCategory[tag].count++;
        stats.exercisesByCategory[tag].totalScore += results.percentage || 0;
        stats.exercisesByCategory[tag].averageScore = 
          stats.exercisesByCategory[tag].totalScore / stats.exercisesByCategory[tag].count;
      });
    }
    
    // 更新时间戳
    stats.lastUpdated = new Date().toISOString();
    
    // 保存更新后的统计信息
    localStorage.setItem(`qa_stats_${userId}`, JSON.stringify(stats));
    
    // 需要定期重新计算强项和弱项，但不是每次都计算
    // 这里简化处理，后续可以根据lastUpdated判断是否需要完全重新计算
  } catch (error) {
    console.error('更新统计信息失败:', error);
  }
};

/**
 * 导出用户的学习数据
 * @param {string} userId - 用户ID
 * @returns {Object} 包含所有学习数据的对象
 */
export const exportUserData = (userId) => {
  if (!userId) return null;
  
  try {
    const stats = getUserStatistics(userId);
    const records = getExerciseRecords(userId);
    const mistakes = getMistakes(userId);
    
    return {
      userId,
      stats,
      records,
      mistakes,
      exportTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('导出用户数据失败:', error);
    return null;
  }
};

/**
 * 导入用户的学习数据
 * @param {Object} data - 导入的数据
 * @returns {boolean} 是否成功导入
 */
export const importUserData = (data) => {
  if (!data || !data.userId) return false;
  
  try {
    const { userId, records } = data;
    
    // 导入记录
    if (records && Array.isArray(records)) {
      // 获取现有记录
      const existingRecords = getExerciseRecords() || [];
      
      // 合并记录，去重
      const recordIds = new Set(existingRecords.map(r => r.id));
      const newRecords = existingRecords.slice();
      
      records.forEach(record => {
        if (!recordIds.has(record.id)) {
          newRecords.push(record);
          recordIds.add(record.id);
        }
      });
      
      // 保存合并后的记录
      localStorage.setItem('qa_records', JSON.stringify(newRecords));
    }
    
    // 重新计算统计信息
    const allRecords = getExerciseRecords(userId);
    const stats = calculateStatistics(allRecords, userId);
    localStorage.setItem(`qa_stats_${userId}`, JSON.stringify(stats));
    
    return true;
  } catch (error) {
    console.error('导入用户数据失败:', error);
    return false;
  }
}; 