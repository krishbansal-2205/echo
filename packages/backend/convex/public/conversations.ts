import { ConvexError, v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { createThread, saveMessage } from '@convex-dev/agent';
import { components } from '../_generated/api';

export const create = mutation({
   args: {
      organizationId: v.string(),
      contactSessionId: v.id('contactSession'),
   },
   handler: async (ctx, args) => {
      const session = await ctx.db.get(args.contactSessionId);

      if (!session || session.expiresAt < Date.now()) {
         throw new ConvexError({
            code: 'UNAUTHORIZED',
            message: 'Invalid session',
         });
      }

      const threadId = await createThread(ctx, components.agent, {
         userId: args.organizationId,
      });

      await saveMessage(ctx, components.agent, {
         threadId,
         message: {
            role: 'assistant',
            content: 'Hello, how can I help you today?',
         },
      });

      const conversationId = await ctx.db.insert('conversations', {
         organizationId: args.organizationId,
         contactSessionId: session._id,
         status: 'unresolved',
         threadId,
      });

      return conversationId;
   },
});

export const getOne = query({
   args: {
      conversationId: v.id('conversations'),
      contactSessionId: v.id('contactSession'),
   },
   handler: async (ctx, args) => {
      const session = await ctx.db.get(args.contactSessionId);

      if (!session || session.expiresAt < Date.now()) {
         throw new ConvexError({
            code: 'UNAUTHORIZED',
            message: 'Invalid session',
         });
      }

      const conversation = await ctx.db.get(args.conversationId);
      if (!conversation) {
         throw new ConvexError({
            code: 'NOT_FOUND',
            message: 'Conversation not found',
         });
      }

      if (conversation.contactSessionId !== session._id) {
         throw new ConvexError({
            code: 'UNAUTHORIZED',
            message: 'Incorrect session',
         });
      }

      return {
         _id: conversation._id,
         status: conversation.status,
         threadId: conversation.threadId,
      };
   },
});
