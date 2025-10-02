import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, Heart, Bookmark, MessageCircle, Loader2 } from 'lucide-react';
import { Article } from '../types';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface ArticleCardProps {
  article: Article;
  onUpdate: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleReaction = async (reaction: 'like' | 'bookmark') => {
    try {
      await api.post(`/articles/${article.id}/react`, { reaction });
      toast.success(reaction === 'like' ? 'Article aimé !' : 'Article sauvegardé !');
      onUpdate();
    } catch (error: any) {
      toast.error('Erreur lors de la réaction');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/articles/${article.id}/comment`, { content: newComment.trim() });
      setNewComment('');
      toast.success('Commentaire ajouté !');
      onUpdate();
    } catch (error: any) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmittingComment(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(article.createdAt), { 
    addSuffix: true, 
    locale: fr 
  });

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={article.avatarUrl || `https://ui-avatars.com/api/?name=${article.fullName || article.username}&background=3b82f6&color=fff`}
          alt={article.fullName || article.username}
          className="h-10 w-10 rounded-full"
        />
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {article.fullName || article.username}
          </p>
          <p className="text-sm text-gray-500">{timeAgo}</p>
        </div>
      </div>

      {/* Article Content */}
      {article.isProcessing ? (
        <div className="flex items-center space-x-3 py-8 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Traitement de l'article en cours...</span>
        </div>
      ) : (
        <>
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}

          {article.title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {article.title}
            </h3>
          )}

          {article.aiSummary && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Résumé IA 🤖
                  </p>
                  <p className="text-sm text-blue-700">
                    {article.aiSummary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {article.description && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {article.description}
            </p>
          )}

          {/* Article Link */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Lire l'article complet</span>
          </a>
        </>
      )}

      {/* Actions */}
      {!article.isProcessing && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => handleReaction('like')}
              className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <Heart className="h-5 w-5" />
              <span className="text-sm">{article.reactionCount}</span>
            </button>

            <button
              onClick={() => handleReaction('bookmark')}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Bookmark className="h-5 w-5" />
              <span className="text-sm">Sauvegarder</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">Commenter</span>
            </button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && !article.isProcessing && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <form onSubmit={handleComment} className="flex space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 input-field"
              disabled={submittingComment}
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {submittingComment ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;