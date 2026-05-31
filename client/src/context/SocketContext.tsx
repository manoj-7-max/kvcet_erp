'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import API_BASE_URL from '@/lib/apiConfig';


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
      const socketInstance = io(API_BASE_URL, {
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
          const res = await fetch(`${API_BASE_URL}/api/notifications`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const json = await res.json();
            const data = json.data || json; // handle both wrapped and unwrapped
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
