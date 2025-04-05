
import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification } from "@/types";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: "notif1",
    userId: "user1",
    title: "Welcome to AgencyOS",
    message: "Thank you for joining! Let's get started by setting up your organization.",
    type: "info",
    read: false,
    createdAt: new Date(),
    link: "/organization/setup",
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // In a real app, we would fetch notifications from an API
        setNotifications(mockNotifications);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  // Add notification
  const addNotification = (notificationData: Omit<Notification, "id" | "createdAt" | "read">) => {
    if (!user) return;

    const newNotification: Notification = {
      id: `notif${Date.now()}`,
      ...notificationData,
      read: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast for new notification
    toast(newNotification.title, {
      description: newNotification.message,
      action: {
        label: "View",
        onClick: () => {
          markAsRead(newNotification.id);
          if (newNotification.link) {
            window.location.href = newNotification.link;
          }
        },
      },
    });
  };

  // Mark as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
