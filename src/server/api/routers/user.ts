import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  // Récupérer le profil de l'utilisateur
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        badges: {
          include: {
            badge: true,
          },
          orderBy: { earnedAt: "desc" },
        },
        _count: {
          select: {
            habits: true,
            friends: {
              where: { status: "ACCEPTED" },
            },
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    return user;
  }),

  // Mettre à jour le profil
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        username: z.string().min(3).optional(),
        bio: z.string().max(500).optional(),
        theme: z.enum(["light", "dark"]).optional(),
        avatar: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier si le username est déjà pris
      if (input.username) {
        const existingUser = await ctx.db.user.findFirst({
          where: {
            username: input.username,
            id: { not: ctx.session.user.id },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ce nom d'utilisateur est déjà pris",
          });
        }
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });

      return updatedUser;
    }),

  // Récupérer les statistiques de l'utilisateur
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Récupérer les statistiques des habitudes
    const habits = await ctx.db.habit.findMany({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        totalCompletions: true,
        points: true,
        difficulty: true,
      },
    });

    // Calculer les statistiques
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((sum, habit) => sum + habit.totalCompletions, 0);
    const totalPoints = habits.reduce((sum, habit) => sum + (habit.points * habit.totalCompletions), 0);
    const averageStreak = totalHabits > 0 ? habits.reduce((sum, habit) => sum + habit.currentStreak, 0) / totalHabits : 0;
    const longestStreak = Math.max(...habits.map(habit => habit.longestStreak), 0);

    // Récupérer les completions des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompletions = await ctx.db.habitCompletion.findMany({
      where: {
        userId,
        completedAt: { gte: thirtyDaysAgo },
      },
      select: {
        completedAt: true,
        mood: true,
        energy: true,
      },
    });

    // Calculer le taux de succès des 30 derniers jours
    const totalPossibleCompletions = totalHabits * 30;
    const actualCompletions = recentCompletions.length;
    const successRate = totalPossibleCompletions > 0 ? (actualCompletions / totalPossibleCompletions) * 100 : 0;

    // Calculer la moyenne de l'humeur et de l'énergie
    const moodEntries = recentCompletions.filter(c => c.mood !== null);
    const energyEntries = recentCompletions.filter(c => c.energy !== null);
    
    const averageMood = moodEntries.length > 0 
      ? moodEntries.reduce((sum, c) => sum + (c.mood ?? 0), 0) / moodEntries.length 
      : 0;
    
    const averageEnergy = energyEntries.length > 0 
      ? energyEntries.reduce((sum, c) => sum + (c.energy ?? 0), 0) / energyEntries.length 
      : 0;

    return {
      totalHabits,
      totalCompletions,
      totalPoints,
      averageStreak: Math.round(averageStreak * 10) / 10,
      longestStreak,
      successRate: Math.round(successRate * 10) / 10,
      averageMood: Math.round(averageMood * 10) / 10,
      averageEnergy: Math.round(averageEnergy * 10) / 10,
      recentCompletions: recentCompletions.length,
    };
  }),

  // Récupérer le niveau et la progression
  getLevel: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        level: true,
        totalPoints: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    // Calculer les points nécessaires pour le prochain niveau
    const pointsForNextLevel = user.level * 1000;
    const pointsForCurrentLevel = (user.level - 1) * 1000;
    const progress = pointsForCurrentLevel > 0 
      ? ((user.totalPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100
      : (user.totalPoints / pointsForNextLevel) * 100;

    return {
      level: user.level,
      totalPoints: user.totalPoints,
      pointsForNextLevel,
      progress: Math.min(100, Math.max(0, Math.round(progress * 10) / 10)),
    };
  }),

  // Récupérer les badges de l'utilisateur
  getBadges: protectedProcedure.query(async ({ ctx }) => {
    const userBadges = await ctx.db.userBadge.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: "desc" },
    });

    return userBadges;
  }),

  // Inscription d'un nouvel utilisateur
  signUp: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Le nom est requis"),
        email: z.string().email("Email invalide"),
        password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
        username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier si l'email existe déjà
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un compte avec cet email existe déjà",
        });
      }

      // Vérifier si le username existe déjà
      const existingUsername = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existingUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ce nom d'utilisateur est déjà pris",
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Créer l'utilisateur
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          username: input.username,
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      };
    }),

  // Changer le mot de passe
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { password: true },
      });

      if (!user?.password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(
        input.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mot de passe actuel incorrect",
        });
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(input.newPassword, 12);

      // Mettre à jour le mot de passe
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedNewPassword },
      });

      return { success: true };
    }),

  // Rechercher des utilisateurs
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { username: { contains: input.query, mode: "insensitive" } },
          ],
          id: { not: ctx.session.user.id }, // Exclure l'utilisateur actuel
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          level: true,
          totalPoints: true,
          _count: {
            select: {
              habits: true,
            },
          },
        },
        take: input.limit,
      });

      return users;
    }),
});
