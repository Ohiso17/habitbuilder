import { postRouter } from "~/server/api/routers/post";
import { habitRouter } from "~/server/api/routers/habit";
import { userRouter } from "~/server/api/routers/user";
import { socialRouter } from "~/server/api/routers/social";
import { challengeRouter } from "~/server/api/routers/challenge";
import { notificationRouter } from "~/server/api/routers/notification";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  habit: habitRouter,
  user: userRouter,
  social: socialRouter,
  challenge: challengeRouter,
  notification: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
