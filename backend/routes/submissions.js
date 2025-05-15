const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const MistakeRecord = require('../models/MistakeRecord');
const { protect, authorize } = require('../middleware/auth');
const axios = require('axios');  // 添加axios用于API调用

// 调用大语言模型评估主观题答案
const evaluateSubjectiveAnswer = async (questionContent, standardAnswer, userAnswer, questionType) => {
  try {
    console.log(`评估${questionType}答案: ${questionContent.substring(0, 50)}...`);
    
    // 构建评估提示
    let evaluationPrompt;
    if (questionType === '编程题') {
      evaluationPrompt = `你是一位经验丰富的编程教师，现在需要你评估学生的编程题解答。请提供详细的评分和解析。

题目内容：
${questionContent}

参考答案（标准代码实现）：
${standardAnswer}

学生提交的代码：
${userAnswer}

请评估以下几个方面并给出相应分数（总分100分）：
1. 代码正确性（40分）：代码是否能正确实现题目要求的功能，是否有逻辑错误
2. 代码效率（20分）：时间复杂度和空间复杂度是否合理，算法选择是否恰当
3. 代码风格（20分）：命名规范、缩进、注释是否清晰易读
4. 错误处理（10分）：是否考虑了边界条件和异常情况
5. 创新性（10分）：有无独特的解题思路或优化

请以JSON格式返回评估结果，格式示例：
{
  "score": 85,
  "feedback": "总体评价，概述代码的优缺点",
  "strengthPoints": ["优点1", "优点2", "优点3"],
  "weaknessPoints": ["缺点1", "缺点2"],
  "codeAnalysis": "代码逻辑分析，说明代码如何工作",
  "improvementSuggestions": "改进建议，如何优化代码",
  "correctSolution": "如果学生的解答有明显错误，提供修正后的代码片段或思路"
}`;
    } else {
      // 简答题默认评估提示
      evaluationPrompt = `你是一位专业的计算机科学教师，现在需要你评估学生对简答题的解答。请提供详细的评分和解析。

题目内容：
${questionContent}

参考答案：
${standardAnswer}

学生回答：
${userAnswer}

请评估以下几个方面并给出相应分数（总分100分）：
1. 内容完整性（40分）：是否涵盖了参考答案中的关键概念和要点
2. 概念准确性（30分）：对概念的理解和表述是否准确无误
3. 逻辑清晰度（20分）：论述是否条理分明，前后连贯
4. 表达能力（10分）：语言是否简洁清晰，专业术语使用是否恰当

请以JSON格式返回评估结果，格式示例：
{
  "score": 85,
  "feedback": "总体评价，概述回答的优缺点",
  "keyPointsCovered": ["已覆盖的要点1", "已覆盖的要点2", "已覆盖的要点3"],
  "missingPoints": ["遗漏的要点1", "遗漏的要点2"],
  "misconceptions": ["错误概念1", "错误概念2"],
  "improvementSuggestions": "改进建议，如何完善答案",
  "modelAnswer": "如果学生答案存在明显不足，提供一个简洁的修正版答案"
}`;
    }

    // 调用大语言模型API
    console.log('发送评估请求到大语言模型API...');
    const response = await axios.post(process.env.DEEPSEEK_API_ENDPOINT, {
      model: 'deepseek-r1-250120',
      messages: [
        {
          role: "system",
          content: "你是一个专业的计算机科学教育评估专家，负责评估学生的答案并提供建设性的反馈。"
        },
        {
          role: "user",
          content: evaluationPrompt
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      }
    });

    // 解析返回结果
    if (response.data && response.data.choices && response.data.choices[0]) {
      const contentText = response.data.choices[0].message.content;
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        console.log(`评估完成，得分: ${evaluation.score}/100`);
        return evaluation;
      }
    }

    throw new Error('无法解析评估结果');
  } catch (error) {
    console.error('评估主观题答案失败:', error.message);
    // 评估失败时返回默认评分结果
    return {
      score: 0,
      feedback: '自动评估失败，请等待教师手动评分',
      error: error.message
    };
  }
};

// @route   POST /api/submissions
// @desc    提交答案
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { questionId, userAnswer, timeSpent, aiEvaluated } = req.body;

    // 获取题目信息
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 判断答案是否正确
    let isCorrect = false;
    let score = 0;
    let feedback = null;
    let aiEvaluation = null;

    if (question.type === '单选题' || question.type === '多选题') {
      // 选择题判分
      if (question.type === '多选题' && Array.isArray(userAnswer)) {
        // 检查每个正确选项是否被选中，且没有选中错误选项
        const correctOptions = question.options
          .filter(opt => opt.isCorrect)
          .map(opt => opt._id.toString());
        
        const userSelectedIds = Array.isArray(userAnswer) 
          ? userAnswer.map(id => id.toString()) 
          : [];
        
        isCorrect = correctOptions.length === userSelectedIds.length &&
          correctOptions.every(id => userSelectedIds.includes(id)) &&
          userSelectedIds.every(id => correctOptions.includes(id));
      } else if (question.type === '单选题') {
        // 单选题，检查选中的选项是否是正确选项
        const correctOptionId = question.options
          .find(opt => opt.isCorrect)?._id?.toString();
        
        isCorrect = correctOptionId === userAnswer.toString();
      }
      
      // 客观题根据正确与否设置分数
      score = isCorrect ? question.score || 100 : 0;
    } else if (question.type === '判断题') {
      // 判断题判分
      isCorrect = question.correctAnswer === userAnswer;
      score = isCorrect ? question.score || 100 : 0;
    } else if ((question.type === '简答题' || question.type === '编程题') && aiEvaluated) {
      // 如果请求中包含了AI评估结果，直接使用
      if (req.body.aiScore !== undefined && req.body.aiFeedback) {
        console.log(`使用客户端提供的AI评估结果，分数: ${req.body.aiScore}`);
        score = req.body.aiScore;
        feedback = req.body.aiFeedback;
        aiEvaluation = req.body.aiEvaluation || null;
        isCorrect = score >= (question.score * 0.6); // 60%以上视为正确
      }
    } else if (question.type === '简答题' || question.type === '编程题') {
      // 主观题（简答题、编程题）使用大语言模型自动评分
      try {
        console.log(`对${question.type}进行AI评估: ${questionId}`);
        const evaluation = await evaluateSubjectiveAnswer(
          question.title,
          question.correctAnswer,
          userAnswer,
          question.type
        );
        
        // 根据评分结果设置分数和反馈
        if (evaluation && evaluation.score !== undefined) {
          // 根据百分比分数计算实际得分
          const percentScore = evaluation.score / 100;
          score = Math.round(percentScore * question.score);
          feedback = evaluation.feedback;
          aiEvaluation = evaluation; // 保存完整的评估结果
          isCorrect = percentScore >= 0.6; // 60%以上视为正确
          
          console.log(`AI评估完成: 得分=${score}/${question.score}, 是否正确=${isCorrect}`);
        } else {
          throw new Error('评估结果无效');
        }
      } catch (error) {
        console.error('自动评分失败:', error.message);
        // 评分失败时默认为0分，等待教师手动评分
        score = 0;
        feedback = `自动评分失败: ${error.message}，等待教师手动评分`;
        isCorrect = false;
        aiEvaluation = { error: error.message };
      }
    } else {
      // 其他题型暂时使用人工评分
      isCorrect = false;
      score = 0;
      feedback = '等待教师评分';
    }

    // 创建提交记录
    const submission = new Submission({
      user: req.user.id,
      question: questionId,
      userAnswer,
      isCorrect,
      score,
      feedback,
      aiEvaluation, // 保存完整的AI评估结果
      timeSpent,
      isAiEvaluated: (question.type === '简答题' || question.type === '编程题')
    });

    await submission.save();
    console.log(`保存提交记录成功: ${submission._id}`);

    // 如果答案错误，添加到错题本
    if (!isCorrect) {
      try {
        // 使用upsert操作，如果记录已存在则更新，不存在则创建
        await MistakeRecord.findOneAndUpdate(
          { user: req.user.id, question: questionId },
          { 
            user: req.user.id, 
            question: questionId,
            submission: submission._id,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('添加错题记录失败:', err);
        // 不影响主流程，所以这里只记录错误，不返回错误响应
      }
    }

    res.status(201).json({
      success: true,
      submission,
      isCorrect,
      score,
      feedback,
      aiEvaluation // 返回完整的评估结果
    });
  } catch (error) {
    console.error('处理提交请求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// @route   GET /api/submissions/user/:userId
// @desc    获取用户答题记录
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '无权限查看其他用户的答题记录'
      });
    }

    const submissions = await Submission.find({ user: req.params.userId })
      .populate('question', 'title content type difficulty')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   GET /api/submissions/question/:questionId
// @desc    获取题目所有提交记录(教师权限)
// @access  Private/Teacher
router.get('/question/:questionId', protect, async (req, res) => {
  try {
    // 只有教师可以查看题目的所有提交记录
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '无权限查看此资源'
      });
    }

    const submissions = await Submission.find({ question: req.params.questionId })
      .populate('user', 'username')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   POST /api/submissions/create
// @desc    创建新的提交记录
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const { questionId, userAnswer, isCorrect, score, timeSpent } = req.body;
    const userId = req.user.id;
    
    // 验证必要字段
    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的题目ID'
      });
    }
    
    // 检查问题是否存在
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }
    
    // 创建提交记录
    const submission = new Submission({
      user: userId,
      question: questionId,
      userAnswer,
      isCorrect: isCorrect || false,
      score: score || 0,
      timeSpent: timeSpent || 0
    });
    
    // 保存到数据库
    await submission.save();
    
    // 导入updateLearningProgressAsync函数
    const { updateLearningProgressAsync } = require('./stats');

    // 分离主流程和异步进度更新
    // 使用setTimeout来确保即使更新进度失败，也不会影响提交记录的响应
    setTimeout(() => {
      try {
        updateLearningProgressAsync(userId);
        console.log(`提交记录创建成功，为用户 ${userId} 异步更新学习进度`);
      } catch (error) {
        console.error('触发学习进度更新失败:', error);
      }
    }, 0);
    
    res.status(201).json({
      success: true,
      message: '提交记录已保存',
      data: submission
    });
  } catch (error) {
    console.error('创建提交记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 