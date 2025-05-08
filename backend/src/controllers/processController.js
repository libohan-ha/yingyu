const TongyiService = require('../services/tongyiService');
const localStorageService = require('../services/localStorageService');

// Controller to handle text translation
exports.translateText = async (req, res, next) => {
  try {
    const { text } = req.body;
    const apiKey = req.body.apiKey || process.env.DASHSCOPE_API_KEY || 'sk-55c3340169734c20b4c13c1719e8cd8c';

    // Validate request
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required and must not be empty' });
    }

    console.log('Translating text with length:', text.length);
    console.log('Using API key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'No API key provided');

    // Initialize Tongyi service with the provided API key
    const tongyiService = new TongyiService(apiKey);

    // Translate the text
    const translation = await tongyiService.translateArticle(text);

    console.log('Translation successful, length:', translation.length);

    // Send response
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      translation
    });

  } catch (error) {
    console.error('Text translation error:', error);

    // 确保响应头设置为JSON
    res.setHeader('Content-Type', 'application/json');

    // Determine appropriate error message
    if (error.message.includes('API key')) {
      return res.status(401).json({ error: 'Invalid API key or API quota exceeded' });
    } else if (error.response && error.response.data) {
      // 处理API返回的错误
      return res.status(500).json({
        error: 'Translation service error',
        details: error.response.data
      });
    }

    // 返回通用错误
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
};

// Controller to handle processing word lists and generating learning materials
exports.processWords = async (req, res, next) => {
  try {
    const { words } = req.body;
    const apiKey = req.body.apiKey || process.env.DASHSCOPE_API_KEY || 'sk-55c3340169734c20b4c13c1719e8cd8c';

    // Validate request
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Words array is required and must not be empty' });
    }

    // Initialize Tongyi service with the provided API key
    const tongyiService = new TongyiService(apiKey);

    // Step 1: Translate words
    const wordMeanings = await tongyiService.translateWords(words);

    // Step 2: Generate a simple article with the words
    const prompt = `Write a short English article (200-300 words) incorporating the following words. Make sure the article flows naturally and uses each word in context: ${words.join(', ')}`;

    const response = await tongyiService.client.chat.completions.create({
      model: tongyiService.textModel,
      messages: [
        { role: 'system', content: '你是一个专业的英语教育助手，擅长为英语学习者创作包含特定单词的文章。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    const generatedArticle = response.choices[0].message.content.trim();

    // Step 3: Process article with words for highlighting
    const { articleEn, highlightData } = await tongyiService.processArticleWithWords(generatedArticle, words);

    // 不再翻译文章
    const articleZh = ""; // 空字符串，不再需要中文翻译

    // 使用本地存储服务保存会话数据
    console.log('Saving session data to local storage...');
    const session = localStorageService.saveSession({
      inputWords: words,
      wordMeanings,
      articleEn,
      articleZh,
      highlightData,
      source: 'input'
    });

    const sessionId = session.sessionId;
    console.log('Session saved with ID:', sessionId);

    // Send response
    res.status(200).json({
      sessionId,
      wordMeanings,
      articleEn,
      articleZh,
      highlightData
    });

  } catch (error) {
    console.error('Process words error:', error);

    // Determine appropriate error message
    let errorMessage = 'An error occurred while processing your request';

    if (error.message.includes('API key')) {
      return res.status(401).json({ error: 'Invalid API key or API quota exceeded' });
    }

    next(error);
  }
};

// Controller to handle image upload and processing
exports.processImage = async (req, res, next) => {
  try {
    console.log('Processing image upload request...');
    const { imageData } = req.body;
    const apiKey = req.body.apiKey || process.env.DASHSCOPE_API_KEY || 'sk-55c3340169734c20b4c13c1719e8cd8c';

    // Validate request
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    console.log('API Key available:', !!apiKey);

    // Initialize Tongyi service
    const tongyiService = new TongyiService(apiKey);

    // Extract the base64 data part if full data URL is provided
    const base64Data = imageData.split(';base64,').pop();
    console.log('Image data extracted, length:', base64Data.length);

    // Process image to extract text and marked words
    console.log('Calling Tongyi service to process image...');
    const { articleText, markedWords } = await tongyiService.processImage(base64Data);

    if (!articleText || articleText.trim() === '') {
      console.log('No text extracted from image');
      return res.status(400).json({ error: 'Could not extract text from image' });
    }

    console.log('Extracted text length:', articleText.length);
    console.log('Marked words:', markedWords);

    // If no words were marked, return just the extracted text
    if (!markedWords || markedWords.length === 0) {
      console.log('No words were marked in the image');
      return res.status(200).json({
        articleEn: articleText,
        words: [],
        highlightData: []
      });
    }

    // Process the words if any were marked
    // 1. Translate words
    console.log('Translating marked words...');
    const wordMeanings = await tongyiService.translateWords(markedWords);
    console.log('Word meanings:', wordMeanings);

    // 2. Process article to find word occurrences and sentences
    console.log('Processing article to find word occurrences...');
    const { articleEn, highlightData } = await tongyiService.processArticleWithWords(articleText, markedWords);
    console.log('Highlight data count:', highlightData.length);

    // 不再翻译文章
    const articleZh = ""; // 空字符串，不再需要中文翻译

    // 使用本地存储服务保存会话数据
    console.log('Saving image processing results to local storage...');
    const session = localStorageService.saveSession({
      inputWords: markedWords,
      wordMeanings,
      articleEn,
      articleZh,
      highlightData,
      source: 'image'
    });

    const sessionId = session.sessionId;
    console.log('Session saved with ID:', sessionId);

    // 直接跳转到文章显示页面，不再显示单词输入框
    console.log('Sending successful response with session ID:', sessionId);
    res.status(200).json({
      sessionId,
      words: markedWords,
      wordMeanings,
      articleEn,
      articleZh,
      highlightData
    });
    console.log('Image processing completed successfully');

  } catch (error) {
    console.error('Process image error:', error);

    // 提供更详细的错误信息
    let errorMessage = 'An error occurred while processing the image';
    let statusCode = 500;

    if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key or API quota exceeded';
      statusCode = 401;
    } else if (error.message.includes('Failed to process image')) {
      errorMessage = 'Failed to process image: ' + error.message;
      statusCode = 400;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'API request timed out. Please try again with a smaller image';
      statusCode = 408;
    }

    console.error('Sending error response:', errorMessage, statusCode);
    res.status(statusCode).json({ error: errorMessage });
  }
}
