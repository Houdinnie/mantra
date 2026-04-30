import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { chatRouter } from "./routers/chat";
import {
  memoryRouter, notesRouter, digestRouter, brainRouter,
  voiceRouter, notificationRouter,
} from "./routers/data";
import { executiveRouter, franklinRouter, millionDollarRouter } from "./routers/agents";
import { imageRouter } from "./routers/image";
import { taskRouter } from "./routers/tasks";
import { sandboxRouter } from "./routers/sandbox";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  chat: chatRouter,
  memory: memoryRouter,
  notes: notesRouter,
  digest: digestRouter,
  brain: brainRouter,
  voice: voiceRouter,
  notification: notificationRouter,
  executive: executiveRouter,
  franklin: franklinRouter,
  millionDollar: millionDollarRouter,
  image: imageRouter,
  task: taskRouter,
  sandbox: sandboxRouter,
});

export type AppRouter = typeof appRouter;
