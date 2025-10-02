import React, { useState } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface ShareArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareArticleModal: React.FC<ShareArticleModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      await api.post('/articles/share', { url: url.trim() });
      toast.success('Article partagé ! Traitement en cours...');
      setUrl('');
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors du partage';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Partager un article</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              URL de l'article
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            {url && !isValidUrl(url) && (
              <p className="text-red-500 text-sm mt-1">URL invalide</p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 L'article sera automatiquement analysé et résumé par l'IA pour tes amis !
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim() || !isValidUrl(url)}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Partage...' : 'Partager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareArticleModal;