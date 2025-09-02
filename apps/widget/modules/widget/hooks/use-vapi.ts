import { useEffect, useState } from 'react';
import Vapi from '@vapi-ai/web';

interface TranscriptMessage {
   role: 'user' | 'assistant';
   text: string;
}

export const useVapi = () => {
   const [vapi, setVapi] = useState<Vapi | null>(null);
   const [isConnected, setIsConnected] = useState(false);
   const [isConnecting, setIsConnecting] = useState(false);
   const [isSpeaking, setIsSpeaking] = useState(false);
   const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

   useEffect(() => {
      const vapiInstance = new Vapi(
         process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY || ''
      );
      setVapi(vapiInstance);

      vapiInstance.on('call-start', () => {
         setIsConnected(true);
         setIsConnecting(false);
         setTranscript([]);
      });

      vapiInstance.on('call-end', () => {
         setIsConnected(false);
         setIsConnecting(false);
         setIsSpeaking(false);
      });

      vapiInstance.on('speech-start', () => {
         setIsSpeaking(true);
      });

      vapiInstance.on('speech-end', () => {
         setIsSpeaking(false);
      });

      vapiInstance.on('error', (error) => {
         console.error('Vapi Error:', error);
         setIsConnected(false);
      });

      vapiInstance.on('message', (message) => {
         if (
            message.type === 'transcript' &&
            message.transcriptType === 'final'
         ) {
            setTranscript((prev) => [
               ...prev,
               {
                  role: message.role === 'user' ? 'user' : 'assistant',
                  text: message.transcript,
               },
            ]);
         }
      });

      return () => {
         vapiInstance?.stop();
      };
   }, []);

   const startCall = () => {
      setIsConnecting(true);
      if (vapi) {
         vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '');
      }
   };

   const endCall = () => {
      if (vapi) {
         vapi.stop();
      }
   };

   return {
      isConnected,
      isConnecting,
      isSpeaking,
      transcript,
      startCall,
      endCall,
   };
};
