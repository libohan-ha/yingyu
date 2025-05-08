const localStorageService = require('../services/localStorageService');

// Controller to handle history session operations
exports.getAllSessions = async (req, res, next) => {
  try {
    console.log('Getting all sessions from local storage...');

    // 获取所有会话，默认限制10个
    const limit = parseInt(req.query.limit) || 10;
    const sessions = localStorageService.getAllSessions(limit);

    // Format the response data
    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      date: session.createdAt,
      firstWord: session.inputWords && session.inputWords.length > 0 ? session.inputWords[0] : '',
      wordCount: session.inputWords ? session.inputWords.length : 0,
      previewText: session.articleEn ? session.articleEn.substring(0, 100) + '...' : '',
      source: session.source || 'input'
    }));

    console.log(`Returning ${formattedSessions.length} sessions`);
    res.status(200).json(formattedSessions);

  } catch (error) {
    console.error('Get all sessions error:', error);
    next(error);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log(`Getting session with ID: ${sessionId} from local storage...`);

    // 从本地存储中获取会话
    const session = localStorageService.getSession(sessionId);

    if (!session) {
      console.log(`Session with ID: ${sessionId} not found`);
      return res.status(404).json({ error: 'Session not found' });
    }

    // 直接返回会话数据
    console.log(`Returning session with ID: ${sessionId}`);
    res.status(200).json(session);

  } catch (error) {
    console.error('Get session by ID error:', error);
    next(error);
  }
};

// 删除会话
exports.deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log(`Deleting session with ID: ${sessionId} from local storage...`);

    // 从本地存储中删除会话
    const deleted = localStorageService.deleteSession(sessionId);

    if (!deleted) {
      console.log(`Session with ID: ${sessionId} not found`);
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`Session with ID: ${sessionId} deleted successfully`);
    res.status(200).json({ message: 'Session deleted successfully' });

  } catch (error) {
    console.error('Delete session error:', error);
    next(error);
  }
};
