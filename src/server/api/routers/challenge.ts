import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const challengeRouter = createTRPCRouter({
  // Créer un challenge
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Le titre est requis"),
        description: z.string().optional(),
        type: z.enum(["STREAK", "POINTS", "COMPLETION", "TIME_BASED"]).default("STREAK"),
        goal: z.number().min(1, "L'objectif doit être supérieur à 0"),
        duration: z.number().min(1, "La durée doit être supérieure à 0"),
        points: z.number().min(1).default(100),
        isPublic: z.boolean().default(true),
        habitIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { habitIds, ...challengeData } = input;

      // Calculer la date de fin
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + input.duration);

      const challenge = await ctx.db.challenge.create({
        data: {
          ...challengeData,
          endDate,
          creatorId: ctx.session.user.id,
        },
      });

      // Ajouter les habitudes au challenge si spécifiées
      if (habitIds && habitIds.length > 0) {
        await ctx.db.challengeHabit.createMany({
          data: habitIds.map((habitId) => ({
            challengeId: challenge.id,
            habitId,
          })),
        });
      }

      return challenge;
    }),

  // Rejoindre un challenge
  join: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Vérifier si le challenge existe et est actif
      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.challengeId },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge non trouvé",
        });
      }

      if (!challenge.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ce challenge n'est plus actif",
        });
      }

      if (new Date() > challenge.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ce challenge est terminé",
        });
      }

      // Vérifier si l'utilisateur participe déjà
      const existingParticipation = await ctx.db.challengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId: input.challengeId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existingParticipation) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Vous participez déjà à ce challenge",
        });
      }

      // Créer la participation
      const participation = await ctx.db.challengeParticipant.create({
        data: {
          challengeId: input.challengeId,
          userId: ctx.session.user.id,
        },
      });

      return participation;
    }),

  // Récupérer tous les challenges
  getAll: protectedProcedure
    .input(
      z.object({
        type: z.enum(["all", "my", "joined", "public"]).default("all"),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let whereClause: any = {};

      switch (input.type) {
        case "my":
          whereClause = { creatorId: ctx.session.user.id };
          break;
        case "joined":
          whereClause = {
            participants: {
              some: { userId: ctx.session.user.id },
            },
          };
          break;
        case "public":
          whereClause = { isPublic: true, isActive: true };
          break;
        case "all":
        default:
          whereClause = {
            OR: [
              { isPublic: true, isActive: true },
              { creatorId: ctx.session.user.id },
              {
                participants: {
                  some: { userId: ctx.session.user.id },
                },
              },
            ],
          };
          break;
      }

      const challenges = await ctx.db.challenge.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              level: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  level: true,
                },
              },
            },
          },
          habits: {
            include: {
              habit: {
                select: {
                  id: true,
                  title: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      });

      return challenges;
    }),

  // Récupérer un challenge par ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              level: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  level: true,
                },
              },
            },
            orderBy: { progress: "desc" },
          },
          habits: {
            include: {
              habit: {
                select: {
                  id: true,
                  title: true,
                  icon: true,
                  color: true,
                  difficulty: true,
                  points: true,
                },
              },
            },
          },
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge non trouvé",
        });
      }

      // Vérifier si l'utilisateur participe au challenge
      const userParticipation = await ctx.db.challengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId: input.id,
            userId: ctx.session.user.id,
          },
        },
      });

      return {
        ...challenge,
        userParticipation,
      };
    }),

  // Récupérer le leaderboard d'un challenge
  getLeaderboard: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.challengeParticipant.findMany({
        where: { challengeId: input.challengeId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              level: true,
            },
          },
        },
        orderBy: [
          { isCompleted: "desc" },
          { progress: "desc" },
          { joinedAt: "asc" },
        ],
      });

      return participants.map((participant, index) => ({
        ...participant,
        rank: index + 1,
      }));
    }),

  // Mettre à jour le progrès d'un challenge
  updateProgress: protectedProcedure
    .input(
      z.object({
        challengeId: z.string(),
        progress: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier si l'utilisateur participe au challenge
      const participation = await ctx.db.challengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId: input.challengeId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!participation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vous ne participez pas à ce challenge",
        });
      }

      // Récupérer le challenge pour vérifier l'objectif
      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.challengeId },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge non trouvé",
        });
      }

      const isCompleted = input.progress >= challenge.goal;

      const updatedParticipation = await ctx.db.challengeParticipant.update({
        where: { id: participation.id },
        data: {
          progress: input.progress,
          isCompleted,
          ...(isCompleted && !participation.isCompleted && {
            completedAt: new Date(),
          }),
        },
      });

      // Si le challenge est complété, donner les points à l'utilisateur
      if (isCompleted && !participation.isCompleted) {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            totalPoints: { increment: challenge.points },
          },
        });
      }

      return updatedParticipation;
    }),

  // Quitter un challenge
  leave: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const participation = await ctx.db.challengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId: input.challengeId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!participation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vous ne participez pas à ce challenge",
        });
      }

      await ctx.db.challengeParticipant.delete({
        where: { id: participation.id },
      });

      return { success: true };
    }),

  // Récupérer les défis quotidiens
  getDailyChallenges: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyChallenges = await ctx.db.dailyChallenge.findMany({
      where: {
        isActive: true,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        completions: {
          where: { userId: ctx.session.user.id },
        },
      },
    });

    return dailyChallenges.map((challenge) => ({
      ...challenge,
      isCompleted: challenge.completions.length > 0,
    }));
  }),

  // Compléter un défi quotidien
  completeDailyChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Vérifier si le défi existe et est actif
      const challenge = await ctx.db.dailyChallenge.findFirst({
        where: {
          id: input.challengeId,
          isActive: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Défi quotidien non trouvé",
        });
      }

      // Vérifier si déjà complété
      const existingCompletion = await ctx.db.dailyChallengeCompletion.findUnique({
        where: {
          challengeId_userId: {
            challengeId: input.challengeId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existingCompletion) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ce défi quotidien a déjà été complété",
        });
      }

      // Créer la completion
      const completion = await ctx.db.dailyChallengeCompletion.create({
        data: {
          challengeId: input.challengeId,
          userId: ctx.session.user.id,
        },
      });

      // Donner les points à l'utilisateur
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          totalPoints: { increment: challenge.points },
        },
      });

      return completion;
    }),
});
