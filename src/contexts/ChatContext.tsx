
import React, { createContext, useContext, useState, useEffect } from "react";
import { ChatRoom, ChatMessage, Attachment } from "@/types";
import { useAuth } from "./AuthContext";
import { useOrganization } from "./OrganizationContext";
import { toast } from "sonner";

interface ChatContextType {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  loading: boolean;
  createRoom: (name: string, type: "direct" | "group" | "client", participantIds: string[]) => Promise<ChatRoom>;
  sendMessage: (roomId: string, content: string, attachments?: Attachment[]) => Promise<ChatMessage>;
  setCurrentRoom: (roomId: string | null) => void;
  markMessagesAsRead: (roomId: string) => Promise<void>;
  getUnreadCount: (roomId: string) => number;
  getTotalUnreadCount: () => number;
}

const ChatContext = createContext<ChatContextType | null>(null);

// Mock chat data
const mockChatRooms: ChatRoom[] = [
  {
    id: "room1",
    name: "Team Chat",
    type: "group",
    organizationId: "org1",
    createdById: "user1",
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [
      {
        userId: "user1",
        role: "admin",
        joinedAt: new Date(),
      },
    ],
  },
];

const mockChatMessages: Record<string, ChatMessage[]> = {
  room1: [
    {
      id: "msg1",
      roomId: "room1",
      senderId: "user1",
      content: "Welcome to Agency OS chat!",
      createdAt: new Date(),
      readBy: ["user1"],
    },
  ],
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoomState] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load chat rooms
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user || !organization) {
        setRooms([]);
        setCurrentRoomState(null);
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // In a real app, we would fetch chat rooms from an API
        setRooms(mockChatRooms);
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
        toast.error("Failed to load chat rooms");
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();
  }, [user, organization]);

  // Set current room and load messages
  const setCurrentRoom = (roomId: string | null) => {
    if (!roomId) {
      setCurrentRoomState(null);
      setMessages([]);
      return;
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      toast.error("Chat room not found");
      return;
    }

    setCurrentRoomState(room);
    
    // Load messages for room
    setLoading(true);
    try {
      // In a real app, we would fetch messages from an API
      setMessages(mockChatMessages[roomId] || []);
      
      // Mark messages as read
      markMessagesAsRead(roomId);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat room
  const createRoom = async (name: string, type: "direct" | "group" | "client", participantIds: string[]): Promise<ChatRoom> => {
    if (!user) throw new Error("User not authenticated");
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Create new room
      const newRoom: ChatRoom = {
        id: `room${Date.now()}`,
        name,
        type,
        organizationId: organization.id,
        createdById: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          {
            userId: user.id,
            role: "admin",
            joinedAt: new Date(),
          },
          ...participantIds.map(userId => ({
            userId,
            role: "member" as const,
            joinedAt: new Date(),
          })),
        ],
      };
      
      // Initialize messages array for room
      mockChatMessages[newRoom.id] = [];
      
      // Save to state
      setRooms([...rooms, newRoom]);
      
      toast.success("Chat room created successfully");
      return newRoom;
    } catch (error: any) {
      toast.error(error.message || "Failed to create chat room");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (roomId: string, content: string, attachments?: Attachment[]): Promise<ChatMessage> => {
    if (!user) throw new Error("User not authenticated");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Create new message
      const newMessage: ChatMessage = {
        id: `msg${Date.now()}`,
        roomId,
        senderId: user.id,
        content,
        createdAt: new Date(),
        readBy: [user.id],
        attachments,
      };
      
      // Save to state
      const updatedMessages = [...(mockChatMessages[roomId] || []), newMessage];
      mockChatMessages[roomId] = updatedMessages;
      
      // Update current messages if in the same room
      if (currentRoom?.id === roomId) {
        setMessages(updatedMessages);
      }
      
      // Update room's last message
      setRooms(rooms.map(room => 
        room.id === roomId ? { ...room, lastMessage: newMessage, updatedAt: new Date() } : room
      ));
      
      return newMessage;
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (roomId: string) => {
    if (!user) return;
    
    try {
      // Mark all messages in room as read by current user
      const roomMessages = mockChatMessages[roomId] || [];
      const updatedMessages = roomMessages.map(message => ({
        ...message,
        readBy: message.readBy.includes(user.id) 
          ? message.readBy 
          : [...message.readBy, user.id],
      }));
      
      mockChatMessages[roomId] = updatedMessages;
      
      // Update current messages if in the same room
      if (currentRoom?.id === roomId) {
        setMessages(updatedMessages);
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  // Get unread message count for a room
  const getUnreadCount = (roomId: string): number => {
    if (!user) return 0;
    
    const roomMessages = mockChatMessages[roomId] || [];
    return roomMessages.filter(message => 
      !message.readBy.includes(user.id) && message.senderId !== user.id
    ).length;
  };

  // Get total unread message count
  const getTotalUnreadCount = (): number => {
    if (!user) return 0;
    
    return rooms.reduce((total, room) => total + getUnreadCount(room.id), 0);
  };

  return (
    <ChatContext.Provider
      value={{
        rooms,
        currentRoom,
        messages,
        loading,
        createRoom,
        sendMessage,
        setCurrentRoom,
        markMessagesAsRead,
        getUnreadCount,
        getTotalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
