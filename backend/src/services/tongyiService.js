const { OpenAI } = require('openai');

// 通义千问服务类
class TongyiService {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.DASHSCOPE_API_KEY, // 使用传入的key或环境变量
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    });

    // 默认使用的模型
    this.textModel = "qwen-max-latest"; // 纯文本模型
    this.visionModel = "qwen-vl-plus"; // 视觉模型
  }

  // 处理图片和标记单词
  async processImage(imageBase64) {
    try {
      // 创建图片URL (base64格式)
      const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

      console.log('Processing image with Tongyi Vision API...');

      const response = await this.client.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: "你是一个专业的英语文档分析助手。请从图片中提取完整的英文文本内容，同时识别出用户用方框标记的英文单词。"
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  "url": imageUrl
                }
              },
              {
                type: "text",
                text: "请提取图片中的英文文本内容，并识别出我用方框标记的英文单词。返回JSON格式，包含以下字段：'articleText'(完整文章文本)、'markedWords'(标记的单词列表)、'sentences'(每个标记单词所在的完整句子)。"
              }
            ]
          }
        ]
      });

      // 解析响应内容
      const content = response.choices[0].message.content;

      try {
        // 尝试直接解析JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }

        // 如果没有直接返回JSON，尝试提取信息
        const articleTextMatch = content.match(/articleText["\s:]+(.*?)(?:,|\})/);
        const markedWordsMatch = content.match(/markedWords["\s:]+\[(.*?)\]/);
        const sentencesMatch = content.match(/sentences["\s:]+\{(.*?)\}/);

        const articleText = articleTextMatch ? articleTextMatch[1].trim().replace(/^["']|["']$/g, '') : '';
        const markedWordsString = markedWordsMatch ? markedWordsMatch[1] : '';
        const markedWords = markedWordsString.split(',').map(word => word.trim().replace(/^["']|["']$/g, ''));

        // 处理句子信息
        let sentences = {};
        if (sentencesMatch && sentencesMatch[1]) {
          try {
            sentences = JSON.parse(`{${sentencesMatch[1]}}`);
          } catch (e) {
            console.log('Failed to parse sentences, will be handled in processArticleWithWords');
          }
        }

        return {
          articleText,
          markedWords: markedWords.filter(w => w),
          sentences
        };
      } catch (parseError) {
        console.error('Error parsing vision response:', parseError);

        // 如果解析失败，尝试手动提取内容
        const lines = content.split('\n');

        // 尝试找出文章内容和标记单词
        let articleText = '';
        let markedWords = [];

        let inArticle = false;
        for (const line of lines) {
          if (line.toLowerCase().includes('article') || line.toLowerCase().includes('text:')) {
            inArticle = true;
            continue;
          }

          if (inArticle && (line.toLowerCase().includes('marked') || line.toLowerCase().includes('words:'))) {
            inArticle = false;
          }

          if (inArticle) {
            articleText += line + '\n';
          }

          if (line.match(/\b\w+\b/) && (
              line.toLowerCase().includes('marked') ||
              line.toLowerCase().includes('highlight') ||
              line.toLowerCase().includes('框') ||
              line.includes('*'))) {
            const words = line.match(/\b[a-zA-Z]+\b/g);
            if (words) {
              markedWords = markedWords.concat(words);
            }
          }
        }

        // 尝试提取句子信息
        let sentences = {};
        let inSentences = false;
        for (const line of lines) {
          if (line.toLowerCase().includes('sentence') || line.toLowerCase().includes('句子')) {
            inSentences = true;
            continue;
          }

          if (inSentences) {
            // 尝试匹配 "单词: 句子" 的模式
            const sentenceMatch = line.match(/["']?([a-zA-Z]+)["']?\s*[:：]\s*["']?([^"']+)["']?/);
            if (sentenceMatch && sentenceMatch[1] && sentenceMatch[2]) {
              const word = sentenceMatch[1].trim();
              const sentence = sentenceMatch[2].trim();
              if (word && sentence) {
                sentences[word] = sentence;
              }
            }
          }
        }

        return {
          articleText: articleText.trim(),
          markedWords: markedWords,
          sentences
        };
      }
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  // 翻译单词
  async translateWords(words) {
    try {
      const prompt = `请将以下英文单词翻译为中文，仅返回 JSON，对象 key 为原单词，value 为简体中文释义，不要输出多余文本：\n${words.join('\n')}`;

      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [
          { role: 'system', content: '你是一个专业的英汉翻译助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const content = response.choices[0].message.content.trim();

      // 尝试解析JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }

        // 如果没有JSON对象找到，尝试解析整个内容
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing translation response:', parseError);

        // 如果解析失败，创建手动映射
        const fallbackMeanings = {};
        words.forEach(word => {
          const regex = new RegExp(`"${word}"\\s*:\\s*"([^"]+)"`, 'i');
          const match = content.match(regex);
          if (match && match[1]) {
            fallbackMeanings[word] = match[1];
          } else {
            fallbackMeanings[word] = '未找到翻译';
          }
        });

        return fallbackMeanings;
      }
    } catch (error) {
      console.error('Error translating words:', error);
      throw new Error('Failed to translate words');
    }
  }

  // 查找单词位置
  async processArticleWithWords(article, words, sentences = {}) {
    try {
      const prompt = `
我会给你一篇英文文章和一些英文单词列表。请帮我:
1. 找出这些单词在文章中出现的位置
2. 返回处理后的结果，格式为JSON

文章:
"${article}"

单词列表:
${words.join(', ')}

请以以下JSON格式返回:
{
  "highlightData": [
    {
      "word": "单词1",
      "positions": [{"start": 数字位置}]
    },
    ...其他单词
  ]
}

注意:
- 只需返回JSON，不需要其他解释
- 如果单词在文章中未出现，仍然保留在结果中，但positions为空数组
`;

      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [
          { role: 'system', content: '你是一个文本处理专家。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      });

      const content = response.choices[0].message.content.trim();

      // 解析响应
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);

          return {
            articleEn: article,
            highlightData: parsedData.highlightData
          };
        }

        throw new Error('No valid JSON found in response');
      } catch (parseError) {
        console.error('Error parsing article processing response:', parseError);

        // 如果解析失败，手动处理文章
        return this.manuallyProcessArticle(article, words);
      }
    } catch (error) {
      console.error('Error processing article with words:', error);
      throw new Error('Failed to process article with words');
    }
  }

  // 翻译文章
  async translateArticle(article) {
    try {
      console.log('Starting article translation, length:', article.length);

      // 如果文章太长，分段翻译
      if (article.length > 4000) {
        console.log('Article is too long, splitting into chunks');
        return this.translateLongArticle(article);
      }

      const prompt = `请将下列英文文章翻译为简体中文，仅输出翻译内容：\n"${article}"`;

      console.log('Sending translation request to API');
      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [
          { role: 'system', content: '你是一个专业的英汉翻译助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      console.log('Translation API response received');
      const translation = response.choices[0].message.content.trim();
      console.log('Translation completed, length:', translation.length);

      return translation;
    } catch (error) {
      console.error('Error translating article:', error);

      // 提供更详细的错误信息
      if (error.response) {
        console.error('API response error:', error.response.status, error.response.data);
        throw new Error(`Translation API error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received from API');
        throw new Error('No response received from translation API');
      } else {
        throw new Error(`Failed to translate article: ${error.message}`);
      }
    }
  }

  // 处理长文章的翻译
  async translateLongArticle(article) {
    try {
      // 将文章分成段落
      const paragraphs = article.split('\n\n');
      let translatedParagraphs = [];

      console.log(`Split article into ${paragraphs.length} paragraphs`);

      // 逐段翻译
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        if (paragraph) {
          console.log(`Translating paragraph ${i+1}/${paragraphs.length}, length: ${paragraph.length}`);
          const translatedParagraph = await this.translateParagraph(paragraph);
          translatedParagraphs.push(translatedParagraph);
        }
      }

      // 合并翻译结果
      return translatedParagraphs.join('\n\n');
    } catch (error) {
      console.error('Error in long article translation:', error);
      throw error;
    }
  }

  // 翻译单个段落
  async translateParagraph(paragraph) {
    try {
      const prompt = `请将下列英文段落翻译为简体中文，仅输出翻译内容：\n"${paragraph}"`;

      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [
          { role: 'system', content: '你是一个专业的英汉翻译助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error translating paragraph:', error);
      throw new Error(`Failed to translate paragraph: ${error.message}`);
    }
  }

  // 手动处理文章（后备方案）
  manuallyProcessArticle(article, words) {
    const highlightData = [];

    // 为每个单词处理
    for (const word of words) {
      const lowercaseWord = word.toLowerCase();
      const positions = [];

      // 查找单词位置
      let currentIndex = article.toLowerCase().indexOf(lowercaseWord);
      while (currentIndex !== -1) {
        // 检查是否是完整单词（边界检查）
        const isWordBoundaryBefore = currentIndex === 0 || !article[currentIndex - 1].match(/[a-zA-Z]/);
        const isWordBoundaryAfter = currentIndex + lowercaseWord.length === article.length ||
                                    !article[currentIndex + lowercaseWord.length].match(/[a-zA-Z]/);

        if (isWordBoundaryBefore && isWordBoundaryAfter) {
          positions.push({ start: currentIndex });
        }

        currentIndex = article.toLowerCase().indexOf(lowercaseWord, currentIndex + 1);
      }

      highlightData.push({
        word,
        positions
      });
    }

    return {
      articleEn: article,
      highlightData
    };
  }
}

module.exports = TongyiService;
