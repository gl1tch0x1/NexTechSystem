'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareText,
  X,
  SendHorizontal,
  RotateCcw,
  Headphones,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { ChatMessage, generateStoreAIResponse } from '@/lib/ai-assistant';
import { ApiClient } from '@/lib/api-client';
import { Product } from '@/types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'bot',
    text: "**Welcome to the NexTech Hardware Advisory Desk.**\n\nI provide technical guidance on computer components, PC Builder socket compatibility (Intel LGA1700 / AMD AM5), PSU wattage safety buffers (+30%), active discount codes (`TECH10`), and GCC express shipping terms.\n\n*How can I assist with your hardware build or enterprise configuration today?*",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    links: [
      { label: 'PC Compatibility Matrix', url: '/pc-builder' },
      { label: 'Hardware Catalog', url: '/products' },
      { label: 'Active Deals & Coupons', url: '/products?featured=true' }
    ]
  }
];

const SUGGESTED_QUERIES = [
  { label: 'Socket Compatibility (LGA1700 / AM5)', query: 'How does CPU socket compatibility work?' },
  { label: 'RTX 4090 Specs & Stock', query: 'What are the RTX 4090 specs & price?' },
  { label: 'Active Discount Codes', query: 'What discount coupons are active?' },
  { label: 'GCC Delivery & VAT', query: 'What are the GCC shipping & VAT terms?' },
  { label: 'Dell PowerEdge Servers', query: 'Tell me about Dell PowerEdge R760 server' },
  { label: 'PSU Wattage Calculation', query: 'How do you calculate PSU wattage safety headroom?' },
];

export function AIChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ApiClient.get<Product[]>('/products?limit=100')
      .then(res => {
        if (res && Array.isArray(res)) setCatalogProducts(res);
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateStoreAIResponse(text, catalogProducts);
      const newBotMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botResponse.text,
        links: botResponse.links,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newBotMessage]);
      setIsTyping(false);
    }, 420);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Professional Hardware Advisor Launcher Button */}
      <div id="chatbot-modal" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center">
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close NexTech Hardware Advisor" : "Open NexTech Hardware Advisor Desk"}
          aria-expanded={isOpen}
          className={`relative flex items-center transition-all duration-200 cursor-pointer shadow-xl border ${
            isOpen
              ? 'w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-800 text-white border-slate-700/90 shadow-slate-950/30 justify-center'
              : 'rounded-full bg-slate-900 hover:bg-slate-850 dark:bg-slate-900 dark:hover:bg-slate-800 text-white border-slate-700/90 shadow-slate-950/30 p-2 sm:pr-4 sm:pl-2.5 gap-2.5'
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-slate-200" />
          ) : (
            <>
              {/* Support Icon Orb with Live Online Indicator */}
              <div className="relative w-8 h-8 rounded-full bg-tech-blue flex items-center justify-center text-white shrink-0 shadow-xs">
                <MessageSquareText className="w-4 h-4 text-white" />
                {/* Live Online Indicator */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-slate-900 dark:border-slate-800" />
                </span>
              </div>

              {/* Desktop Text Lockup */}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white tracking-tight leading-tight">
                  Hardware Advisor
                </div>
                <div className="text-[10.5px] text-slate-300 font-medium flex items-center gap-1.5 leading-tight mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Online • Technical Desk</span>
                </div>
              </div>
            </>
          )}
        </motion.button>
      </div>

      {/* Interactive Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="NexTech Hardware Advisor Console"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="fixed bottom-20 sm:bottom-22 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[440px] max-w-full h-[min(590px,calc(100vh-120px))] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-950/25 dark:shadow-black/70 flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-tech-cyan shrink-0">
                  <Headphones className="w-4.5 h-4.5 text-tech-cyan" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>NexTech Hardware Advisor</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                      LIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <span>Compatibility & Specs Desk</span>
                    <span>•</span>
                    <span className="text-slate-400">Instant answers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Clear conversation history"
                  aria-label="Clear conversation history"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close chat"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Inquiries / Prompt Shortcuts */}
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Inquiries:
              </span>
              {SUGGESTED_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.query)}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/90 hover:bg-tech-blue/10 hover:text-tech-blue dark:hover:bg-tech-blue/20 dark:hover:text-tech-cyan border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 font-medium transition-all shadow-2xs shrink-0 cursor-pointer text-[11px]"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Messages Conversation Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-50/50 dark:bg-slate-900/40">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-800 text-tech-cyan border border-slate-700/70 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] rounded-2xl p-3.5 shadow-2xs space-y-2 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-tech-blue text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text.split('\n').map((line, i) => {
                        const parts = line.split(/(\*\*.*?\*\*|\`.*?\`)/g);
                        return (
                          <p key={i} className={line.startsWith('- ') ? 'ml-2.5 my-0.5' : 'my-1'}>
                            {parts.map((part, pIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong
                                    key={pIdx}
                                    className={
                                      msg.sender === 'user'
                                        ? 'font-bold text-white'
                                        : 'font-bold text-slate-900 dark:text-white'
                                    }
                                  >
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              if (part.startsWith('`') && part.endsWith('`')) {
                                return (
                                  <code
                                    key={pIdx}
                                    className={`px-1.5 py-0.5 rounded font-mono text-[10.5px] font-bold border ${
                                      msg.sender === 'user'
                                        ? 'bg-white/20 text-white border-white/30'
                                        : 'bg-slate-100 dark:bg-slate-700 text-tech-blue dark:text-tech-cyan border-slate-200 dark:border-slate-600'
                                    }`}
                                  >
                                    {part.slice(1, -1)}
                                  </code>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      })}
                    </div>

                    {/* Context Action Links */}
                    {msg.links && msg.links.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap gap-1.5">
                        {msg.links.map((link, lIdx) => (
                          <Link
                            key={lIdx}
                            href={link.url}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-tech-blue hover:text-white dark:hover:bg-tech-blue dark:hover:text-white text-slate-700 dark:text-slate-200 font-semibold text-[10.5px] transition-colors border border-slate-200/80 dark:border-slate-600/80 shadow-2xs"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-[9.5px] text-right mt-1 flex items-center justify-end gap-1 ${
                        msg.sender === 'user' ? 'text-blue-100/80' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'user' && <CheckCheck className="w-3 h-3 inline opacity-80" />}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-tech-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 items-center text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-800 text-tech-cyan border border-slate-700/70 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-tech-cyan rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-tech-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-tech-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer Area */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 focus-within:border-tech-blue focus-within:ring-2 focus-within:ring-tech-blue/20 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about socket compatibility, RTX 4090, coupons, orders..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none py-1"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  className="p-1.5 rounded-lg bg-tech-blue hover:bg-blue-600 disabled:opacity-30 text-white transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                  title="Send inquiry"
                  aria-label="Send inquiry"
                >
                  <SendHorizontal className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>NexTech Enterprise Hardware Desk</span>
                <span className="flex items-center gap-1 font-mono text-[9.5px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Verified Hardware Logic
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
