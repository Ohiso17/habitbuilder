import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const habitRouter = createTRPCRouter({
  // Créer une nouvelle habitude
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Le titre est requis"),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().default("#3B82F6"),
        difficulty: z.number().min(1).max(5).default(1),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).default("DAILY"),
        timeOfDay: z.string().optional(),
        reminderTime: z.string().optional(),
        isPublic: z.boolean().default(false),
        hashtags: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const points = input.difficulty * 10; // Points basés sur la difficulté

      const habit = await ctx.db.habit.create({
        data: {
          ...input,
          points,
          userId: ctx.session.user.id,
        },
      });

      return habit;
    }),

  // Récupérer toutes les habitudes de l'utilisateur
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const habits = await ctx.db.habit.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return habits;
  }),

  // Récupérer une habitude par ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          completions: {
            orderBy: { completedAt: "desc" },
            take: 10,
          },
        },
      });

      if (!habit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Habitude non trouvée",
        });
      }

      return habit;
    }),

  // Marquer une habitude comme complétée
  complete: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        notes: z.string().optional(),
        mood: z.number().min(1).max(5).optional(),
        energy: z.number().min(1).max(5).optional(),
        photo: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: {
          id: input.habitId,
          userId: ctx.session.user.id,
        },
      });

      if (!habit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Habitude non trouvée",
        });
      }

      // Vérifier si déjà complétée aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingCompletion = await ctx.db.habitCompletion.findFirst({
        where: {
          habitId: input.habitId,
          userId: ctx.session.user.id,
          completedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (existingCompletion) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cette habitude a déjà été complétée aujourd'hui",
        });
      }

      // Créer la completion
      const completion = await ctx.db.habitCompletion.create({
        data: {
          habitId: input.habitId,
          userId: ctx.session.user.id,
          notes: input.notes,
          mood: input.mood,
          energy: input.energy,
          photo: input.photo,
        },
      });

      // Mettre à jour les statistiques de l'habitude
      await ctx.db.habit.update({
        where: { id: input.habitId },
        data: {
          totalCompletions: { increment: 1 },
          currentStreak: { increment: 1 },
        },
      });

      // Mettre à jour les points de l'utilisateur
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          totalPoints: { increment: habit.points },
        },
      });

      return completion;
    }),

  // Mettre à jour une habitude
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        difficulty: z.number().min(1).max(5).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).optional(),
        timeOfDay: z.string().optional(),
        reminderTime: z.string().optional(),
        isActive: z.boolean().optional(),
        isPublic: z.boolean().optional(),
        hashtags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const habit = await ctx.db.habit.findFirst({
        where: {
          id,
          userId: ctx.session.user.id,
        },
      });

      if (!habit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Habitude non trouvée",
        });
      }

      // Recalculer les points si la difficulté change
      if (updateData.difficulty) {
        updateData.points = updateData.difficulty * 10;
      }

      const updatedHabit = await ctx.db.habit.update({
        where: { id },
        data: updateData,
      });

      return updatedHabit;
    }),

  // Supprimer une habitude
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!habit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Habitude non trouvée",
        });
      }

      await ctx.db.habit.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Récupérer les analytics d'une habitude
  getAnalytics: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!habit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Habitude non trouvée",
        });
      }

      // Récupérer les completions des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completions = await ctx.db.habitCompletion.findMany({
        where: {
          habitId: input.id,
          completedAt: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: { completedAt: "asc" },
      });

      // Calculer le streak actuel
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        const hasCompletion = completions.some(
          (completion) =>
            completion.completedAt.toDateString() === checkDate.toDateString(),
        );

        if (hasCompletion) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculer le taux de succès
      const totalDays = 30;
      const completedDays = completions.length;
      const successRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

      return {
        habit,
        currentStreak,
        totalCompletions: habit.totalCompletions,
        successRate,
        completions: completions.map((completion) => ({
          date: completion.completedAt,
          mood: completion.mood,
          energy: completion.energy,
          notes: completion.notes,
        })),
      };
    }),

  // Récupérer les habitudes publiques pour la découverte
  getPublic: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        hashtag: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const habits = await ctx.db.habit.findMany({
        where: {
          isPublic: true,
          isActive: true,
          ...(input.hashtag && {
            hashtags: {
              has: input.hashtag,
            },
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return habits;
    }),
});
