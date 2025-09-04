import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  // Récupérer toutes les notifications de l'utilisateur
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        unreadOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return notifications;
    }),

  // Marquer une notification comme lue
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification non trouvée",
        });
      }

      const updatedNotification = await ctx.db.notification.update({
        where: { id: input.id },
        data: { isRead: true },
      });

      return updatedNotification;
    }),

  // Marquer toutes les notifications comme lues
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }),

  // Supprimer une notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification non trouvée",
        });
      }

      await ctx.db.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Récupérer le nombre de notifications non lues
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
    });

    return count;
  }),

  // Créer une notification (utilisé par d'autres services)
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "STREAK_REMINDER",
          "BADGE_EARNED",
          "FRIEND_REQUEST",
          "CHALLENGE_INVITATION",
          "DAILY_CHALLENGE",
          "ACHIEVEMENT",
          "SOCIAL_ACTIVITY",
          "SYSTEM",
        ]),
        title: z.string().min(1),
        message: z.string().min(1),
        data: z.record(z.any()).optional(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.create({
        data: {
          ...input,
          userId: input.userId,
        },
      });

      return notification;
    }),
});
