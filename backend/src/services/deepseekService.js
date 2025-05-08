const { OpenAI } = require('openai');

// Service to interact with DeepSeek API
class DeepseekService {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com'
    });
  }

  // Translate words to Chinese
  async translateWords(words) {
    try {
      const prompt = `请将以下英文单词翻译为中文，仅返回 JSON，对象 key 为原单词，value 为简体中文释义，不要输出多余文本：\n${words.join('\n')}`;

      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful translator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const content = response.choices[0].message.content.trim();
      
      // Try to parse JSON from the response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // If no JSON object found in standard format, try to parse the entire content
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing translation response:', parseError);
        
        // Fallback: create a manual mapping if JSON parsing fails
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

  // Generate article with highlighted words
  async generateArticle(words) {
    try {
      const prompt = `请使用以下单词创作一篇约 300 词的英语短文，语境自然。每个单词在文章中仅使用一次。对每个目标单词，用 <highlight></highlight> 包裹：\n${words.join('\n')}`;

      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful content creator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating article:', error);
      throw new Error('Failed to generate article');
    }
  }

  // Translate article to Chinese
  async translateArticle(article) {
    try {
      // Remove highlight tags for translation
      const cleanArticle = article.replace(/<highlight>|<\/highlight>/g, '');
      
      const prompt = `请将下列英文文章翻译为简体中文，仅输出翻译内容：\n${cleanArticle}`;

      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful translator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error translating article:', error);
      throw new Error('Failed to translate article');
    }
  }
}

module.exports = DeepseekService;
