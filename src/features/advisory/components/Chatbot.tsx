import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/auth/AuthProvider';
import { getChatHistoryApi, sendChatMessageApi, sendPublicChatMessageApi, clearChatHistoryApi } from '@/features/advisory/api';
import { useGrammarCheck } from 'react-grammar-kit';

// Chat messages interface
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const GUEST_CHAT_LIMIT = 3;
const GUEST_CHAT_COUNT_KEY = 'ethio-guest-chat-count';

export function Chatbot() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [isOpen, setIsOpen] = useState(false);

  const getGreeting = useCallback(() => {
    return i18n.language === 'am'
      ? `ሰላም! እኔ ${import.meta.env.VITE_CHAT_BOT_NAME || 'የኢትዮ ሴንቲኔል ረዳት'} ነኝ። ዛሬ በጤና ክትትል ረገድ እንዴት ልረዳዎት እችላለሁ?`
      : `Hello! I am ${import.meta.env.VITE_CHAT_BOT_NAME || 'EthioSentinel Assistant'}. How can I help you with healthcare monitoring today?`;
  }, [i18n.language]);

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      text:
        i18n.language === 'am'
          ? `ሰላም! እኔ ${import.meta.env.VITE_CHAT_BOT_NAME || 'የኢትዮ ሴንቲኔል ረዳት'} ነኝ።`
          : `Hello! I am ${import.meta.env.VITE_CHAT_BOT_NAME || 'EthioSentinel Assistant'}.`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const historyRequestGen = useRef(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    historyRequestGen.current += 1;
    const gen = historyRequestGen.current;

    const greetOnly = (): Message[] => [
      {
        id: `greet-${userId || 'guest'}-${gen}`,
        text: getGreeting(),
        sender: 'bot',
        timestamp: new Date(),
      },
    ];

    if (!userId) {
      setHistoryLoading(false);
      setMessages(greetOnly());
      return;
    }

    setHistoryLoading(true);
    setMessages([]);

    const loadHistory = async () => {
      try {
        const history = await getChatHistoryApi();
        if (gen !== historyRequestGen.current) return;

        if (history.length === 0) {
          setMessages(greetOnly());
        } else {
          setMessages(
            history.map((item) => ({
              id: item.id,
              text: item.text,
              sender: item.role === 'USER' ? 'user' : 'bot',
              timestamp: new Date(item.createdAt),
            })),
          );
        }
      } catch (error) {
        console.error('Failed to load chat history', error);
        if (gen !== historyRequestGen.current) return;
        setMessages(greetOnly());
      } finally {
        if (gen === historyRequestGen.current) {
          setHistoryLoading(false);
        }
      }
    };

    void loadHistory();
  }, [userId, getGreeting]);

  useEffect(() => {
    if (historyLoading) return;
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{ ...prev[0], id: prev[0].id, text: getGreeting() }];
      }
      return prev;
    });
  }, [i18n.language, getGreeting, historyLoading]);

  const {
    text: input,
    setText: setInput,
    suggestions,
    loading: grammarLoading,
    applyFix,
    highlightedText,
  } = useGrammarCheck('');
  const [isLoading, setIsLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return Number(window.localStorage.getItem(GUEST_CHAT_COUNT_KEY) || '0');
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const language = i18n.language === 'am' ? 'AMHARIC' : 'ENGLISH';
      let reply;
      if (user) {
        reply = await sendChatMessageApi(input, language);
      } else {
        if (guestCount >= GUEST_CHAT_LIMIT) {
          const signupMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: i18n.language === 'am'
              ? 'ነፃ የእንግዳ ጥያቄዎችዎን ጨርሰዋል። ያለገደብ የጤና ምክር ለማግኘት እና ታሪክዎን ለማስቀመጥ እባክዎ ይመዝገቡ።'
              : 'You have used your free guest questions. Please sign up to continue with unlimited advisory chat and saved history.',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages((prev: Message[]) => [...prev, signupMessage]);
          return;
        }
        reply = await sendPublicChatMessageApi(input, language);
        const nextCount = guestCount + 1;
        setGuestCount(nextCount);
        window.localStorage.setItem(GUEST_CHAT_COUNT_KEY, String(nextCount));
      }

      const botMessage: Message = {
        id: reply.id,
        text: reply.text,
        sender: 'bot',
        timestamp: new Date(reply.createdAt),
      };
      setMessages((prev: Message[]) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Chatbot Error Detail:", error);
      
      let friendlyError = "I'm having trouble connecting to my brain right now. Please try again in a moment.";
      
      // More descriptive error if possible
      if (error?.message) {
        console.error("Error Message:", error.message);
      }
      
      if (error?.message?.includes("401")) {
        friendlyError = i18n.language === 'am'
          ? "ቻት ለመጠቀም ዳግም ይግቡ።"
          : "Please sign in again to continue the chat.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: friendlyError,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (user) {
      try {
        await clearChatHistoryApi();
      } catch (error) {
        console.error('Failed to clear chat history', error);
      }
    }
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: getGreeting(),
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={userId || 'guest'}
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] sm:w-[450px] h-[600px] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl border-border/50 ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="p-4 primary-gradient text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">EthioSentinel Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearHistory}
                  title="Clear conversation"
                  className="hover:bg-white/10 text-white rounded-full transition-colors h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/10 text-white rounded-full transition-colors h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!user && (
              <div className="border-b border-border bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                {i18n.language === 'am'
                  ? `እንግዳ መዳረሻ፡ ${Math.max(0, GUEST_CHAT_LIMIT - guestCount)} ነፃ ጥያቄዎች ቀርተዋል። ተጨማሪ ለማግኘት ይመዝገቡ።`
                  : `Guest access: ${Math.max(0, GUEST_CHAT_LIMIT - guestCount)} free questions left. Sign up for unlimited advisory chat.`}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 custom-scrollbar">
              {historyLoading && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                  <p>{t('chatLoadingHistory')}</p>
                </div>
              )}
              {!historyLoading &&
                messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex w-full",
                    m.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-4 py-3 text-sm/relaxed shadow-sm",
                      m.sender === 'user'
                        ? "primary-gradient text-white rounded-tr-none"
                        : "bg-background text-foreground rounded-tl-none border border-border/50 ring-1 ring-black/5"
                    )}
                  >
                    <div className={cn(
                      "prose prose-sm dark:prose-invert max-w-none",
                      m.sender === 'user' ? "text-white" : "text-foreground"
                    )}>
                      {m.sender === 'bot' ? (
                        <ReactMarkdown 
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-primary-600 dark:text-primary-300">{children}</strong>,
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      ) : (
                        <p>{m.text}</p>
                      )}
                    </div>
                    <div className={cn(
                        "text-[10px] mt-1.5 opacity-70 font-medium tracking-wide",
                        m.sender === 'user' ? "text-right text-white/80" : "text-left text-muted-foreground"
                    )}>
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {!historyLoading && isLoading && (
                <div className="flex justify-start">
                  <div className="bg-background rounded-2xl rounded-tl-none px-4 py-3 border border-border/50 shadow-sm flex items-center gap-2 ring-1 ring-black/5">
                    <div className="flex gap-1.5">
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="w-1.5 h-1.5 bg-primary-500 rounded-full" 
                      />
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-primary-500 rounded-full" 
                      />
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-primary-500 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              )}
              {!historyLoading && <div ref={messagesEndRef} />}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t bg-background flex gap-2 items-center"
            >
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={historyLoading || (!user && guestCount >= GUEST_CHAT_LIMIT)}
                className="bg-muted/50 border-border/50 focus-visible:ring-primary h-11 rounded-xl"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading || historyLoading || (!user && guestCount >= GUEST_CHAT_LIMIT)}
                className="h-11 w-11 primary-gradient transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25 rounded-xl shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center p-0",
          isOpen 
            ? "bg-background text-foreground border border-border/50" 
            : "primary-gradient text-white hover:shadow-primary/40 border-none"
        )}
      >
        <AnimatePresence mode='wait'>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageCircle className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full ring-2 ring-red-500/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}
