'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareText,
  X,
  SendHorizontal,
  RotateCcw,
  User,
  ArrowRight,
  CheckCheck
} from 'lucide-react';
import { ChatMessage, generateStoreAIResponse } from '@/lib/ai-assistant';
import { ApiClient } from '@/lib/api-client';
import { Product } from '@/types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'bot',
    text: "**Welcome to NexTech Hardware Support.**\n\nHow can we help you today? You can inquire about:\n- **Technical Specifications**: CPUs, RTX 4090 GPUs, DDR5 kits, and NVMe SSDs.\n- **PC Compatibility Matrix**: Socket matching (LGA1700 / AM5) and PSU wattage headroom.\n- **Promotions & Coupons**: Active discounts like `TECH10` (10% off) or `SUMMER50`.\n- **Orders & Shipping**: GCC express delivery terms and standard 5% UAE VAT invoices.\n\n*Select a suggested topic below or type your inquiry.*",
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

  // Keyboard shortcut: Escape to close modal
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
    }, 380);
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
      {/* Floating Trigger Launcher - Matches NexTech Color Theme */}
      <div id="chatbot-modal" className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center">
        {/* Desktop Tooltip Pill */}
        <div
          role="tooltip"
          className="mr-3 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-md border border-slate-200 dark:border-slate-800 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Hardware Support</span>
          <span className="text-[10px] font-mono font-bold text-tech-blue dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60">
            Live
          </span>
        </div>

        {/* Circular Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close NexTech Hardware Support" : "Open NexTech Hardware Support Desk"}
          aria-expanded={isOpen}
          className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg ${
            isOpen
              ? 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700/80 shadow-slate-950/30'
              : 'bg-tech-blue hover:bg-blue-600 text-white shadow-blue-600/30 border border-blue-400/30'
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <>
              <MessageSquareText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              {/* Online Status Dot */}
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </span>
            </>
          )}
        </motion.button>
      </div>

      {/* Support Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="NexTech Hardware Support Desk"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 sm:bottom-22 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[420px] max-w-full h-[min(580px,calc(100vh-120px))] bg-white dark:bg-[#0A0E1A] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-slate-900/15 dark:shadow-black/70 flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 p-1 flex items-center justify-center relative shrink-0 shadow-xs">
                  <img
                    src="/images/nextech-logo.png"
                    alt="NexTech Support"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>NexTech Hardware Support</span>
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      ONLINE
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Product Specifications & Compatibility Desk
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Clear conversation history"
                  aria-label="Clear conversation history"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close support chat"
                  aria-label="Close support chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none shrink-0">
              {SUGGESTED_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.query)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-tech-blue dark:hover:text-cyan-400 hover:border-tech-blue dark:hover:border-cyan-400 border border-slate-200 dark:border-slate-800 font-medium transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Messages Conversation Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50 dark:bg-[#070B14]">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <img
                        src="/images/nextech-logo.png"
                        alt="NexTech"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs space-y-2 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-tech-blue text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800/90 rounded-tl-xs'
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
                                        : 'bg-slate-100 dark:bg-slate-800 text-tech-blue dark:text-cyan-400 border-slate-200 dark:border-slate-700'
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
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                        {msg.links.map((link, lIdx) => (
                          <Link
                            key={lIdx}
                            href={link.url}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-tech-blue hover:text-white dark:hover:bg-tech-blue dark:hover:text-white text-tech-blue dark:text-cyan-400 border border-slate-200 dark:border-slate-700 text-[10.5px] font-semibold transition-colors shadow-2xs"
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
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-tech-blue dark:text-cyan-300 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 items-center text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 flex items-center justify-center shrink-0">
                    <img
                      src="/images/nextech-logo.png"
                      alt="NexTech"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer Area */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200/90 dark:border-slate-800/90 shrink-0">
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 focus-within:border-tech-blue dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-tech-blue/20 dark:focus-within:ring-cyan-400/20 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about specifications, socket compatibility, coupons, orders..."
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
                  className="p-1.5 rounded-lg bg-tech-blue hover:bg-blue-600 disabled:opacity-30 text-white transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                  title="Send inquiry"
                  aria-label="Send inquiry"
                >
                  <SendHorizontal className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
                NexTech Systems Enterprise Platform • GCC Hardware Support
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
