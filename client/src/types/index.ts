export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  url: string;
  title?: string;
  description?: string;
  aiSummary?: string;
  imageUrl?: string;
  isProcessing: boolean;
  createdAt: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  reactionCount: number;
}

export interface Friend {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  friendsSince: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    avatarUrl?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName: string, invitationCode: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}