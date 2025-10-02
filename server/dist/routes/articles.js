"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const articleService_1 = require("../services/articleService");
const router = express_1.default.Router();
// Share an article
router.post('/share', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { url } = req.body;
        if (!url) {
            return next((0, errorHandler_1.createError)('URL is required', 400));
        }
        // Check if article already exists
        const existingArticle = await (0, database_1.query)('SELECT id FROM articles WHERE url = $1', [url]);
        if (existingArticle.rows.length > 0) {
            return next((0, errorHandler_1.createError)('Article already shared', 409));
        }
        // Create article entry (initially processing)
        const articleResult = await (0, database_1.query)('INSERT INTO articles (url, shared_by, is_processing) VALUES ($1, $2, true) RETURNING id', [url, req.user.id]);
        const articleId = articleResult.rows[0].id;
        // Process article in background (don't await)
        processArticleAsync(articleId, url);
        res.status(201).json({
            message: 'Article shared successfully, processing content...',
            articleId
        });
    }
    catch (error) {
        next(error);
    }
});
// Get feed (articles from friends)
router.get('/feed', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const articlesResult = await (0, database_1.query)(`SELECT 
        a.id, a.url, a.title, a.description, a.ai_summary, a.image_url, 
        a.is_processing, a.created_at,
        u.username, u.full_name, u.avatar_url,
        COUNT(ar.id) as reaction_count
       FROM articles a
       JOIN users u ON a.shared_by = u.id
       JOIN friendships f ON (f.friend_id = u.id AND f.user_id = $1 AND f.status = 'accepted')
          OR (f.user_id = u.id AND f.friend_id = $1 AND f.status = 'accepted')
          OR u.id = $1
       LEFT JOIN article_reactions ar ON a.id = ar.article_id
       GROUP BY a.id, u.id
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`, [req.user.id, limit, offset]);
        res.json({
            articles: articlesResult.rows,
            pagination: {
                page,
                limit,
                hasMore: articlesResult.rows.length === limit
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// React to article
router.post('/:articleId/react', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { articleId } = req.params;
        const { reaction } = req.body; // 'like', 'bookmark', 'read_later'
        if (!['like', 'bookmark', 'read_later'].includes(reaction)) {
            return next((0, errorHandler_1.createError)('Invalid reaction type', 400));
        }
        // Check if article exists
        const articleResult = await (0, database_1.query)('SELECT id FROM articles WHERE id = $1', [articleId]);
        if (articleResult.rows.length === 0) {
            return next((0, errorHandler_1.createError)('Article not found', 404));
        }
        // Add or update reaction
        await (0, database_1.query)(`INSERT INTO article_reactions (article_id, user_id, reaction) 
       VALUES ($1, $2, $3)
       ON CONFLICT (article_id, user_id, reaction) 
       DO NOTHING`, [articleId, req.user.id, reaction]);
        res.json({ message: 'Reaction added successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Add comment to article
router.post('/:articleId/comment', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { articleId } = req.params;
        const { content } = req.body;
        if (!content) {
            return next((0, errorHandler_1.createError)('Comment content is required', 400));
        }
        const commentResult = await (0, database_1.query)(`INSERT INTO comments (article_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, content, created_at`, [articleId, req.user.id, content]);
        const comment = commentResult.rows[0];
        res.status(201).json({
            message: 'Comment added successfully',
            comment: {
                ...comment,
                user: {
                    username: req.user.username
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Background article processing function
async function processArticleAsync(articleId, url) {
    try {
        console.log(`Processing article: ${url}`);
        // Scrape article content
        const articleData = await (0, articleService_1.scrapeArticle)(url);
        // Generate AI summary
        const aiSummary = await (0, articleService_1.generateAISummary)(articleData.content || articleData.description || '');
        // Update article in database
        await (0, database_1.query)(`UPDATE articles 
       SET title = $1, description = $2, content = $3, ai_summary = $4, 
           image_url = $5, is_processing = false, updated_at = NOW()
       WHERE id = $6`, [articleData.title, articleData.description, articleData.content,
            aiSummary, articleData.image, articleId]);
        console.log(`Article processed successfully: ${articleId}`);
    }
    catch (error) {
        console.error(`Error processing article ${articleId}:`, error);
        // Mark as failed processing
        await (0, database_1.query)('UPDATE articles SET is_processing = false, updated_at = NOW() WHERE id = $1', [articleId]);
    }
}
exports.default = router;
//# sourceMappingURL=articles.js.map