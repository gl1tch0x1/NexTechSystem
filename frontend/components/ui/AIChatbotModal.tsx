'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Cpu,
  ShieldCheck,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { ChatMessage, generateStoreAIResponse } from '@/lib/ai-assistant';
import { ApiClient } from '@/lib/api-client';
import { Product } from '@/types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'bot',
    text: "👋 **Hello! I'm the NexTech AI Hardware Assistant.**\n\nI can assist you with real-time hardware specifications, PC Builder socket compatibility (LGA1700 / AM5), PSU wattage safety headroom, active discount coupons (`TECH10`), and free GCC express shipping terms.\n\n*What can I help you configure or locate today?*",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    links: [
      { label: 'Browse Hardware Catalog', url: '/products' },
      { label: 'Launch PC Builder Matrix', url: '/pc-builder' },
      { label: 'Active Deals & Coupons', url: '/products?featured=true' }
    ]
  }
];

const SUGGESTED_QUERIES = [
  '⚡ What are the RTX 4090 specs & price?',
  '🧩 How does CPU socket compatibility work?',
  '🎁 What discount coupons are active?',
  '🚚 What are the GCC shipping & VAT terms?',
  '🏢 Tell me about Dell PowerEdge R760 server'
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
    }, 450);
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
      {/* Floating Modern AI Trigger Button (Ant Design / Shadcn inspired) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open NexTech Hardware AI Assistant"
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-tech-blue to-tech-cyan text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="relative">
            <Bot className="w-5 h-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase hidden sm:inline">
            AI Assistant
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold hidden md:inline">
            Online
          </span>
        </button>
      </div>

      {/* Interactive Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[min(540px,calc(100vh-120px))] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-700/90 shadow-2xl flex flex-col overflow-hidden animate-fadeIn transition-colors duration-200">
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-tech-blue to-tech-cyan flex items-center justify-center text-white shadow-sm shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  NexTech AI Assistant
                  <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Hardware Engine • Store Grounded
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Close Chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10.5px] whitespace-nowrap shrink-0">
            {SUGGESTED_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.replace(/^[^\s]+\s/, ''))}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/80 hover:bg-tech-blue/10 hover:text-tech-blue dark:hover:bg-tech-blue/20 dark:hover:text-tech-cyan border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-medium transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Conversation Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-tech-blue/10 dark:bg-tech-blue/20 text-tech-blue dark:text-tech-cyan border border-tech-blue/20 dark:border-tech-blue/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 shadow-sm space-y-2 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-tech-blue to-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-slate-950/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {msg.text.split('\n').map((line, i) => {
                      const parts = line.split(/(\*\*.*?\*\*|\`.*?\`)/g);
                      return (
                        <p key={i} className={line.startsWith('- ') ? 'ml-2.5 my-0.5' : 'my-1'}>
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith('`') && part.endsWith('`')) {
                              return (
                                <code key={pIdx} className="px-1.5 py-0.5 rounded bg-tech-blue/10 dark:bg-tech-blue/20 text-tech-blue dark:text-tech-cyan font-mono text-[10px] font-bold border border-tech-blue/20">
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

                  {/* Context Links */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                      {msg.links.map((link, lIdx) => (
                        <Link
                          key={lIdx}
                          href={link.url}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-tech-blue hover:text-white text-tech-blue dark:text-tech-cyan border border-slate-200 dark:border-tech-cyan/30 text-[10px] font-bold transition-all shadow-sm"
                        >
                          <span>{link.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-slate-500">
                <div className="w-7 h-7 rounded-lg bg-tech-blue/10 dark:bg-tech-blue/20 text-tech-blue dark:text-tech-cyan flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-tech-cyan rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-tech-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-tech-blue dark:bg-tech-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer Area */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about sockets, wattage, RTX 4090, coupons..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue transition-colors placeholder:text-slate-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="p-2 rounded-xl bg-tech-blue hover:bg-blue-600 disabled:opacity-40 text-white transition-colors shadow-sm"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
