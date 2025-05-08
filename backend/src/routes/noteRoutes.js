const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// 获取所有笔记
router.get('/', noteController.getAllNotes);

// 获取单个笔记
router.get('/:id', noteController.getNoteById);

// 创建新笔记
router.post('/', noteController.createNote);

// 更新笔记
router.put('/:id', noteController.updateNote);

// 删除笔记
router.delete('/:id', noteController.deleteNote);

module.exports = router;
