const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// 大语言模型API调用函数
const callDeepseek = async (messages) => {
  try {
    const response = await fetch(process.env.DEEPSEEK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-250120',
        messages: [
          {
            role: "system",
            content: "你是一个专业的计算机科学教育评估专家，负责评估学生的答案并提供建设性的反馈。"
          },
          ...messages
        ]
      })
    });
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
    return { error: 'API调用失败' };
  }
};

// @route   POST /api/llm/generate-questions
// @desc    自动生成题目
// @access  Private/Teacher
router.post('/generate-questions', protect, authorize('teacher'), async (req, res) => {
  try {
    const { topic, difficulty, count = 1, type = 'objective' } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: '请提供题目主题'
      });
    }

    const prompt = `请为计算机专业的学生生成${count}道关于"${topic}"的${
      type === 'objective' ? '客观选择题' : '主观题'
    }，难度级别为${difficulty || '中等'}。
    
    ${type === 'objective' ? '每道题需要包含4个选项。' : '每道题需要有详细的参考答案。'}
    
    请以JSON格式返回结果，格式如下：
    [
      {
        "title": "题目标题",
        "content": "题目内容",
        "type": "${type}",
        ${
          type === 'objective'
            ? `"options": [
              {"text": "选项A", "isCorrect": false},
              {"text": "选项B", "isCorrect": true},
              {"text": "选项C", "isCorrect": false},
              {"text": "选项D", "isCorrect": false}
            ],`
            : ''
        }
        "answer": ${type === 'objective' ? '"正确选项"' : '"参考答案"'},
        "explanation": "详细解析",
        "difficulty": ${difficulty || 3},
        "tags": ["标签1", "标签2"],
        "category": "${topic}"
      }
    ]

    确保生成的题目内容准确，难度合理，解析详细。`;

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const result = await callDeepseek(messages);

    if (result.error) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    let questions;
    try {
      // 尝试从返回的内容中提取JSON
      const contentText = result.choices[0].message.content;
      const jsonMatch = contentText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析返回的JSON');
      }
    } catch (error) {
      console.error('解析生成的题目失败:', error);
      return res.status(500).json({
        success: false,
        message: '解析生成的题目失败',
        rawResponse: result.choices[0].message.content
      });
    }

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   POST /api/llm/evaluate-answer
// @desc    评估主观题答案
// @access  Private
router.post('/evaluate-answer', protect, async (req, res) => {
  try {
    const { questionId, questionContent, standardAnswer, userAnswer } = req.body;

    if (!questionContent || !standardAnswer || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的评估信息'
      });
    }

    const prompt = `请评估下面学生对主观题的回答，并给出评分（满分100分）和详细的评价意见。

    题目内容：
    ${questionContent}
    
    参考答案：
    ${standardAnswer}
    
    学生回答：
    ${userAnswer}
    
    请以JSON格式返回结果，格式如下：
    {
      "score": 85,
      "feedback": "详细的评价意见，包括学生答案的优点和不足"
    }`;

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const result = await callDeepseek(messages);

    if (result.error) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    let evaluation;
    try {
      // 尝试从返回的内容中提取JSON
      const contentText = result.choices[0].message.content;
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析返回的JSON');
      }
    } catch (error) {
      console.error('解析评估结果失败:', error);
      return res.status(500).json({
        success: false,
        message: '解析评估结果失败',
        rawResponse: result.choices[0].message.content
      });
    }

    res.json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   POST /api/llm/generate-feedback
// @desc    生成学习反馈
// @access  Private
router.post('/generate-feedback', protect, async (req, res) => {
  try {
    const { userId, submissionHistory } = req.body;

    if (!submissionHistory || !Array.isArray(submissionHistory)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的答题历史'
      });
    }

    // 准备提交历史数据
    const historyText = submissionHistory.map(sub => {
      return `题目: ${sub.question.title}
类别: ${sub.question.category}
难度: ${sub.question.difficulty}
正确与否: ${sub.isCorrect ? '正确' : '错误'}
得分: ${sub.score}
`;
    }).join('\n');

    const prompt = `根据以下学生的答题历史，请分析其学习情况并提供个性化学习建议。

学生答题历史：
${historyText}

请分析以下方面：
1. 学生的强项和弱项
2. 针对弱项的改进建议
3. 下一步学习计划建议

请以JSON格式返回结果，格式如下：
{
  "strengths": ["学生的强项1", "学生的强项2"],
  "weaknesses": ["学生的弱项1", "学生的弱项2"],
  "improvementSuggestions": ["改进建议1", "改进建议2"],
  "nextSteps": ["下一步学习计划1", "下一步学习计划2"],
  "summary": "总结性评价"
}`;

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const result = await callDeepseek(messages);

    if (result.error) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    let feedback;
    try {
      // 尝试从返回的内容中提取JSON
      const contentText = result.choices[0].message.content;
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析返回的JSON');
      }
    } catch (error) {
      console.error('解析反馈结果失败:', error);
      return res.status(500).json({
        success: false,
        message: '解析反馈结果失败',
        rawResponse: result.choices[0].message.content
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 