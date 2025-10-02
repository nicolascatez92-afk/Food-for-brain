# 🧠 Food for Brain

Un réseau social privé entre amis pour partager des articles avec des résumés générés par IA.

## ✨ Fonctionnalités

- **Réseau privé** : Inscription uniquement sur invitation
- **Partage d'articles** : Partage d'URLs avec extraction automatique du contenu
- **Résumés IA** : Résumés automatiques des articles par ChatGPT
- **Feed social** : Timeline des articles partagés par tes amis
- **Interactions** : Likes, commentaires, sauvegarde d'articles
- **Gestion d'amis** : Système d'ajout d'amis et invitations

## 🛠 Stack Technique

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** pour la base de données
- **JWT** pour l'authentification
- **OpenAI API** pour les résumés IA
- **Cheerio** + **Axios** pour le scraping d'articles

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** pour le styling
- **React Router** pour la navigation
- **Axios** pour les requêtes API

## 🚀 Installation locale

### Prérequis
- Node.js 18+
- PostgreSQL
- Clé API OpenAI

### Configuration

1. Clone le projet :
```bash
git clone https://github.com/nicolascatez92-afk/Food-for-brain.git
cd Food-for-brain
```

2. Installe les dépendances :
```bash
npm run install:all
```

3. Configure les variables d'environnement :
```bash
cp .env.example .env
# Édite .env avec tes configurations
```

4. Lance l'application :
```bash
npm run dev
```

L'app sera disponible sur http://localhost:5173

## 📦 Déploiement sur Render

Le projet est configuré pour un déploiement automatique sur Render :

1. **Base de données** : PostgreSQL gratuite
2. **Web Service** : Déploiement automatique depuis GitHub
3. **Variables d'environnement** : Configurées automatiquement

### Commandes de déploiement

```bash
# Déployer avec Render CLI
render services create --from-repo

# Ou push sur GitHub pour déploiement automatique
git push origin main
```

## 🔑 Variables d'environnement

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=3001
```

## 🎯 Utilisation

1. **Inscription** : Utilise un code d'invitation
2. **Partage** : Colle l'URL d'un article intéressant
3. **IA** : L'article est automatiquement résumé
4. **Social** : Tes amis voient le résumé dans leur feed
5. **Interaction** : Ils peuvent liker ou lire l'article complet

## 📱 Fonctionnalités à venir

- [ ] Notifications push
- [ ] Catégories d'articles
- [ ] Suggestions d'articles
- [ ] Mode sombre
- [ ] Application mobile

## 🤝 Contribution

Ce projet est privé entre amis. Pour rejoindre, demande une invitation !

---

*Développé avec ❤️ pour partager des idées entre amis*