const Exam = require('../models/Exam');
const User = require('../models/User');
const Question = require('../models/Question');
const MistakeRecord = require('../models/MistakeRecord');

// 创建新考试
exports.createExam = async (req, res) => {
  try {
    const { title, description, startTime, endTime, duration, questions, totalScore, passingScore } = req.body;
    
    // 验证必要字段
    if (!title || !startTime || !endTime || !duration || !questions || questions.length === 0) {
      return res.status(400).json({ message: '请提供所有必要的考试信息' });
    }
    
    // 计算总分
    let calculatedTotalScore = 0;
    const questionIds = [];
    
    for (const q of questions) {
      calculatedTotalScore += q.score;
      questionIds.push(q.question);
    }
    
    // 创建新考试
    const newExam = new Exam({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      questions,
      totalScore: totalScore || calculatedTotalScore,
      passingScore: passingScore || Math.floor(calculatedTotalScore * 0.6),
      creator: req.user.id
    });
    
    await newExam.save();
    
    // 更新题目的使用次数
    await Question.updateMany(
      { _id: { $in: questionIds } },
      { $inc: { useCount: 1 } }
    );
    
    res.status(201).json({ 
      message: '考试创建成功', 
      exam: newExam 
    });
  } catch (error) {
    console.error('创建考试失败:', error);
    res.status(500).json({ message: '创建考试失败', error: error.message });
  }
};

// 获取教师创建的所有考试
exports.getTeacherExams = async (req, res) => {
  try {
    const exams = await Exam.find({ creator: req.user.id })
      .sort({ createdAt: -1 })
      .populate('creator', 'name email')
      .select('-questions.correctAnswer');
    
    res.status(200).json(exams);
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({ message: '获取考试列表失败', error: error.message });
  }
};

// 获取单个考试详情（教师视角）
exports.getExamDetail = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('creator', 'name email')
      .populate({
        path: 'questions.question',
        select: 'title type difficulty score options correctAnswer explanation tags'
      });
    
    if (!exam) {
      return res.status(404).json({ message: '考试不存在' });
    }
    
    // 验证权限（仅创建者可以查看详情）
    if (exam.creator._id.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权查看此考试详情' });
    }
    
    res.status(200).json(exam);
  } catch (error) {
    console.error('获取考试详情失败:', error);
    res.status(500).json({ message: '获取考试详情失败', error: error.message });
  }
};

// 更新考试信息
exports.updateExam = async (req, res) => {
  try {
    const { title, description, startTime, endTime, duration, questions, totalScore, passingScore, isActive } = req.body;
    
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: '考试不存在' });
    }
    
    // 验证权限（仅创建者可以更新）
    if (exam.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权更新此考试' });
    }
    
    // 更新考试信息
    if (title) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (startTime) exam.startTime = new Date(startTime);
    if (endTime) exam.endTime = new Date(endTime);
    if (duration) exam.duration = duration;
    if (totalScore) exam.totalScore = totalScore;
    if (passingScore) exam.passingScore = passingScore;
    if (isActive !== undefined) exam.isActive = isActive;
    
    // 如果更新了问题列表
    if (questions && questions.length > 0) {
      // 获取原始题目IDs
      const oldQuestionIds = exam.questions.map(q => q.question.toString());
      
      // 更新问题列表
      exam.questions = questions;
      
      // 获取新题目IDs
      const newQuestionIds = questions.map(q => q.question.toString());
      
      // 计算需要增加使用次数的题目（新增的）
      const questionsToIncrement = newQuestionIds.filter(id => !oldQuestionIds.includes(id));
      
      // 计算需要减少使用次数的题目（移除的）
      const questionsToDecrement = oldQuestionIds.filter(id => !newQuestionIds.includes(id));
      
      // 更新题目使用次数
      if (questionsToIncrement.length > 0) {
        await Question.updateMany(
          { _id: { $in: questionsToIncrement } },
          { $inc: { useCount: 1 } }
        );
      }
      
      if (questionsToDecrement.length > 0) {
        await Question.updateMany(
          { _id: { $in: questionsToDecrement } },
          { $inc: { useCount: -1 } }
        );
      }
    }
    
    await exam.save();
    
    res.status(200).json({ 
      message: '考试更新成功', 
      exam 
    });
  } catch (error) {
    console.error('更新考试失败:', error);
    res.status(500).json({ message: '更新考试失败', error: error.message });
  }
};

// 删除考试
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: '考试不存在' });
    }
    
    // 验证权限（仅创建者可以删除）
    if (exam.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权删除此考试' });
    }
    
    // 获取题目IDs，用于更新使用次数
    const questionIds = exam.questions.map(q => q.question);
    
    // 删除考试
    await exam.deleteOne();
    
    // 更新题目使用次数
    if (questionIds.length > 0) {
      await Question.updateMany(
        { _id: { $in: questionIds } },
        { $inc: { useCount: -1 } }
      );
    }
    
    res.status(200).json({ message: '考试删除成功' });
  } catch (error) {
    console.error('删除考试失败:', error);
    res.status(500).json({ message: '删除考试失败', error: error.message });
  }
};

// 获取学生可见的考试列表
exports.getStudentExams = async (req, res) => {
  try {
    const now = new Date();
    console.log('获取学生考试列表，当前时间:', now);
    
    // 获取学生可见的所有考试（已开始但未结束的考试）
    const query = {
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    };
    
    console.log('查询条件:', JSON.stringify(query));
    
    const exams = await Exam.find(query)
      .sort({ startTime: 1 })
      .populate('creator', 'name')
      .select('title description startTime endTime duration totalScore passingScore creator');
    
    console.log(`找到 ${exams.length} 个进行中的考试`);
    
    // 如果没有考试，也返回空数组，前端会处理
    res.status(200).json(exams);
  } catch (error) {
    console.error('获取学生考试列表失败:', error);
    res.status(500).json({ message: '获取考试列表失败', error: error.message });
  }
};

// 获取单个考试详情（学生视角）
exports.getStudentExamDetail = async (req, res) => {
  try {
    const now = new Date();
    
    // 查找考试
    const exam = await Exam.findOne({
      _id: req.params.id,
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
      .populate('creator', 'name')
      .populate({
        path: 'questions.question',
        select: 'title type difficulty options' // 不包含正确答案
      });
    
    if (!exam) {
      return res.status(404).json({ message: '考试不存在或未开始或已结束' });
    }
    
    // 学生获取考试时不返回答案
    const examForStudent = {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalScore: exam.totalScore,
      passingScore: exam.passingScore,
      creator: exam.creator,
      questions: exam.questions.map(q => ({
        _id: q._id,
        question: {
          _id: q.question._id,
          title: q.question.title,
          type: q.question.type,
          difficulty: q.question.difficulty,
          options: q.question.options.map(opt => ({
            _id: opt._id,
            content: opt.content
            // 不包含 isCorrect 字段
          }))
        },
        score: q.score
      }))
    };
    
    res.status(200).json(examForStudent);
  } catch (error) {
    console.error('获取学生考试详情失败:', error);
    res.status(500).json({ message: '获取考试详情失败', error: error.message });
  }
};

// 提交考试答案
exports.submitExam = async (req, res) => {
  try {
    const { answers } = req.body;
    const examId = req.params.id;
    
    // 验证答案格式
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: '请提供有效的答案格式' });
    }
    
    // 获取考试信息
    const exam = await Exam.findById(examId)
      .populate({
        path: 'questions.question',
        select: 'title type options correctAnswer tags explanation'
      });
    
    if (!exam) {
      return res.status(404).json({ message: '考试不存在' });
    }
    
    // 验证考试是否在有效期内
    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      return res.status(403).json({ message: '考试未开始或已结束，无法提交' });
    }
    
    // 评分和记录错题
    let totalScore = 0;
    const mistakeIds = [];
    const results = [];
    
    for (const answer of answers) {
      const questionItem = exam.questions.find(q => q.question._id.toString() === answer.questionId);
      
      if (!questionItem) continue;
      
      const question = questionItem.question;
      const maxScore = questionItem.score;
      let isCorrect = false;
      let score = 0;
      
      // 根据题目类型判断答案是否正确
      switch (question.type) {
        case '单选题':
          isCorrect = answer.answer === question.correctAnswer;
          score = isCorrect ? maxScore : 0;
          break;
        case '多选题':
          // 多选题完全正确才得分
          const answerSet = new Set(answer.answer);
          const correctSet = new Set(question.correctAnswer);
          isCorrect = answerSet.size === correctSet.size &&
            [...answerSet].every(value => correctSet.has(value));
          score = isCorrect ? maxScore : 0;
          break;
        case '判断题':
          isCorrect = answer.answer === question.correctAnswer;
          score = isCorrect ? maxScore : 0;
          break;
        case '填空题':
          // 填空题每空单独判断，部分正确可得部分分
          const userAnswers = answer.answer.split(';');
          const correctAnswers = question.correctAnswer.split(';');
          let correctCount = 0;
          
          for (let i = 0; i < Math.min(userAnswers.length, correctAnswers.length); i++) {
            if (userAnswers[i].trim() === correctAnswers[i].trim()) {
              correctCount++;
            }
          }
          
          score = Math.round((correctCount / correctAnswers.length) * maxScore);
          isCorrect = score === maxScore;
          break;
        case '简答题':
        case '编程题':
          // 这两种题型需要手动评分，暂时给0分
          score = 0;
          isCorrect = false;
          break;
      }
      
      totalScore += score;
      
      // 记录结果
      results.push({
        questionId: question._id,
        userAnswer: answer.answer,
        correctAnswer: question.correctAnswer,
        score,
        maxScore,
        isCorrect
      });
      
      // 如果答错了，记录到错题集
      if (!isCorrect) {
        mistakeIds.push(question._id);
        
        // 创建错题记录
        await MistakeRecord.create({
          user: req.user.id,
          question: question._id,
          userAnswer: answer.answer,
          source: '考试',
          sourceId: examId
        });
      }
    }
    
    // 记录考试得分（这里可以扩展成单独的ExamSubmission模型）
    
    // 返回考试结果
    res.status(200).json({
      message: '考试提交成功',
      examId,
      totalScore,
      passingScore: exam.passingScore,
      isPassed: totalScore >= exam.passingScore,
      results,
      mistakeCount: mistakeIds.length
    });
  } catch (error) {
    console.error('提交考试失败:', error);
    res.status(500).json({ message: '提交考试失败', error: error.message });
  }
}; 