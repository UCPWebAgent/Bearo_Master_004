import React, { useEffect, useRef } from 'react';
import { ChatMessage, Language } from '../types';

interface ConversationProps {
  messages: ChatMessage[];
  language?: Language;
  agentName?: string;
}

export const Conversation: React.FC<ConversationProps> = ({ messages, language = 'en', agentName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isHy = language === 'hy' || language === 'hy-east' || language === 'hy-west';
  const isEs = language === 'es';
  const isAr = language === 'ar';
  const isFa = language === 'fa';
  const isTl = language === 'tl';

  const t = {
    chat: isHy ? 'Չաթ' : isEs ? 'Chat' : isAr ? 'درդշե' : isFa ? 'گفتگو' : isTl ? 'Chat' : 'Chat',
    mechanic: isHy ? 'Մեխանիկ' : isEs ? 'Mecánico' : isAr ? 'միքանիկի' : isFa ? 'تعمیرکار' : isTl ? 'Mekaniko' : 'Mechanic',
    assistant: agentName || (isHy ? 'Ռիա' : isEs ? 'Asistente' : isAr ? 'ريա' : isFa ? 'ریا' : isTl ? 'Ria' : 'Ria')
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full bg-white p-4 md:p-6 flex flex-col font-sans text-gray-800">
      <h2 className="text-[40px] font-bold mb-4 md:mb-8">{t.chat}</h2>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={`${msg.timestamp}-${idx}`} className="space-y-1">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider ml-1">
              {msg.role === 'user' ? t.mechanic : t.assistant}
            </p>
            <div className="text-sm leading-relaxed text-gray-700">
              {msg.text.split(/(\(.*?\))/g).map((part, i) => {
                if (part.startsWith('(') && part.endsWith(')')) {
                  return (
                    <span key={i} className="block text-[11px] text-gray-400 italic font-medium mt-1">
                      {part}
                    </span>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
