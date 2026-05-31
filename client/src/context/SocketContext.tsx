'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// --- GLOBAL MONKEY PATCHES ---
// These run exactly once on client initialization
if (typeof window !== 'undefined' && !(window as any).__responseJsonPatched) {
  (window as any).__responseJsonPatched = true;
  const originalJson = Response.prototype.json;
  Response.prototype.json = async function () {
    const obj = await originalJson.call(this);
    // If the response follows our standardized API wrapper, unwrap the inner data
    if (obj && typeof obj === 'object' && 'success' in obj && 'data' in obj) {
      if (obj.success === true) {
        return obj.data;
      }
    }
    return obj;
  };
}

if (typeof window !== 'undefined' && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await originalFetch.apply(this, args);
    // If unauthorized (token expired / invalid auth), clear storage and redirect
    if (res.status === 401) {
      console.warn('Authentication token expired or invalid. Logging out.');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('selectedRole');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return res;
  };
}

interface NotificationType {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationType[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationType[]>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, selectedRole, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    if (user && token) {
      // Connect to Socket.IO server
      const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected:', socketInstance.id);
        
        // Emit join events
        socketInstance.emit('join', user.id);
        if (selectedRole) {
          socketInstance.emit('join_role', selectedRole);
        } else {
          socketInstance.emit('join_role', user.role);
        }
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      // Handle incoming notifications
      socketInstance.on('notification:new', (data) => {
        toast(
          (t) => (
            <div className="flex flex-col">
              <span className="font-semibold">{data.title || 'New Notification'}</span>
              <span className="text-sm">{data.message}</span>
            </div>
          ),
          { icon: '🔔' }
        );
        
        setNotifications((prev) => [
          {
            _id: data._id || Date.now().toString(),
            title: data.title || 'New Notification',
            message: data.message,
            type: data.type || 'system',
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      });

      socketInstance.on('message:new', (data) => {
        toast.success(`New message from ${data.senderName || 'someone'}`);
      });

      return () => {
        socketInstance.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user, selectedRole, token]);

  // Fetch initial notifications from DB
  useEffect(() => {
    const fetchNotifications = async () => {
      if (token) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/notifications`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            // Ensure data is array (Response.prototype.json handles unwrapping)
            if (Array.isArray(data)) {
              setNotifications(data);
            }
          }
        } catch (error) {
          console.error('Failed to fetch notifications', error);
        }
      }
    };
    
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
