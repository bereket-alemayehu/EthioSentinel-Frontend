import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are the EthioSentinel Assistant, a specialized healthcare and system navigator for the EthioSentinel platform in Ethiopia. 
Your goal is to help health workers, admins, and public users with:
1. System navigation (Analytics, Reports, User Management).
2. Healthcare data interpretation (malaria outbreaks, vaccination trends, etc.).
3. Technical assistance (Offline capabilities, PWA features).
4. Health Advisory (Provide general health information, preventive measures, and wellness advice for the public).

- Always provide a medical disclaimer: "I am an AI assistant, not a doctor. Please consult a healthcare professional for clinical diagnosis or treatment."
- Be professional, concise, and healthcare-focused. 
- If asked about real-time data you don't have access to, guide the user to the "Analytics" or "Reports" sections of the portal.
- Respond in the language requested (English or Amharic).
`;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function Chatbot() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Initial message localized
  const getGreeting = () => {
    return i18n.language === 'am' 
      ? `ሰላም! እኔ ${import.meta.env.VITE_CHAT_BOT_NAME || 'የኢትዮ ሴንቲኔል ረዳት'} ነኝ። ዛሬ በጤና ክትትል ረገድ እንዴት ልረዳዎት እችላለሁ?`
      : `Hello! I am ${import.meta.env.VITE_CHAT_BOT_NAME || 'EthioSentinel Assistant'}. How can I help you with healthcare monitoring today?`;
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ethiosentinel_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("EthioSentinel: Failed to parse chat history", e);
      }
    }
    return [
      {
        id: '1',
        text: getGreeting(),
        sender: 'bot',
        timestamp: new Date(),
      },
    ];
  });

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem('ethiosentinel_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Update greeting if language changes and no other messages exist
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([{
        ...messages[0],
        text: getGreeting()
      }]);
    }
  }, [i18n.language]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("EthioSentinel: VITE_GEMINI_API_KEY is missing from .env");
      setMessages((prev: Message[]) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Configuration Error: API Key is missing. Please ensure VITE_GEMINI_API_KEY is set in your .env file and restart the server.",
        sender: 'bot',
        timestamp: new Date(),
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

      const chatHistory = messages
        .filter((_, i) => i > 0)
        .map((m: Message) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const currentLanguage = i18n.language === 'am' ? 'Amharic' : 'English';
      const promptText = chatHistory.length === 0 
        ? `${SYSTEM_PROMPT}\n\nIMPORTANT: Always respond in ${currentLanguage}.\n\nUser Question: ${input}`
        : `(Respond in ${currentLanguage}) ${input}`;
      
      const result = await chat.sendMessage(promptText);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response");

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      
      let friendlyError = "I'm having trouble connecting to my brain right now. Please try again in a moment.";
      
      if (error?.message?.includes("API_KEY_INVALID")) {
        friendlyError = "The provided API Key appears to be invalid. Please check your .env file.";
      } else if (error?.message?.includes("User location is not supported")) {
        friendlyError = "I'm sorry, but my AI services are not currently available in your region.";
      } else if (error?.message?.includes("quota")) {
        friendlyError = "I'm a bit overwhelmed with requests right now. Please wait a minute and try again.";
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

  const clearHistory = () => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: getGreeting(),
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 custom-scrollbar">
              {messages.map((m) => (
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
              {isLoading && (
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
              <div ref={messagesEndRef} />
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
                className="bg-muted/50 border-border/50 focus-visible:ring-primary h-11 rounded-xl"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading}
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
