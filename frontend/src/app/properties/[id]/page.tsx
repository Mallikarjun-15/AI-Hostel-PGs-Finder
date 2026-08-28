'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import {
  MapPin, Phone, User, Wifi, Wind, UtensilsCrossed, Bath, ParkingSquare,
  MessageSquare, Heart, ArrowLeft, Loader2, Building, Send, X
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { io, Socket } from 'socket.io-client';

interface Property {
  _id: string; title: string; description: string; price: number;
  location: string; roomType: string; gender: string;
  hasAC: boolean; hasWiFi: boolean; hasFood: boolean;
  hasAttachedBathroom: boolean; hasParking: boolean;
  images: string[]; ownerContact: string; facilities: string[];
  availability: boolean;
  ownerId: { _id: string; name: string; email: string; profileImage: string };
}

interface Message {
  _id?: string; senderId: string; receiverId: string;
  message: string; propertyId: string; createdAt?: string;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  // Check favorite status once property + auth state is ready
  useEffect(() => {
    if (id && isAuthenticated) {
      api.get(`/favorites/check/${id}`)
        .then(res => setIsFavorite(res.data.isFavorite))
        .catch(() => {});
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    socketRef.current = socket;
    socket.emit('join_room', user._id);
    socket.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('user_typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    });
    return () => { socket.disconnect(); };
  }, [isAuthenticated, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchProperty = async () => {
    try {
      const res = await api.get(`/properties/${id}`);
      setProperty(res.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const loadChatHistory = async () => {
    if (!property || !user) return;
    try {
      const res = await api.get(`/chats/${property.ownerId._id}/${property._id}`);
      setMessages(res.data);
    } catch (e) { console.error(e); }
  };

  const handleOpenChat = () => {
    if (!isAuthenticated) { router.push('/student/login'); return; }
    setShowChat(true);
    loadChatHistory();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !property || !user || !socketRef.current) return;
    const msgData: Message = {
      senderId: user._id, receiverId: property.ownerId._id,
      message: newMessage.trim(), propertyId: property._id,
    };
    socketRef.current.emit('send_message', msgData);
    setMessages(prev => [...prev, { ...msgData, createdAt: new Date().toISOString() }]);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (!property || !user || !socketRef.current) return;
    socketRef.current.emit('typing', { senderId: user._id, receiverId: property.ownerId._id });
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) { router.push('/student/login'); return; }
    if (isFavLoading || !property) return;
    setIsFavLoading(true);
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${property._id}`);
        setIsFavorite(false);
      } else {
        await api.post(`/favorites/${property._id}`);
        setIsFavorite(true);
      }
    } catch (e) { console.error(e); }
    finally { setIsFavLoading(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );
  if (!property) return (
    <div className="min-h-screen flex items-center justify-center text-white">Property not found.</div>
  );

  const amenities = [
    { icon: <Wind className="w-4 h-4" />, label: 'AC', active: property.hasAC },
    { icon: <Wifi className="w-4 h-4" />, label: 'WiFi', active: property.hasWiFi },
    { icon: <UtensilsCrossed className="w-4 h-4" />, label: 'Food', active: property.hasFood },
    { icon: <Bath className="w-4 h-4" />, label: 'Attached Bath', active: property.hasAttachedBathroom },
    { icon: <ParkingSquare className="w-4 h-4" />, label: 'Parking', active: property.hasParking },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 container mx-auto px-4 md:px-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="glass-card overflow-hidden">
              <div className="h-72 md:h-96 bg-white/5 relative">
                {property.images.length > 0 ? (
                  <img src={property.images[activeImage]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Building className="w-16 h-16 text-white/20" />
                  </div>
                )}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold border ${property.availability ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  {property.availability ? 'Available' : 'Not Available'}
                </div>
              </div>
              {property.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {property.images.map((img, i) => (
                    <img key={i} src={img} onClick={() => setActiveImage(i)} className={`h-16 w-24 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${activeImage === i ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'}`} alt="" />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{property.title}</h1>
                  <div className="flex items-center gap-1 text-gray-400 mt-1">
                    <MapPin className="w-4 h-4" /> <span>{property.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-400">₹{property.price.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">per month</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {[property.roomType, property.gender].map(tag => (
                  <span key={tag} className="text-sm bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>

              <h3 className="text-white font-semibold mb-2">About this Property</h3>
              <p className="text-gray-400 leading-relaxed">{property.description}</p>

              {/* Amenities */}
              <h3 className="text-white font-semibold mt-6 mb-3">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map(a => (
                  <div key={a.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${a.active ? 'bg-primary/10 border-primary/30 text-blue-300' : 'bg-white/3 border-white/5 text-gray-600 line-through'}`}>
                    {a.icon} {a.label}
                  </div>
                ))}
              </div>

              {/* Facilities */}
              {property.facilities.length > 0 && (
                <>
                  <h3 className="text-white font-semibold mt-6 mb-3">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.facilities.map(f => (
                      <span key={f} className="text-xs text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">{f}</span>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Right: Owner Info + Actions */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Listed by</h3>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                  {property.ownerId?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{property.ownerId?.name}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-1"><User className="w-3 h-3" /> Owner</p>
                </div>
              </div>

              <div className="space-y-3">
                {property.ownerContact && (
                  <a href={`tel:${property.ownerContact}`} className="flex items-center gap-3 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm transition-colors">
                    <Phone className="w-4 h-4 text-green-400" /> {property.ownerContact}
                  </a>
                )}
                <button onClick={handleOpenChat} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary hover:bg-blue-600 rounded-xl text-white font-medium text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  <MessageSquare className="w-4 h-4" /> Chat with Owner
                </button>
                <button onClick={handleToggleFavorite} disabled={isFavLoading} className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium text-sm transition-all border disabled:opacity-60 ${isFavorite ? 'bg-pink-500/20 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-400' : ''}`} />
                  {isFavLoading ? 'Saving...' : isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed bottom-6 right-6 w-80 glass-card z-50 flex flex-col" style={{ height: '420px' }}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                {property.ownerId?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{property.ownerId?.name}</p>
                <p className="text-gray-400 text-xs">Owner</p>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-gray-500 text-xs text-center mt-8">Send a message to start a conversation</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${msg.senderId === user?._id ? 'bg-primary text-white' : 'bg-white/10 text-white'}`}>
                  {msg.message}
                </div>
              </div>
            ))}
            {isTyping && <p className="text-gray-400 text-xs">Owner is typing...</p>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 outline-none"
            />
            <button onClick={handleSendMessage} className="p-2 bg-primary rounded-xl text-white hover:bg-blue-600 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
