/**
 * 答题记录服务
 * 用于管理学生的答题记录、分数统计和进度跟踪
 */

// API基础URL
const apiBaseUrl = 'http://localhost:3001';

// 用于生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * 从数据库获取错题本
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 错题列表
 */
export const getMistakesFromDB = async (userId) => {
  try {
    if (!userId) return [];
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('未找到认证令牌');
      return [];
    }
    
    const response = await fetch(`${apiBaseUrl}/api/mistakes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('获取错题失败');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '获取错题失败');
    }
    
    // 转换后端数据为前端需要的格式
    return result.data.map(item => ({
      id: item._id,
      question: {
        id: item.question._id,
        title: item.question.title,
        type: item.question.type,
        options: item.question.options,
        correctAnswer: item.question.correctAnswer,
        explanation: item.question.explanation,
        tags: item.question.tags.map(tag => typeof tag === 'object' ? tag.name : tag)
      },
      count: item.count || 1,
      lastWrongTime: item.updatedAt,
      userAnswer: item.submission ? item.submission.userAnswer : null,
      notes: item.notes,
      resolved: item.resolved
    }));
  } catch (error) {
    console.error('获取错题集失败:', error);
    return [];
  }
};

/**
 * 标记错题为已解决/未解决
 * @param {string} mistakeId - 错题记录ID 
 * @param {boolean} isResolved - 是否已解决
 * @returns {Promise<boolean>} 是否更新成功
 */
export const updateMistakeStatus = async (mistakeId, isResolved) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('未找到认证令牌');
      return false;
    }
    
    const response = await fetch(`${apiBaseUrl}/api/mistakes/${mistakeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resolved: isResolved
      })
    });

    if (!response.ok) {
      throw new Error('更新错题状态失败');
    }
    
    return true;
  } catch (error) {
    console.error('更新错题状态失败:', error);
    return false;
  }
};

/**
 * 删除错题记录
 * @param {string} mistakeId - 错题记录ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export const deleteMistake = async (mistakeId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('未找到认证令牌');
      return false;
    }
    
    const response = await fetch(`${apiBaseUrl}/api/mistakes/${mistakeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('删除错题失败');
    }
    
    return true;
  } catch (error) {
    console.error('删除错题失败:', error);
    return false;
  }
};

/**
 * 添加题目到错题本
 * @param {string} questionId - 题目ID
 * @param {any} userAnswer - 用户的错误答案
 * @param {string} notes - 可选的笔记
 * @returns {Promise<boolean>} 是否添加成功
 */
export const addToMistake = async (questionId, userAnswer, notes = '') => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('未找到认证令牌');
      return false;
    }
    
    console.log(`正在添加错题，题目ID: ${questionId}`);
    console.log('用户答案:', userAnswer);
    
    const response = await fetch(`${apiBaseUrl}/api/mistakes/add/${questionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        userAnswer,
        notes 
      })
    });
    
    // 记录完整响应信息以便调试
    const responseText = await response.text();
    console.log('服务器响应状态:', response.status, response.statusText);
    console.log('响应内容:', responseText);
    
    if (!response.ok) {
      throw new Error(`添加错题失败: ${response.status} ${response.statusText} - ${responseText}`);
    }
    
    // 尝试解析JSON（如果响应是有效的JSON）
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('无法解析响应JSON:', e);
      return false;
    }
    
    return result.success;
  } catch (error) {
    console.error('添加错题失败:', error);
    return false;
  }
};

/**
 * 保存练习记录
 * @param {Object} record - 练习记录对象
 * @returns {Object} 保存的记录，带有ID和时间戳
 */
export const saveExerciseRecord = async (record) => {
  try {
    // 确保有用户ID
    if (!record.userId) {
      console.error('保存记录失败：缺少用户ID');
      return null;
    }

    // 创建新记录
    const newRecord = {
      ...record,
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'exercise'
    };
    
    // 保存到本地存储作为备份
    const existingRecords = getExerciseRecords() || [];
    const updatedRecords = [newRecord, ...existingRecords];
    localStorage.setItem('qa_records', JSON.stringify(updatedRecords));
    
    // 同步到MongoDB数据库 - 为每个题目创建提交记录
    const token = localStorage.getItem('token');
    if (token && record.questions && Array.isArray(record.questions)) {
      console.log('同步练习记录到MongoDB数据库...');
      
      // 批量处理所有题目的提交
      const submissionPromises = record.questions.map(async (question, index) => {
        try {
          // 获取问题结果
          const questionResult = record.results.questionResults?.[index];
          if (!questionResult) return null;
          
          // 获取用户答案
          const userAnswer = record.answers ? record.answers[question.id] : null;
          
          // 构建提交数据
          const submissionData = {
            questionId: question.id,
            userAnswer: userAnswer,
            isCorrect: questionResult.isCorrect,
            score: questionResult.score || 0,
            timeSpent: record.timeSpent || 0
          };
          
          // 发送到服务器
          const response = await fetch(`${apiBaseUrl}/api/submissions/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(submissionData)
          });
          
          if (!response.ok) {
            throw new Error(`提交记录同步失败: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error(`题目 ${question.id} 提交记录同步失败:`, error);
          return null;
        }
      });
      
      // 等待所有提交完成
      await Promise.all(submissionPromises);
      console.log('练习记录同步完成');
    }
    
    // 自动将错误的题目添加到错题本数据库
    if (record.questions && Array.isArray(record.questions) && record.results && record.results.questionResults) {
      if (token) {
        console.log('开始同步错题到数据库...');
        // 遍历所有题目，找出回答错误的
        for (let i = 0; i < record.questions.length; i++) {
          const question = record.questions[i];
          const result = record.results.questionResults[i];
          
          // 如果答错了，添加到错题本
          if (result && !result.isCorrect) {
            try {
              const userAnswer = record.answers ? record.answers[question.id] : null;
              const success = await addToMistake(question.id, userAnswer);
              if (success) {
                console.log(`成功添加题目 ${question.id} 到错题本数据库`);
              } else {
                console.error(`添加题目 ${question.id} 到错题本数据库失败`);
              }
            } catch (error) {
              // 捕获错误但不中断循环，允许其他错题继续添加
              console.error(`添加题目 ${question.id} 到错题本时出错:`, error);
            }
          }
        }
        console.log('错题同步完成');
      } else {
        console.warn('未找到令牌，无法同步错题到数据库');
      }
    }

    // 更新统计信息
    await updateStatistics(newRecord);

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
 * 获取用户统计数据
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 统计数据
 */
export const getUserStatistics = async (userId) => {
  try {
    if (!userId) return null;
    
    // 初始化统计数据对象
    let stats = {
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
      progressPercentage: 0,
      upcomingExamCount: 0,
      mistakeCount: 0,
      totalAnswered: 0,
      uniqueAnswered: 0,
      lastUpdated: new Date().toISOString()
    };
    
    // 从后端API获取学习进度数据（主要数据来源）
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // 获取学习进度数据
        const progressResponse = await fetch(`${apiBaseUrl}/api/stats/student-dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (progressResponse.ok) {
          const progressResult = await progressResponse.json();
          if (progressResult.success) {
            // 更新核心学习进度数据
            stats.progressPercentage = progressResult.stats.progressPercentage;
            stats.upcomingExamCount = progressResult.stats.upcomingExamCount;
            stats.mistakeCount = progressResult.stats.mistakeCount;
            stats.totalAnswered = progressResult.stats.totalAnswered || 0;
            stats.uniqueAnswered = progressResult.stats.uniqueAnswered || 0;
            stats.totalQuestions = progressResult.stats.totalQuestions || 0;
          }
        }
        
        // 获取用户提交记录的详细数据（用于计算标签掌握情况）
        const submissionsResponse = await fetch(`${apiBaseUrl}/api/users/${userId}/submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (submissionsResponse.ok) {
          const submissionsResult = await submissionsResponse.json();
          if (submissionsResult.success && submissionsResult.submissions.length > 0) {
            // 处理提交记录，计算标签掌握情况
            const submissions = submissionsResult.submissions;
            
            // 更新总体答题数据
            stats.totalExercises = submissions.length;
            stats.correctQuestions = submissions.filter(sub => sub.isCorrect).length;
            
            // 处理标签掌握情况
            const tagMastery = {};
            
            submissions.forEach(submission => {
              if (submission.question && submission.question.tags) {
                const isCorrect = submission.isCorrect;
                
                // 遍历题目标签
                submission.question.tags.forEach(tag => {
                  // 确保标签是字符串
                  const tagName = typeof tag === 'object' ? tag.name : tag;
                  
                  if (!tagMastery[tagName]) {
                    tagMastery[tagName] = { correct: 0, total: 0, exerciseCount: 0 };
                  }
                  
                  tagMastery[tagName].total += 1;
                  tagMastery[tagName].exerciseCount += 1;
                  
                  if (isCorrect) {
                    tagMastery[tagName].correct += 1;
                  }
                });
              }
              
              // 获取最近成绩记录
              if (submission.score !== undefined) {
                stats.recentScores.push({
                  exerciseId: submission.question ? submission.question._id : 'unknown',
                  exerciseTitle: submission.question ? submission.question.title : '未知题目',
                  score: submission.score,
                  timestamp: submission.submittedAt
                });
              }
            });
            
            // 计算标签掌握百分比
            const tagMasteryWithPercentage = Object.entries(tagMastery).map(([tag, data]) => ({
              tag,
              correct: data.correct,
              total: data.total,
              percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
              exerciseCount: data.exerciseCount || 0
            }));
            
            // 找出强项和弱项（至少有3个问题）
            const strongTopics = tagMasteryWithPercentage
              .filter(item => item.total >= 3 && item.percentage >= 80)
              .sort((a, b) => b.percentage - a.percentage);
              
            const weakTopics = tagMasteryWithPercentage
              .filter(item => item.total >= 3 && item.percentage < 60)
              .sort((a, b) => a.percentage - b.percentage);
            
            // 更新统计信息
            stats.tagMastery = tagMasteryWithPercentage;
            stats.strongTopics = strongTopics;
            stats.weakTopics = weakTopics;
            
            // 只保留最近10次的成绩
            stats.recentScores = stats.recentScores
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 10);
          }
        }
      }
    } catch (error) {
      console.error('从API获取学习进度失败:', error);
      // 失败时可以回退到本地数据
    }
    
    // 如果后端API获取失败，尝试从localStorage获取备份统计信息
    if (stats.totalAnswered === 0 && stats.tagMastery === undefined) {
      const statsString = localStorage.getItem(`qa_stats_${userId}`);
      
      if (statsString) {
        const localStats = JSON.parse(statsString);
        // 合并本地数据，但优先使用后端数据
        stats = { ...localStats, ...stats };
      }
      
      // 如果本地也没有，尝试从本地练习记录计算
      if (stats.totalExercises === 0) {
        const records = getExerciseRecords(userId);
        if (records.length > 0) {
          // 计算本地统计数据作为备份
          const localCalculatedStats = calculateStatistics(records, userId);
          // 合并本地计算的统计数据，但依然优先使用后端数据
          stats = { ...localCalculatedStats, ...stats };
        }
      }
    }
    
    // 保存统计数据到localStorage作为缓存
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
const updateStatistics = async (newRecord) => {
  if (!newRecord.userId) return;
  
  try {
    const userId = newRecord.userId;
    const stats = await getUserStatistics(userId);
    
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
 * @returns {Promise<Object>} 包含所有学习数据的对象
 */
export const exportUserData = async (userId) => {
  if (!userId) return null;
  
  try {
    const stats = await getUserStatistics(userId);
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
 * @returns {Promise<boolean>} 是否成功导入
 */
export const importUserData = async (data) => {
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