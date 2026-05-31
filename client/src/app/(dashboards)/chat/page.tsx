'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available users to chat with
  const { data: users = [] } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!activeUserId || !token) return;
    const fetchMessages = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat/${activeUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMessages(await res.json());
    };
    fetchMessages();
  }, [activeUserId, token]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('message:new', (msg: any) => {
      // Only append if it belongs to the active chat
      if (msg.senderId === activeUserId || msg.receiverId === activeUserId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    let typingTimeout: NodeJS.Timeout;
    socket.on('typing:start', (data: any) => {
      if (data.senderId === activeUserId) {
        setIsTyping(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket.on('typing:stop', (data: any) => {
      if (data.senderId === activeUserId) setIsTyping(false);
    });

    return () => {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
      clearTimeout(typingTimeout);
    };
  }, [socket, activeUserId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUserId) return;

    const newMsg = {
      text: inputText,
      senderId: user?.id,
      receiverId: activeUserId,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    
    if (socket) {
      socket.emit('message:new', newMsg);
      socket.emit('typing:stop', { senderId: user?.id, receiverId: activeUserId });
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat/${activeUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newMsg.text })
      });
    } catch (error) {
      console.error('Failed to save message to DB');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socket && activeUserId) {
      if (e.target.value.length > 0) {
        socket.emit('typing:start', { senderId: user?.id, receiverId: activeUserId });
      } else {
        socket.emit('typing:stop', { senderId: user?.id, receiverId: activeUserId });
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Direct Messages</h1>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* User List Sidebar */}
        <div className="w-80 bg-neutral-900/50 border border-white/10 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-white/10 bg-neutral-800/30">
            <input 
              type="text" 
              placeholder="Search users..."
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.map((u: any) => (
              <button 
                key={u._id}
                onClick={() => setActiveUserId(u._id)}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3 ${activeUserId === u._id ? 'bg-white/10 border-l-4 border-l-emerald-500' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{u.name}</div>
                  <div className="text-xs text-neutral-500 uppercase">{u.role?.replace('_', ' ')}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-neutral-900/50 border border-white/10 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden relative">
          {!activeUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a user to start messaging</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10 bg-neutral-800/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-bold">{users.find((u: any) => u._id === activeUserId)?.name}</h2>
                  <p className="text-xs text-neutral-400">Online</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={idx} 
                      className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-neutral-800 text-neutral-200 rounded-tl-sm border border-white/10'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </motion.div>
                  );
                })}
                {isTyping && (
                  <div className="self-start items-start flex flex-col">
                    <div className="px-4 py-3 rounded-2xl bg-neutral-800 text-neutral-400 rounded-tl-sm border border-white/10 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-neutral-950 flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="flex-1 bg-neutral-900 border border-white/10 rounded-full px-6 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 flex items-center justify-center rounded-full text-white transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
