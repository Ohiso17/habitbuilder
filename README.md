# 🎯 HabitBuilder

**Transformez vos bonnes résolutions en habitudes durables**

HabitBuilder est une application web complète de construction d'habitudes qui garde les utilisateurs engagés et les aide à maintenir leurs bonnes résolutions. L'application résout le problème concret que 92% des gens abandonnent leurs bonnes résolutions après 3 mois.

## ✨ Fonctionnalités Principales

### 🎮 Gamification & Rétention

- **Système de Streaks & Points** : Calculer les streaks en temps réel pour chaque habitude
- **Points basés sur la difficulté** : 1-5 étoiles avec points proportionnels
- **Niveaux utilisateur** : Système de progression avec badges visuels
- **Animations de célébration** : Pour les milestones et achievements
- **Notifications intelligentes** : Rappels de "streak en danger" avant minuit

### 👥 Fonctionnalités Sociales

- **Système d'Amis** : Ajout par email ou code d'invitation
- **Challenges personnalisés** : Streak, points, completion, temps
- **Leaderboard en temps réel** : Pour chaque challenge
- **Feed Social** : Activités des amis, partage d'achievements
- **Système de likes/commentaires** : Engagement social

### 🧠 Intelligence Artificielle & Personnalisation

- **Recommandations intelligentes** : Analyser les patterns de succès/échec
- **Rappels adaptatifs** : Basés sur l'historique personnel
- **Prédictions d'abandon** : Alertes préventives
- **Ajustement automatique** : De la difficulté des habitudes

### 📊 Analytics & Insights Avancés

- **Dashboard de Performance** : Graphiques sur 30/90/365 jours
- **Heatmap des habitudes** : Style GitHub
- **Corrélations** : Entre habitudes et humeur/énergie
- **Rapports personnalisés** : Hebdomadaires/mensuels

### 🏆 Défis & Motivation

- **Défis quotidiens** : Triple Threat, Weekend Warrior, Early Bird
- **Système de récompenses** : Thèmes, animations, badges exclusifs
- **Économie virtuelle** : Points échangeables contre des récompenses

## 🛠️ Stack Technique

- **Next.js 15** avec App Router
- **TypeScript** pour la type safety
- **Prisma** avec PostgreSQL
- **tRPC** pour les APIs type-safe
- **NextAuth.js** pour l'authentification email/password
- **Tailwind CSS** pour le styling
- **Zod** pour la validation

## 🚀 Installation & Configuration

### Prérequis

- Node.js 18+
- PostgreSQL
- npm ou yarn

### 1. Cloner le projet

```bash
git clone <repository-url>
cd habitbuilder
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos configurations :

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/habitbuilder?schema=public"

# NextAuth.js
AUTH_SECRET="your-secret-key-here"
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"

# Environment
NODE_ENV="development"
```

### 4. Configuration de la base de données

```bash
# Démarrer PostgreSQL (avec Docker)
./start-database.sh

# Appliquer les migrations
npm run db:push

# Générer le client Prisma
npm run db:generate

# Peupler avec des données de test
npm run db:seed
```

### 5. Démarrer l'application

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📱 Pages & Routes

### Pages Principales

- `/` - Landing page avec features et CTA
- `/auth` - Authentification (login/signup)
- `/dashboard` - Dashboard principal avec stats et habitudes
- `/habits` - Gestion des habitudes
- `/habits/[id]` - Détail d'une habitude avec analytics
- `/social` - Feed social et amis
- `/challenges` - Défis et challenges

### APIs tRPC Disponibles

#### Router Habit

- `create` - Créer une habitude
- `update` - Modifier une habitude
- `delete` - Supprimer une habitude
- `getAll` - Récupérer toutes les habitudes
- `getById` - Récupérer une habitude par ID
- `complete` - Marquer une habitude comme complétée
- `getAnalytics` - Analytics d'une habitude

#### Router User

- `getProfile` - Profil utilisateur
- `updateProfile` - Mettre à jour le profil
- `getStats` - Statistiques utilisateur
- `getLevel` - Niveau et progression
- `getBadges` - Badges de l'utilisateur
- `signUp` - Inscription

#### Router Social

- `addFriend` - Ajouter un ami
- `getFriends` - Liste des amis
- `getFeed` - Feed d'activités
- `getLeaderboard` - Classements
- `createPost` - Créer un post
- `likePost` - Liker un post

#### Router Challenge

- `create` - Créer un challenge
- `join` - Rejoindre un challenge
- `getAll` - Tous les challenges
- `getById` - Détail d'un challenge
- `getLeaderboard` - Classement d'un challenge

## 🎯 Objectifs de Rétention

- **Jour 1** : 90% des utilisateurs créent leur première habitude
- **Semaine 1** : 70% des utilisateurs complètent au moins 3 habitudes
- **Mois 1** : 50% des utilisateurs maintiennent un streak de 7 jours
- **Mois 3** : 30% des utilisateurs sont encore actifs

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev          # Démarrer en mode développement
npm run build        # Build de production
npm run start        # Démarrer en mode production

# Base de données
npm run db:push      # Appliquer les changements de schéma
npm run db:generate  # Générer le client Prisma
npm run db:studio    # Interface Prisma Studio
npm run db:seed      # Peupler avec des données de test

# Qualité du code
npm run lint         # Linter
npm run lint:fix     # Corriger automatiquement
npm run typecheck    # Vérification TypeScript
npm run format:write # Formater le code
```

## 🏗️ Architecture

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── auth/              # Page d'authentification
│   ├── dashboard/         # Dashboard principal
│   ├── habits/            # Gestion des habitudes
│   ├── social/            # Fonctionnalités sociales
│   └── challenges/        # Challenges et défis
├── server/                # Backend (tRPC + Prisma)
│   ├── api/routers/       # Routers tRPC
│   ├── auth/              # Configuration NextAuth
│   ├── services/          # Services métier
│   └── scripts/           # Scripts utilitaires
└── trpc/                  # Configuration tRPC client
```

## 🎨 Design & UX

- **Design moderne** : Interface colorée et engageante
- **Mode sombre/clair** : Thèmes personnalisables
- **Animations fluides** : Micro-interactions engageantes
- **Mobile-first** : Interface responsive
- **Accessibilité** : Conforme aux standards WCAG

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connecter votre repository GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Docker

```bash
docker build -t habitbuilder .
docker run -p 3000:3000 habitbuilder
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [T3 Stack](https://create.t3.gg/) pour le boilerplate
- [Next.js](https://nextjs.org/) pour le framework
- [Prisma](https://prisma.io/) pour l'ORM
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [tRPC](https://trpc.io/) pour les APIs type-safe

---

**🎯 Transformez votre vie, une habitude à la fois !**
