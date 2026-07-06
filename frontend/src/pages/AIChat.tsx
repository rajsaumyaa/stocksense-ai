import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { ChatMessage } from '../types';
import GlassCard from '../components/GlassCard';
import { Send, Sparkles, CornerDownLeft } from 'lucide-react';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "Which products should I reorder tomorrow?",
    "Show products with highest stockout risk.",
    "How can I reduce overstock?",
    "Explain the overall inventory health."
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message from the assistant
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "### Welcome to StockSense AI Assistant\n\nI am connected to your local store database. I can inspect current stock levels, predict tomorrow's demand, identify overstock/stockout risks, and advise on restocking decisions.\n\n*Click one of the suggested prompts below or type your question in the box.*"
        }
      ]);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const updatedMessages = [...messages, { role: 'user', content: text } as ChatMessage];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      // Exclude the first welcome message for clean history if needed, or pass full
      const response = await api.chat(text, updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
      if (response.suggested_prompts && response.suggested_prompts.length > 0) {
        setSuggestedPrompts(response.suggested_prompts);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "**Error**: Failed to connect to AI server. Please verify the FastAPI backend is running." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  // Basic Markdown Helper (handles bold, headers, lists, tables in simple HTML replacement)
  const renderMarkdown = (text: string) => {
    // Escape HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-4 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-zinc-950 dark:text-white mt-5 mb-2">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-xl font-extrabold text-zinc-950 dark:text-white mt-6 mb-3">$1</h2>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-zinc-900 dark:text-white">$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-500 dark:text-zinc-400">$1</em>');

    // Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc py-0.5">$1</li>');

    // Simple Tables parsing
    // Format: | col1 | col2 |
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHtml += '<div class="overflow-x-auto my-4"><table class="w-full text-left border-collapse border border-zinc-200 dark:border-zinc-800 text-xs"><thead>';
        }
        
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Skip separator row |---|---|
        if (cells.every(c => c.startsWith(':---') || c.startsWith('---') || c.startsWith(':---:'))) {
          tableHtml = tableHtml.replace('<thead>', '').replace('</thead>', ''); // discard header flag if separator
          tableHtml += '<tbody class="divide-y divide-zinc-200/50 dark:divide-zinc-800/30">';
          continue;
        }
        
        tableHtml += '<tr class="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10">';
        cells.forEach(cell => {
          tableHtml += `<td class="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800">${cell}</td>`;
        });
        tableHtml += '</tr>';
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table></div>';
          lines[i] = tableHtml + '\n' + lines[i];
          tableHtml = '';
        }
      }
    }
    html = lines.join('\n');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1.5" />;
  };

  return (
    <div className="h-[calc(100vh-190px)] min-h-[500px] flex flex-col gap-4 animate-fade-in">
      
      {/* Messages Scroll Box */}
      <GlassCard className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-5 border text-sm shadow-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none'
                    : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    <Sparkles size={12} />
                    <span>StockSense AI</span>
                  </div>
                )}
                {isUser ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderMarkdown(msg.content)}
              </div>
            </div>
          );
        })}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="flex w-full justify-start">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-none p-5 text-sm shadow-sm flex items-center space-x-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </GlassCard>

      {/* Suggested Prompts Grid */}
      <div className="flex flex-wrap gap-2 py-1">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 text-xs font-semibold px-4.5 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-left truncate max-w-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleFormSubmit} className="flex gap-3 mt-1.5 relative">
        <input
          type="text"
          disabled={loading}
          placeholder="Ask about inventory restocking, risks, or sales metrics..."
          className="flex-1 glass-input py-4 pr-24"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="absolute right-3.5 top-3 flex items-center space-x-2">
          {/* Shift+Enter helper note */}
          <span className="hidden md:flex items-center space-x-0.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mr-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
            <span>Enter</span>
            <CornerDownLeft size={10} />
          </span>
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;
