'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, User, MoreVertical, Trash2, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [menuOpenMsgId, setMenuOpenMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available users to chat with
  const { data: users = [] } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!activeUserId || !token) return;
    const fetchMessages = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat/${activeUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.success ? json.data : []);
      }
    };
    fetchMessages();
  }, [activeUserId, token]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    // Request initial online users list
    socket.emit('request:online_users');

    socket.on('users:online', (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    socket.on('message:new', (msg: any) => {
      // Only append if it belongs to the active chat
      if (msg.senderId === activeUserId || msg.receiverId === activeUserId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on('message:delete', (data: any) => {
      setMessages(prev => prev.map(m => {
        if (m._id === data.messageId) {
          if (data.type === 'everyone') {
            return { ...m, isDeleted: true };
          }
        }
        return m;
      }));
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
      socket.off('users:online');
      socket.off('message:new');
      socket.off('message:delete');
      socket.off('typing:start');
      socket.off('typing:stop');
      clearTimeout(typingTimeout);
    };
  }, [socket, activeUserId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Click outside menu closer
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenMsgId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUserId) return;

    const optimisticId = `temp-${Date.now()}`;
    const newMsg = {
      _id: optimisticId,
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat/${activeUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newMsg.text })
      });
      const data = await res.json();
      if (data.success) {
        // Swap temp ID with real ID so delete works
        setMessages(prev => prev.map(m => m._id === optimisticId ? data.data : m));
      }
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

  const handleDeleteMessage = async (messageId: string, type: 'me' | 'everyone') => {
    if (type === 'me') {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } else {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true } : m));
      if (socket) {
        socket.emit('message:delete', { messageId, type, senderId: user?.id, receiverId: activeUserId });
      }
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
    } catch (error) {
      console.error('Failed to delete message');
    }
  };

  const activeUser = users.find((u: any) => u._id === activeUserId);
  const isActiveUserOnline = activeUser ? onlineUsers.includes(activeUser._id) : false;

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
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3 relative ${activeUserId === u._id ? 'bg-white/10 border-l-4 border-l-emerald-500' : ''}`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <User className="w-5 h-5" />
                  </div>
                  {onlineUsers.includes(u._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
                  )}
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
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <User className="w-5 h-5" />
                  </div>
                  {isActiveUserOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-800 rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-white font-bold">{activeUser?.name}</h2>
                  <p className={`text-xs ${isActiveUserOnline ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {isActiveUserOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg._id || idx} 
                      className={`flex flex-col max-w-[70%] relative ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      onMouseEnter={() => setHoveredMsgId(msg._id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                    >
                      <div className={`flex items-center gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* The Message Bubble */}
                        <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-neutral-800 text-neutral-200 rounded-tl-sm border border-white/10'} ${msg.isDeleted ? 'bg-transparent border border-white/10 text-neutral-500 italic' : ''}`}>
                          {msg.isDeleted ? (
                            <div className="flex items-center gap-1.5 opacity-60">
                              <Ban className="w-3.5 h-3.5" /> This message was deleted
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>

                        {/* Actions Menu Trigger */}
                        {(!msg.isDeleted && msg._id && !msg._id.startsWith('temp-')) && (
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuOpenMsgId(menuOpenMsgId === msg._id ? null : msg._id); }}
                              className={`p-1 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors ${hoveredMsgId === msg._id || menuOpenMsgId === msg._id ? 'opacity-100' : 'opacity-0'}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                              {menuOpenMsgId === msg._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className={`absolute top-full mt-1 z-10 w-44 bg-neutral-800 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 ${isMe ? 'right-0' : 'left-0'}`}
                                >
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg._id, 'me'); setMenuOpenMsgId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete for me
                                  </button>
                                  {isMe && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg._id, 'everyone'); setMenuOpenMsgId(null); }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                    >
                                      <Ban className="w-3.5 h-3.5" /> Delete for everyone
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>

                      <span className={`text-[10px] text-neutral-500 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
