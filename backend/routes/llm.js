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

    let promptTemplate;
    if (type === 'objective') {
      // 客观题提示模板
      promptTemplate = `请为计算机专业的学生生成${count}道关于"${topic}"的客观选择题，难度级别为${difficulty || '中等'}。
      
每道题需要包含4个选项。

请以JSON格式返回结果，格式如下：
[
  {
    "title": "题目标题",
    "content": "题目内容",
    "type": "单选题",
    "options": [
      {"text": "选项A", "isCorrect": false},
      {"text": "选项B", "isCorrect": true},
      {"text": "选项C", "isCorrect": false},
      {"text": "选项D", "isCorrect": false}
    ],
    "answer": "正确选项",
    "explanation": "详细解析",
    "difficulty": "${difficulty || '中等'}",
    "tags": ["标签1", "标签2"],
    "category": "${topic}"
  }
]`;
    } else if (type === '简答题') {
      // 简答题提示模板
      promptTemplate = `请为计算机专业的学生生成${count}道关于"${topic}"的简答题，难度级别为${difficulty || '中等'}。

每道题需要包含详细的参考答案和评分标准。

请以JSON格式返回结果，格式如下：
[
  {
    "title": "题目内容",
    "type": "简答题",
    "correctAnswer": "详细的参考答案",
    "explanation": "评分标准和解析",
    "difficulty": "${difficulty || '中等'}",
    "score": 10,
    "tags": ["标签1", "标签2"],
    "category": "${topic}"
  }
]`;
    } else if (type === '编程题') {
      // 编程题提示模板
      promptTemplate = `请为计算机专业的学生生成${count}道关于"${topic}"的编程题，难度级别为${difficulty || '中等'}。

每道题需要包含详细的题目描述、输入输出要求、示例测试用例，以及参考代码实现和评分标准。

请以JSON格式返回结果，格式如下：
[
  {
    "title": "题目标题",
    "content": "详细题目描述，包含问题背景、要求、限制条件等",
    "inputFormat": "输入格式说明",
    "outputFormat": "输出格式说明",
    "examples": [
      {
        "input": "示例输入",
        "output": "示例输出",
        "explanation": "示例解释"
      }
    ],
    "type": "编程题",
    "correctAnswer": "参考代码实现",
    "explanation": "算法思路解析和评分标准",
    "difficulty": "${difficulty || '中等'}",
    "score": 20,
    "tags": ["标签1", "标签2"],
    "category": "${topic}"
  }
]`;
    } else {
      // 默认模板
      promptTemplate = `请为计算机专业的学生生成${count}道关于"${topic}"的${type}，难度级别为${difficulty || '中等'}。

请以JSON格式返回结果，确保生成的题目内容准确，难度合理，解析详细。`;
    }

    const messages = [
      {
        role: 'user',
        content: promptTemplate
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
    const { questionId, questionContent, standardAnswer, userAnswer, questionType = '简答题' } = req.body;

    if (!questionContent || !standardAnswer || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的评估信息'
      });
    }

    console.log(`收到${questionType}评估请求: ${questionId.substring(0, 8)}...`);

    // 根据题目类型调整评估提示
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
  "strengthPoints": ["优点1", "优点2", ...],
  "weaknessPoints": ["缺点1", "缺点2", ...],
  "codeAnalysis": "代码逻辑分析，说明代码如何工作",
  "improvementSuggestions": "改进建议，如何优化代码",
  "correctSolution": "如果学生的解答有明显错误，提供修正后的代码片段或思路"
}

请确保返回JSON对象包含以上所有字段，评分要客观公正，解析要详细具体。`;
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
  "keyPointsCovered": ["已覆盖的要点1", "已覆盖的要点2", ...],
  "missingPoints": ["遗漏的要点1", "遗漏的要点2", ...],
  "misconceptions": ["错误概念1", "错误概念2", ...],
  "improvementSuggestions": "改进建议，如何完善答案",
  "modelAnswer": "如果学生答案存在明显不足，提供一个简洁的修正版答案"
}

请确保返回JSON对象包含以上所有字段，评分要客观公正，解析要详细具体。`;
    }

    console.log('发送评估请求到大语言模型...');
    const messages = [
      {
        role: 'user',
        content: evaluationPrompt
      }
    ];

    const result = await callDeepseek(messages);

    if (result.error) {
      console.error('大语言模型API调用失败:', result.error);
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
        console.log(`评估成功，分数: ${evaluation.score}`);
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
    console.error('评估主观题发生错误:', error);
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

// @route   POST /api/llm/generate-questions-custom
// @desc    根据自定义参数生成题目
// @access  Private/Teacher
router.post('/generate-questions-custom', protect, authorize('teacher'), async (req, res) => {
  try {
    const { topic, difficulty, type, includeExplanation, jsonSample, count = 5 } = req.body;

    if (!topic || !type) {
      return res.status(400).json({
        success: false,
        message: '请提供题目主题和类型'
      });
    }

    // 解析JSON样例作为模板
    let sampleJson;
    try {
      sampleJson = JSON.parse(jsonSample);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'JSON样例格式错误'
      });
    }

    // 限制生成数量在1-10之间
    const questionCount = Math.min(Math.max(1, count), 10);

    const prompt = `请根据以下要求，为计算机专业学生生成${questionCount}道高质量的${type}题目:

主题: ${topic}
难度: ${difficulty}
题目类型: ${type}
${includeExplanation ? '请包含详细解析' : '不需要包含解析'}

请严格按照以下JSON格式返回结果:
${jsonSample}

注意事项:
1. 生成内容必须严格遵循提供的JSON格式
2. 题目内容必须准确、专业，难度符合要求
3. 选择题的选项必须清晰、有区分度
4. ${includeExplanation ? '解析应详细说明正确答案的原因' : '不需要包含解析字段'}
5. 所有生成的内容必须与主题"${topic}"密切相关
6. 请确保生成 ${questionCount} 道题目

请确保生成的JSON能够被直接解析，不要添加任何额外的说明文字。`;

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

module.exports = router; 