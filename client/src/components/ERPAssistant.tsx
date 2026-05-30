'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';

export default function ERPAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggleAssistant = () => setIsOpen(!isOpen);

  return (
    <>
      <button 
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50 transition-all z-50 group flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-white/10 bg-neutral-800/50 flex justify-between items-center">
              <div className="flex items-center text-emerald-400">
                <Sparkles className="w-5 h-5 mr-2" />
                <h3 className="font-semibold text-white">ERP Assistant</h3>
              </div>
              <button onClick={toggleAssistant} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-64 p-4 overflow-y-auto flex flex-col gap-4 text-sm">
              <div className="bg-neutral-800 text-white p-3 rounded-lg rounded-tl-none self-start max-w-[85%]">
                Hi! I'm your KVCET ERP Assistant. How can I help you today?
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-neutral-800/30">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask me anything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-full pl-4 pr-12 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 rounded-full text-white hover:bg-emerald-500">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
