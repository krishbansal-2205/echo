'use client';

import { Button } from '@workspace/ui/components/button';
import { WidgetHeader } from '../components/widget-header';
import { ArrowLeftIcon, MenuIcon } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
   contactSesssionAtomFamily,
   conversationIdAtom,
   organizationIdAtom,
   screenAtom,
} from '../../atoms/widget-atoms';
import { useQuery } from 'convex/react';
import { api } from '@workspace/backend/_generated/api';

export const WidgetChatScreen = () => {
   const conversationId = useAtomValue(conversationIdAtom);
   const organizationId = useAtomValue(organizationIdAtom);
   const contactSessionId = useAtomValue(
      contactSesssionAtomFamily(organizationId || '')
   );

   const setScreen = useSetAtom(screenAtom);
   const setConversationId = useSetAtom(conversationIdAtom);

   const conversation = useQuery(
      api.public.conversations.getOne,
      conversationId && contactSessionId
         ? { contactSessionId, conversationId }
         : 'skip'
   );

   const onBack = () => {
      setConversationId(null);
      setScreen('selection');
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
         <div className='flex flex-1 flex-col gap-y-4 p-4'>
            {JSON.stringify(conversation)}
         </div>
      </>
   );
};
