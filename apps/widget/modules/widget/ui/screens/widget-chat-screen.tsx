'use client';

import { Button } from '@workspace/ui/components/button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { WidgetHeader } from '../components/widget-header';
import { ArrowLeftIcon, MenuIcon } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
   contactSesssionAtomFamily,
   conversationIdAtom,
   organizationIdAtom,
   screenAtom,
} from '../../atoms/widget-atoms';
import { useAction, useQuery } from 'convex/react';
import { api } from '@workspace/backend/_generated/api';
import { useThreadMessages, toUIMessages } from '@convex-dev/agent/react';
import {
   AIConversation,
   AIConversationContent,
} from '@workspace/ui/components/ai/conversation';
import {
   AIMessage,
   AIMessageContent,
} from '@workspace/ui/components/ai/message';
import { AIResponse } from '@workspace/ui/components/ai/response';
import { Form, FormField } from '@workspace/ui/components/form';
import {
   AIInput,
   AIInputSubmit,
   AIInputTextarea,
   AIInputToolbar,
   AIInputTools,
} from '@workspace/ui/components/ai/input';

const formSchema = z.object({
   message: z.string().min(1, 'Message is required'),
});

export const WidgetChatScreen = () => {
   const conversationId = useAtomValue(conversationIdAtom);
   const organizationId = useAtomValue(organizationIdAtom);
   const contactSessionId = useAtomValue(
      contactSesssionAtomFamily(organizationId || '')
   );

   const setScreen = useSetAtom(screenAtom);
   const setConversationId = useSetAtom(conversationIdAtom);

   const onBack = () => {
      setConversationId(null);
      setScreen('selection');
   };

   const conversation = useQuery(
      api.public.conversations.getOne,
      conversationId && contactSessionId
         ? { contactSessionId, conversationId }
         : 'skip'
   );

   const messages = useThreadMessages(
      api.public.messages.getMany,
      conversation?.threadId && contactSessionId
         ? { threadId: conversation.threadId, contactSessionId }
         : 'skip',
      { initialNumItems: 10 }
   );

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         message: '',
      },
   });

   const createMessage = useAction(api.public.messages.create);

   const onSubmit = async (data: z.infer<typeof formSchema>) => {
      if (!conversation || !contactSessionId) return;

      form.reset();

      await createMessage({
         threadId: conversation.threadId,
         prompt: data.message,
         contactSessionId,
      });
   };

   return (
      <>
         <WidgetHeader className='flex items-center justify-between'>
            <div className='flex items-center gap-x-2'>
               <Button size={'icon'} variant={'transparent'} onClick={onBack}>
                  <ArrowLeftIcon />
               </Button>
               <p>Chat</p>
            </div>
            <Button size={'icon'} variant={'transparent'}>
               <MenuIcon />
            </Button>
         </WidgetHeader>
         <AIConversation>
            <AIConversationContent>
               {toUIMessages(messages.results ?? [])?.map((message) => {
                  return (
                     <AIMessage
                        from={message.role === 'user' ? 'user' : 'assistant'}
                        key={message.id}
                     >
                        <AIMessageContent>
                           <AIResponse>{message.text}</AIResponse>
                        </AIMessageContent>
                     </AIMessage>
                  );
               })}
            </AIConversationContent>
         </AIConversation>
         <Form {...form}>
            <AIInput
               className='rounded-none border-x-0 border-b-0'
               onSubmit={form.handleSubmit(onSubmit)}
            >
               <FormField
                  control={form.control}
                  disabled={conversation?.status === 'resolved'}
                  name='message'
                  render={({ field }) => (
                     <AIInputTextarea
                        disabled={conversation?.status === 'resolved'}
                        onChange={field.onChange}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                           }
                        }}
                        placeholder={
                           conversation?.status === 'resolved'
                              ? 'This conversation has been resolved.'
                              : 'Type your message...'
                        }
                        value={field.value}
                     />
                  )}
               />
               <AIInputToolbar>
                  <AIInputTools />
                  <AIInputSubmit
                     disabled={
                        conversation?.status === 'resolved' ||
                        !form.formState.isValid
                     }
                     status='ready'
                     type='submit'
                  />
               </AIInputToolbar>
            </AIInput>
         </Form>
      </>
   );
};
