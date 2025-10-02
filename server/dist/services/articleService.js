"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeArticle = scrapeArticle;
exports.generateAISummary = generateAISummary;
exports.extractArticleMetadata = extractArticleMetadata;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
async function scrapeArticle(url) {
    try {
        console.log(`Scraping article: ${url}`);
        const response = await axios_1.default.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        // Extract title
        const title = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text() ||
            $('h1').first().text();
        // Extract description
        const description = $('meta[property="og:description"]').attr('content') ||
            $('meta[name="twitter:description"]').attr('content') ||
            $('meta[name="description"]').attr('content');
        // Extract main image
        const image = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content');
        // Extract main content (try multiple selectors)
        let content = '';
        const contentSelectors = [
            'article',
            '[role="main"]',
            '.post-content',
            '.article-content',
            '.entry-content',
            '.content',
            'main',
            '.post-body'
        ];
        for (const selector of contentSelectors) {
            const element = $(selector);
            if (element.length && element.text().trim().length > content.length) {
                // Remove scripts, styles, ads, and other unwanted elements
                element.find('script, style, nav, aside, footer, .ad, .advertisement, .social-share').remove();
                content = element.text().trim();
            }
        }
        // Fallback: try to get paragraphs
        if (!content || content.length < 200) {
            const paragraphs = $('p').map((i, el) => $(el).text().trim()).get();
            content = paragraphs.filter(p => p.length > 50).join('\n\n');
        }
        // Clean up content
        content = content
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .trim()
            .substring(0, 5000); // Limit content length
        return {
            title: title?.trim().substring(0, 200),
            description: description?.trim().substring(0, 500),
            content,
            image,
            author: $('meta[name="author"]').attr('content')
        };
    }
    catch (error) {
        console.error('Error scraping article:', error);
        throw new Error('Failed to scrape article content');
    }
}
async function generateAISummary(content) {
    try {
        if (!content || content.length < 100) {
            return 'Article content too short to summarize.';
        }
        console.log('Generating AI summary...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un assistant qui résume des articles de façon concise et engageante pour un réseau social entre amis. 
          
          Instructions:
          - Résume l'article en 2-3 phrases maximum (80-120 mots)
          - Utilise un ton amical et accessible
          - Mets en avant les points les plus intéressants ou surprenants
          - Termine par une question ou un point de réflexion pour engager la discussion
          - Écris en français
          - Évite le jargon technique sauf si nécessaire`
                },
                {
                    role: 'user',
                    content: `Résume cet article: ${content.substring(0, 3000)}`
                }
            ],
            max_tokens: 200,
            temperature: 0.7
        });
        const summary = completion.choices[0]?.message?.content?.trim();
        if (!summary) {
            throw new Error('Empty summary generated');
        }
        console.log('AI summary generated successfully');
        return summary;
    }
    catch (error) {
        console.error('Error generating AI summary:', error);
        // Fallback: create a simple summary from the beginning of the content
        const sentences = content.split('.').slice(0, 3);
        return sentences.join('.') + (sentences.length === 3 ? '.' : '');
    }
}
async function extractArticleMetadata(url) {
    try {
        // Quick metadata extraction without full content scraping
        const response = await axios_1.default.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FoodForBrain/1.0)'
            }
        });
        const $ = cheerio.load(response.data);
        return {
            title: $('meta[property="og:title"]').attr('content') || $('title').text(),
            description: $('meta[property="og:description"]').attr('content'),
            image: $('meta[property="og:image"]').attr('content')
        };
    }
    catch (error) {
        console.error('Error extracting metadata:', error);
        return { title: url };
    }
}
//# sourceMappingURL=articleService.js.map