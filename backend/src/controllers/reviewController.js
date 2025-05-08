const localStorageService = require('../services/localStorageService');

// Controller to handle review-related operations
exports.getReviewData = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log(`Getting review data for session with ID: ${sessionId} from local storage...`);

    // 从本地存储中获取会话
    const session = localStorageService.getSession(sessionId);

    if (!session) {
      console.log(`Session with ID: ${sessionId} not found`);
      return res.status(404).json({ error: 'Session not found' });
    }

    // Prepare review data: words with sentences containing them
    const reviewData = [];

    // 确保 inputWords 存在
    const inputWords = session.inputWords || [];

    for (const word of inputWords) {
      // Convert to lowercase for case-insensitive matching
      const wordLower = word.toLowerCase();

      // Find sentences containing this word
      const sentences = extractSentences(session.articleEn);
      const matchingSentence = sentences.find(sentence =>
        sentence.toLowerCase().includes(wordLower)
      );

      // 获取单词释义，适应对象格式
      const meaning = session.wordMeanings && session.wordMeanings[word]
        ? session.wordMeanings[word]
        : 'Unknown meaning';

      reviewData.push({
        word,
        meaning,
        sentence: matchingSentence || ''
      });
    }

    res.status(200).json(reviewData);

  } catch (error) {
    console.error('Get review data error:', error);
    next(error);
  }
};

// Helper function to extract sentences from a text
function extractSentences(text) {
  if (!text) return [];

  // Split text by sentence-ending punctuation, preserving the punctuation
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = [];
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    sentences.push(match[0].trim());
  }

  return sentences;
}
