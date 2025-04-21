const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const examController = require('../controllers/examController');

// 教师相关路由
router.post('/', protect, examController.createExam); // 创建考试
router.get('/teacher', protect, examController.getTeacherExams); // 获取教师创建的所有考试
router.get('/teacher/:id', protect, examController.getExamDetail); // 获取考试详情（教师视角）
router.put('/:id', protect, examController.updateExam); // 更新考试
router.delete('/:id', protect, examController.deleteExam); // 删除考试

// 学生相关路由
router.get('/student', protect, examController.getStudentExams); // 获取学生可参加的考试列表
router.get('/student/:id', protect, examController.getStudentExamDetail); // 获取考试详情（学生视角）
router.post('/student/:id/submit', protect, examController.submitExam); // 提交考试答案

module.exports = router; 