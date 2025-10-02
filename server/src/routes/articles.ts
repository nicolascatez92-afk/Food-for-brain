import express from 'express';
import { query } from '../utils/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { scrapeArticle, generateAISummary } from '../services/articleService';

const router = express.Router();

// Share an article
router.post('/share', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return next(createError('URL is required', 400));
    }

    // Check if article already exists
    const existingArticle = await query(
      'SELECT id FROM articles WHERE url = $1',
      [url]
    );

    if (existingArticle.rows.length > 0) {
      return next(createError('Article already shared', 409));
    }

    // Create article entry (initially processing)
    const articleResult = await query(
      'INSERT INTO articles (url, shared_by, is_processing) VALUES ($1, $2, true) RETURNING id',
      [url, req.user!.id]
    );

    const articleId = articleResult.rows[0].id;

    // Process article in background (don't await)
    processArticleAsync(articleId, url);

    res.status(201).json({
      message: 'Article shared successfully, processing content...',
      articleId
    });
  } catch (error) {
    next(error);
  }
});

// Get feed (articles from friends)
router.get('/feed', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const articlesResult = await query(
      `SELECT 
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
       LIMIT $2 OFFSET $3`,
      [req.user!.id, limit, offset]
    );

    res.json({ 
      articles: articlesResult.rows,
      pagination: {
        page,
        limit,
        hasMore: articlesResult.rows.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// React to article
router.post('/:articleId/react', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { articleId } = req.params;
    const { reaction } = req.body; // 'like', 'bookmark', 'read_later'

    if (!['like', 'bookmark', 'read_later'].includes(reaction)) {
      return next(createError('Invalid reaction type', 400));
    }

    // Check if article exists
    const articleResult = await query(
      'SELECT id FROM articles WHERE id = $1',
      [articleId]
    );

    if (articleResult.rows.length === 0) {
      return next(createError('Article not found', 404));
    }

    // Add or update reaction
    await query(
      `INSERT INTO article_reactions (article_id, user_id, reaction) 
       VALUES ($1, $2, $3)
       ON CONFLICT (article_id, user_id, reaction) 
       DO NOTHING`,
      [articleId, req.user!.id, reaction]
    );

    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    next(error);
  }
});

// Add comment to article
router.post('/:articleId/comment', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { articleId } = req.params;
    const { content } = req.body;

    if (!content) {
      return next(createError('Comment content is required', 400));
    }

    const commentResult = await query(
      `INSERT INTO comments (article_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, content, created_at`,
      [articleId, req.user!.id, content]
    );

    const comment = commentResult.rows[0];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        ...comment,
        user: {
          username: req.user!.username
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Background article processing function
async function processArticleAsync(articleId: string, url: string) {
  try {
    console.log(`Processing article: ${url}`);
    
    // Scrape article content
    const articleData = await scrapeArticle(url);
    
    // Generate AI summary
    const aiSummary = await generateAISummary(articleData.content || articleData.description || '');
    
    // Update article in database
    await query(
      `UPDATE articles 
       SET title = $1, description = $2, content = $3, ai_summary = $4, 
           image_url = $5, is_processing = false, updated_at = NOW()
       WHERE id = $6`,
      [articleData.title, articleData.description, articleData.content, 
       aiSummary, articleData.image, articleId]
    );
    
    console.log(`Article processed successfully: ${articleId}`);
  } catch (error) {
    console.error(`Error processing article ${articleId}:`, error);
    
    // Mark as failed processing
    await query(
      'UPDATE articles SET is_processing = false, updated_at = NOW() WHERE id = $1',
      [articleId]
    );
  }
}

export default router;