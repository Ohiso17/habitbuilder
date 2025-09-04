# 🚀 HabitBuilder - Deployment Guide

## Prerequisites

- GitHub account
- Neon DB account (for PostgreSQL database)
- Vercel account

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it `habitbuilder` (or your preferred name)
5. Make it **Public** (required for free Vercel deployment)
6. **Don't** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Push Code to GitHub

Run these commands in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/habitbuilder.git

# Push the code
git branch -M main
git push -u origin main
```

## Step 3: Set up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign up/Login with GitHub
3. Click "Create Project"
4. Choose a name (e.g., "habitbuilder")
5. Select a region close to you
6. Click "Create Project"
7. Copy the **Connection String** (it looks like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`)

## Step 4: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your `habitbuilder` repository
5. Click "Deploy"

## Step 5: Configure Environment Variables

In your Vercel dashboard:

1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```
DATABASE_URL=your_neon_connection_string_here
AUTH_SECRET=your_random_secret_key_here
NODE_ENV=production
```

**Optional (for Discord OAuth):**

```
AUTH_DISCORD_ID=your_discord_client_id
AUTH_DISCORD_SECRET=your_discord_client_secret
```

### Generate AUTH_SECRET:

```bash
openssl rand -base64 32
```

### Discord OAuth (Optional):

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 → General
4. Add redirect URI: `https://your-vercel-app.vercel.app/api/auth/callback/discord`
5. Copy Client ID and Client Secret

## Step 6: Set up Database

After deployment, run these commands in Vercel's terminal or locally:

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed the database (optional)
npm run db:seed
```

## Step 7: Test Your Application

1. Visit your Vercel URL
2. Try creating an account
3. Create your first habit
4. Test the social features

## Environment Variables Reference

| Variable              | Description                          | Required |
| --------------------- | ------------------------------------ | -------- |
| `DATABASE_URL`        | Neon PostgreSQL connection string    | ✅       |
| `AUTH_SECRET`         | Random secret for NextAuth.js        | ✅       |
| `AUTH_DISCORD_ID`     | Discord OAuth client ID              | ❌       |
| `AUTH_DISCORD_SECRET` | Discord OAuth client secret          | ❌       |
| `NODE_ENV`            | Environment (production/development) | ✅       |

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Check if your Neon database is active
- Ensure SSL mode is enabled

### Authentication Issues

- Verify `AUTH_SECRET` is set
- Check Discord OAuth redirect URIs
- Ensure environment variables are deployed

### Build Issues

- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

## Next Steps

1. **Custom Domain**: Add a custom domain in Vercel
2. **Analytics**: Set up Vercel Analytics
3. **Monitoring**: Add error tracking (Sentry)
4. **CI/CD**: Set up automatic deployments
5. **Backup**: Set up database backups in Neon

## Support

If you encounter issues:

1. Check Vercel function logs
2. Check Neon database logs
3. Review the application logs
4. Check GitHub issues for similar problems

---

**🎯 Your HabitBuilder app should now be live and ready to help users build better habits!**
