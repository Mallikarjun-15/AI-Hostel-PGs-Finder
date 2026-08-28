'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, MessageCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface Conversation {
  _id: string; // The ID of the other user
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  user: {
    name: string;
    email: string;
    profileImage: string;
  };
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

export default function ChatSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
      
      // Initialize Socket
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const socket = io(socketUrl);
      socketRef.current = socket;
      socket.emit('join_room', user._id);

      socket.on('receive_message', (msg: Message) => {
        // If message belongs to active chat, add to messages
        setActiveChatId(prevActiveId => {
          if (prevActiveId === msg.senderId || prevActiveId === msg.receiverId) {
            setMessages((prev) => [...prev, msg]);
          }
          return prevActiveId;
        });

        // Always update conversations list
        fetchConversations();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chats/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChat = async (userId: string) => {
    setActiveChatId(userId);
    try {
      const res = await api.get(`/chats/${userId}`);
      setMessages(res.data);
      // Optional: Clear unread count locally or via API
    } catch (error) {
      console.error('Failed to load chat history', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !user || !socketRef.current) return;

    const msgData = {
      senderId: user._id,
      receiverId: activeChatId,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, msgData as Message]);
    setNewMessage('');

    // Emit to socket
    socketRef.current.emit('send_message', msgData);

    // Save to DB via API to ensure it persists
    try {
      await api.post('/chats', msgData);
      fetchConversations(); // Update last message
    } catch (error) {
      console.error('Failed to save message', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 glass bg-[#0a1128]/95 border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Messages</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area: either conversations list or active chat */}
            {activeChatId ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-white/5">
                  <button onClick={() => setActiveChatId(null)} className="text-sm text-blue-400 hover:text-blue-300">
                    ← Back
                  </button>
                  <div className="font-medium text-white flex-1 text-center">
                    {conversations.find(c => c._id === activeChatId)?.user.name || 'Student'}
                  </div>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?._id;
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'glass-card bg-white/10 text-gray-200 rounded-bl-none'}`}>
                          <p className="text-sm break-words">{msg.message}</p>
                          <span className="text-[10px] opacity-60 mt-1 block">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-[#0a1128]">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                    <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                    <h3 className="text-white font-medium mb-1">No messages yet</h3>
                    <p className="text-gray-400 text-sm">When students contact you about your properties, messages will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv._id}
                        onClick={() => loadChat(conv._id)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          {conv.user.profileImage ? (
                            <img src={conv.user.profileImage} alt={conv.user.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {conv.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {conv.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#0a1128]">
                              {conv.unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="text-white font-medium truncate">{conv.user.name}</h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {conv.lastMessage}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
