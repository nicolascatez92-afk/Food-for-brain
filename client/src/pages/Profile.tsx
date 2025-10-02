import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Friend } from '../types';
import api from '../utils/api';
import { Edit3, Users, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    avatarUrl: ''
  });
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchFriends();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.user;
      setProfile(userData);
      setFormData({
        fullName: userData.fullName || '',
        bio: userData.bio || '',
        avatarUrl: userData.avatarUrl || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await api.get('/users/friends');
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', formData);
      toast.success('Profil mis à jour !');
      setEditing(false);
      await fetchProfile();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendUsername.trim()) return;

    try {
      await api.post('/users/friends/request', { username: newFriendUsername.trim() });
      toast.success('Demande d\'ami envoyée !');
      setNewFriendUsername('');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors de l\'envoi';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <Edit3 className="h-5 w-5" />
                <span>{editing ? 'Annuler' : 'Modifier'}</span>
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="input-field"
                    placeholder="Ton nom complet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Raconte-nous qui tu es..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo de profil (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                    className="input-field"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.fullName || profile?.username}&background=3b82f6&color=fff&size=80`}
                    alt={profile?.fullName || profile?.username}
                    className="h-20 w-20 rounded-full"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profile?.fullName || profile?.username}
                    </h2>
                    <p className="text-gray-600">@{profile?.username}</p>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </div>
                </div>

                {profile?.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
                    <p className="text-gray-600">{profile.bio}</p>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Membre depuis {new Date(profile?.createdAt || '').toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Friends Section */}
        <div className="space-y-6">
          {/* Add Friend */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Ajouter un ami
            </h3>
            <form onSubmit={handleAddFriend} className="space-y-3">
              <input
                type="text"
                value={newFriendUsername}
                onChange={(e) => setNewFriendUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                className="input-field"
              />
              <button
                type="submit"
                disabled={!newFriendUsername.trim()}
                className="w-full btn-primary disabled:opacity-50"
              >
                Envoyer une demande
              </button>
            </form>
          </div>

          {/* Friends List */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Mes amis ({friends.length})
            </h3>
            
            {friends.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Aucun ami pour le moment. Invite tes proches à rejoindre Food for Brain !
              </p>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-3">
                    <img
                      src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.fullName || friend.username}&background=3b82f6&color=fff&size=40`}
                      alt={friend.fullName || friend.username}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {friend.fullName || friend.username}
                      </p>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;