import { ConvexError, v } from 'convex/values';
import { mutation, query } from '../_generated/server';

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

      const threadId = '123'; // TODO: Generate a unique thread ID

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
      if (!conversation) return null;

      return {
         _id: conversation._id,
         status: conversation.status,
         threadId: conversation.threadId,
      };
   },
});
