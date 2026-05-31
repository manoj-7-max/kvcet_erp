'use client';

import { usePathname } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '@/lib/apiConfig';

export default function DashboardHeader() {
  const pathname = usePathname();
  const { notifications, setNotifications } = useSocket();
  const { user, token, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate a page title based on the path
  const pathParts = pathname.split('/').filter(Boolean);
  const title = pathParts.length > 1 
    ? pathParts[pathParts.length - 1].replace('-', ' ') 
    : 'Dashboard';

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}` // Assuming AuthContext provides token globally, wait, token is in useSocket too or I can get it from useAuth
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  return (
    <header className="h-20 border-b border-white/10 bg-neutral-950/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center">
        <button className="md:hidden mr-4 text-neutral-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold capitalize text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-neutral-400 hover:text-white transition-colors relative"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-950"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-white/10 bg-neutral-800/50 flex justify-between items-center">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          onClick={() => markAsRead(notif._id)}
                          className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!notif.read ? 'bg-emerald-500/5' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-medium text-sm ${!notif.read ? 'text-emerald-400' : 'text-neutral-300'}`}>
                              {notif.title}
                            </span>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />}
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-2">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.name}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold border border-white/20">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>

        {/* Mobile logout button */}
        <button
          onClick={logout}
          className="md:hidden p-2 text-red-400 hover:text-red-300 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
