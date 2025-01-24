import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '../hooks/use-toast';
import type { Message as SharedMessage } from '../../../shared/src/types/entities';
import type { MessageDirection } from '../../../shared/src/types/enums';

export interface Message extends SharedMessage {
  status: 'draft' | 'sent';
  updatedAt: string;
}

interface MessageContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchMessages: (clientId?: number, taskId?: number) => Promise<void>;
  fetchDrafts: (clientId?: number) => Promise<void>;
  createMessage: (message: Partial<Message>) => Promise<Message | null>;
  updateMessage: (id: number, updates: Partial<Message>) => Promise<Message | null>;
  sendMessage: (id: number) => Promise<Message | null>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleError = (error: Error | unknown, customMessage: string) => {
    console.error(customMessage, error);
    setError(customMessage);
    toast({
      title: "Error",
      description: customMessage,
      variant: "destructive",
    });
  };

  const fetchMessages = useCallback(async (clientId?: number, taskId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (clientId) params.append('clientId', clientId.toString());
      if (taskId) params.append('taskId', taskId.toString());
      
      const response = await fetch(`http://localhost:3000/api/messages?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      handleError(error, 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrafts = useCallback(async (clientId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (clientId) params.append('clientId', clientId.toString());
      
      const response = await fetch(`http://localhost:3000/api/messages/drafts?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch draft messages');
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      handleError(error, 'Failed to fetch draft messages');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMessage = useCallback(async (message: Partial<Message>) => {
    setError(null);
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: Date.now(), // Temporary ID
      clientId: message.clientId!,
      direction: message.direction!,
      body: message.body!,
      status: message.status || 'sent',
      createdAt: new Date().toISOString(),
      sentAt: message.sentAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) throw new Error('Failed to create message');
      
      const newMessage = await response.json();
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? newMessage : m
      ));
      
      return newMessage;
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      handleError(error, 'Failed to create message');
      return null;
    }
  }, []);

  const updateMessage = useCallback(async (id: number, updates: Partial<Message>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update message');
      
      const updatedMessage = await response.json();
      setMessages(prev => prev.map(msg => msg.id === id ? updatedMessage : msg));
      return updatedMessage;
    } catch (error) {
      handleError(error, 'Failed to update message');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/messages/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const sentMessage = await response.json();
      setMessages(prev => prev.map(msg => msg.id === id ? sentMessage : msg));
      return sentMessage;
    } catch (error) {
      handleError(error, 'Failed to send message');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    messages,
    loading,
    error,
    fetchMessages,
    fetchDrafts,
    createMessage,
    updateMessage,
    sendMessage,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}; 