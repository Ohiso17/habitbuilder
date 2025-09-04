import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const socialRouter = createTRPCRouter({
  // Ajouter un ami
  addFriend: protectedProcedure
    .input(
      z.object({
        emailOrUsername: z.string().min(1, "Email ou nom d'utilisateur requis"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Trouver l'utilisateur par email ou username
      const friend = await ctx.db.user.findFirst({
        where: {
          OR: [
            { email: input.emailOrUsername },
            { username: input.emailOrUsername },
          ],
        },
      });

      if (!friend) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur non trouvé",
        });
      }

      if (friend.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous ne pouvez pas vous ajouter vous-même comme ami",
        });
      }

      // Vérifier si l'amitié existe déjà
      const existingFriendship = await ctx.db.friendship.findFirst({
        where: {
          OR: [
            {
              userId: ctx.session.user.id,
              friendId: friend.id,
            },
            {
              userId: friend.id,
              friendId: ctx.session.user.id,
            },
          ],
        },
      });

      if (existingFriendship) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cette amitié existe déjà",
        });
      }

      // Créer la demande d'amitié
      const friendship = await ctx.db.friendship.create({
        data: {
          userId: ctx.session.user.id,
          friendId: friend.id,
          status: "PENDING",
        },
      });

      return friendship;
    }),

  // Accepter une demande d'amitié
  acceptFriend: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await ctx.db.friendship.findFirst({
        where: {
          id: input.friendshipId,
          friendId: ctx.session.user.id,
          status: "PENDING",
        },
      });

      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demande d'amitié non trouvée",
        });
      }

      const updatedFriendship = await ctx.db.friendship.update({
        where: { id: input.friendshipId },
        data: { status: "ACCEPTED" },
      });

      return updatedFriendship;
    }),

  // Refuser une demande d'amitié
  rejectFriend: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await ctx.db.friendship.findFirst({
        where: {
          id: input.friendshipId,
          friendId: ctx.session.user.id,
          status: "PENDING",
        },
      });

      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demande d'amitié non trouvée",
        });
      }

      await ctx.db.friendship.delete({
        where: { id: input.friendshipId },
      });

      return { success: true };
    }),

  // Récupérer la liste des amis
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await ctx.db.friendship.findMany({
      where: {
        OR: [
          { userId: ctx.session.user.id, status: "ACCEPTED" },
          { friendId: ctx.session.user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            level: true,
            totalPoints: true,
            currentStreak: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            level: true,
            totalPoints: true,
            currentStreak: true,
          },
        },
      },
    });

    // Transformer les données pour avoir un format uniforme
    const friends = friendships.map((friendship) => {
      const isUser = friendship.userId === ctx.session.user.id;
      return {
        id: friendship.id,
        user: isUser ? friendship.friend : friendship.user,
        friendshipId: friendship.id,
      };
    });

    return friends;
  }),

  // Récupérer les demandes d'amitié en attente
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const pendingRequests = await ctx.db.friendship.findMany({
      where: {
        friendId: ctx.session.user.id,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            level: true,
            totalPoints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return pendingRequests;
  }),

  // Récupérer le feed d'activités
  getFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Récupérer les IDs des amis
      const friendships = await ctx.db.friendship.findMany({
        where: {
          OR: [
            { userId: ctx.session.user.id, status: "ACCEPTED" },
            { friendId: ctx.session.user.id, status: "ACCEPTED" },
          ],
        },
        select: {
          userId: true,
          friendId: true,
        },
      });

      const friendIds = friendships.flatMap((f) => [
        f.userId,
        f.friendId,
      ]).filter((id) => id !== ctx.session.user.id);

      // Récupérer les posts des amis et de l'utilisateur
      const posts = await ctx.db.post.findMany({
        where: {
          OR: [
            { userId: { in: friendIds } },
            { userId: ctx.session.user.id },
          ],
          isPublic: true,
        },
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
          habit: {
            select: {
              id: true,
              title: true,
              icon: true,
              color: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          comments: {
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
            orderBy: { createdAt: "asc" },
            take: 5,
          },
          _count: {
            select: {
              likes: true,
              comments: true,
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

      return posts;
    }),

  // Créer un post
  createPost: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1, "Le contenu est requis"),
        type: z.enum([
          "ACHIEVEMENT",
          "MILESTONE",
          "BADGE_EARNED",
          "STREAK_BROKEN",
          "CHALLENGE_COMPLETED",
          "HABIT_COMPLETED",
          "GENERAL",
        ]).default("GENERAL"),
        image: z.string().url().optional(),
        habitId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
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
          habit: {
            select: {
              id: true,
              title: true,
              icon: true,
              color: true,
            },
          },
        },
      });

      return post;
    }),

  // Liker un post
  likePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Vérifier si le post existe
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post non trouvé",
        });
      }

      // Vérifier si l'utilisateur a déjà liké
      const existingLike = await ctx.db.like.findUnique({
        where: {
          postId_userId: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existingLike) {
        // Supprimer le like
        await ctx.db.like.delete({
          where: { id: existingLike.id },
        });
        return { liked: false };
      } else {
        // Ajouter le like
        await ctx.db.like.create({
          data: {
            postId: input.postId,
            userId: ctx.session.user.id,
          },
        });
        return { liked: true };
      }
    }),

  // Commenter un post
  commentPost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1, "Le contenu du commentaire est requis"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Vérifier si le post existe
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post non trouvé",
        });
      }

      const comment = await ctx.db.comment.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
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
      });

      return comment;
    }),

  // Récupérer le leaderboard
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        type: z.enum(["points", "streak", "habits"]).default("points"),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      let orderBy: any = {};

      switch (input.type) {
        case "points":
          orderBy = { totalPoints: "desc" };
          break;
        case "streak":
          orderBy = { currentStreak: "desc" };
          break;
        case "habits":
          orderBy = { habits: { _count: "desc" } };
          break;
      }

      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          level: true,
          totalPoints: true,
          currentStreak: true,
          _count: {
            select: {
              habits: true,
            },
          },
        },
        orderBy,
        take: input.limit,
      });

      return users.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
    }),
});
