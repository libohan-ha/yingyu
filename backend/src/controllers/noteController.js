const Note = require('../models/Note');

// 获取所有笔记
exports.getAllNotes = async (req, res) => {
  try {
    console.log('收到获取所有笔记请求');
    const notes = await Note.find().sort({ createdAt: -1 });
    console.log(`找到 ${notes.length} 条笔记`);
    res.json(notes);
  } catch (error) {
    console.error('获取笔记失败:', error);
    console.error('错误详情:', error.stack);
    res.status(500).json({ error: '获取笔记失败', message: error.message });
  }
};

// 获取单个笔记
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    res.json(note);
  } catch (error) {
    console.error('获取笔记失败:', error);
    res.status(500).json({ error: '获取笔记失败' });
  }
};

// 创建新笔记
exports.createNote = async (req, res) => {
  try {
    console.log('收到创建笔记请求:', req.body);

    const { title, words, content } = req.body;

    if (!title) {
      console.log('验证失败: 标题不能为空');
      return res.status(400).json({ error: '标题不能为空' });
    }

    if (!words && !content) {
      console.log('验证失败: 单词或内容至少填写一项');
      return res.status(400).json({ error: '单词或内容至少填写一项' });
    }

    console.log('创建笔记对象:', {
      title,
      words: Array.isArray(words) ? words : [],
      content
    });

    const note = new Note({
      title,
      words: Array.isArray(words) ? words : [],
      content
    });

    const savedNote = await note.save();
    console.log('笔记保存成功:', savedNote);
    res.status(201).json(savedNote);
  } catch (error) {
    console.error('创建笔记失败:', error);
    console.error('错误详情:', error.stack);
    res.status(500).json({ error: '创建笔记失败', message: error.message });
  }
};

// 更新笔记
exports.updateNote = async (req, res) => {
  try {
    const { title, words, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: '标题不能为空' });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    note.title = title;
    note.words = Array.isArray(words) ? words : note.words;
    note.content = content !== undefined ? content : note.content;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    console.error('更新笔记失败:', error);
    res.status(500).json({ error: '更新笔记失败' });
  }
};

// 删除笔记
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    await note.deleteOne();
    res.json({ message: '笔记已删除' });
  } catch (error) {
    console.error('删除笔记失败:', error);
    res.status(500).json({ error: '删除笔记失败' });
  }
};
