'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Heart, Search, LogOut, User, MapPin, Building,
  Loader2, MessageSquare, Bell, BookOpen, Settings,
  ChevronRight, Trash2, Wifi, Wind, UtensilsCrossed, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

interface Property {
  _id: string;
  title: string;
  price: number;
  location: string;
  roomType: string;
  gender: string;
  availability: boolean;
  images: string[];
  hasAC: boolean;
  hasWiFi: boolean;
  hasFood: boolean;
}

type Tab = 'overview' | 'favorites' | 'profile';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated, updateUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') {
      router.push('/student/login');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: string) => {
    setRemovingId(propertyId);
    try {
      await api.delete(`/favorites/${propertyId}`);
      setFavorites(prev => prev.filter(p => p._id !== propertyId));
    } catch (e) {
      console.error(e);
    } finally {
      setRemovingId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await api.put('/users/profile', profileForm);
      updateUser(res.data);
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { id: 'overview', icon: <Home className="w-5 h-5" />, label: 'Overview' },
    { id: 'favorites', icon: <Heart className="w-5 h-5" />, label: 'Favorites', badge: favorites.length },
    { id: 'profile', icon: <Settings className="w-5 h-5" />, label: 'Profile' },
  ];

  const Sidebar = () => (
    <aside className="flex flex-col h-full p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Home className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">Stay<span className="text-blue-400">Finder</span></span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id as Tab); setSidebarOpen(false); }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-primary/20 text-white border border-primary/30 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge ? (
              <span className="text-xs bg-pink-500/30 text-pink-300 border border-pink-500/30 px-1.5 py-0.5 rounded-full font-semibold">{item.badge}</span>
            ) : null}
          </button>
        ))}

        <Link
          href="/properties"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Search className="w-5 h-5" />
          Browse Properties
        </Link>
      </nav>

      {/* User Info */}
      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 p-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-white/5"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 min-h-screen glass border-r border-white/10 fixed left-0 top-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/10 z-50 md:hidden"
            >
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Top bar */}
        <div className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">
                {activeTab === 'overview' ? `Welcome back, ${user?.name?.split(' ')[0]}! 👋` : activeTab === 'favorites' ? 'My Favorites' : 'Profile Settings'}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {activeTab === 'overview' ? 'Here\'s a summary of your StayFinder activity' : activeTab === 'favorites' ? `${favorites.length} saved properties` : 'Manage your account details'}
              </p>
            </div>
          </div>
          <Link href="/properties" className="hidden sm:flex items-center gap-2 text-sm bg-primary/20 hover:bg-primary/30 border border-primary/30 text-blue-300 px-4 py-2 rounded-xl transition-all">
            <Search className="w-4 h-4" /> Find PGs
          </Link>
        </div>

        <div className="p-6 md:p-8">

          {/* === OVERVIEW TAB === */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Saved Favorites', value: favorites.length, icon: <Heart className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', tab: 'favorites' as Tab },
                  { label: 'Explore Listings', value: '1000+', icon: <Building className="w-5 h-5" />, color: 'from-blue-500 to-blue-600', link: '/properties' },
                  { label: 'Profile Status', value: 'Active', icon: <User className="w-5 h-5" />, color: 'from-green-500 to-emerald-600', tab: 'profile' as Tab },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => s.tab ? setActiveTab(s.tab) : s.link && router.push(s.link)}
                    className="glass-card p-5 flex flex-col gap-3 cursor-pointer hover:border-white/20 transition-all group"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">{s.label}</p>
                      <p className="text-2xl font-bold text-white">{s.value}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-blue-400 transition-colors">
                      View <ChevronRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick links */}
              <div className="glass-card p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" /> Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { href: '/properties', icon: <Search className="w-4 h-4" />, title: 'Browse All Listings', desc: 'Find hostels and PGs in your area' },
                    { href: '#', icon: <Heart className="w-4 h-4 text-pink-400" />, title: 'My Favorites', desc: `${favorites.length} properties saved`, onClick: () => setActiveTab('favorites') },
                    { href: '/login', icon: <MessageSquare className="w-4 h-4 text-green-400" />, title: 'My Conversations', desc: 'Chat history with owners' },
                    { href: '#', icon: <Bell className="w-4 h-4 text-yellow-400" />, title: 'Notifications', desc: 'No new notifications' },
                  ].map((item) => (
                    <div
                      key={item.title}
                      onClick={item.onClick || (() => item.href !== '#' && router.push(item.href))}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 hover:border-white/15 transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg glass flex items-center justify-center text-blue-400 flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <p className="text-gray-500 text-xs truncate">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Saved snippet */}
              {favorites.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-400" /> Recent Favorites
                    </h2>
                    <button onClick={() => setActiveTab('favorites')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      View all →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.slice(0, 3).map((p, i) => (
                      <PropertyCard key={p._id} property={p} index={i} onRemove={handleRemoveFavorite} removingId={removingId} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* === FAVORITES TAB === */}
          {activeTab === 'favorites' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 glass-card rounded-2xl text-center p-8">
                  <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No saved favorites yet</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs">Explore properties and save the ones you like to access them quickly here.</p>
                  <Link href="/properties" className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                    <Search className="w-4 h-4" /> Browse Properties
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {favorites.map((p, i) => (
                    <PropertyCard key={p._id} property={p} index={i} onRemove={handleRemoveFavorite} removingId={removingId} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* === PROFILE TAB === */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
              <div className="glass-card p-8">
                {/* Avatar */}
                <div className="flex items-center gap-5 mb-8 pb-8 border-b border-white/10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      <User className="w-3 h-3" /> Student
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 text-sm transition-all"
                    />
                  </div>

                  {profileMsg && (
                    <div className={`text-sm p-3 rounded-xl border ${profileMsg.includes('success') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {profileMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-70"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out of StayFinder
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}

// ---- Sub-component: Property Card ----
function PropertyCard({
  property,
  index,
  onRemove,
  removingId,
}: {
  property: Property;
  index: number;
  onRemove: (id: string) => void;
  removingId: string | null;
}) {
  const isRemoving = removingId === property._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <div className="h-44 bg-white/5 relative overflow-hidden flex-shrink-0">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building className="w-10 h-10 text-white/20" />
          </div>
        )}
        <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-md font-semibold border backdrop-blur-sm ${property.availability ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
          {property.availability ? 'Available' : 'Unavailable'}
        </div>
        <div className="absolute top-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded-md font-medium border border-white/10 backdrop-blur-sm">
          {property.gender}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1 gap-2">
          <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">{property.title}</h3>
          <span className="text-blue-400 font-bold text-sm whitespace-nowrap">₹{property.price.toLocaleString()}<span className="text-xs text-gray-500 font-normal">/mo</span></span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3 mt-auto">
          <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{property.roomType}</span>
          {property.hasWiFi && <span className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Wifi className="w-2.5 h-2.5" /> WiFi</span>}
          {property.hasAC && <span className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Wind className="w-2.5 h-2.5" /> AC</span>}
          {property.hasFood && <span className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><UtensilsCrossed className="w-2.5 h-2.5" /> Food</span>}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/properties/${property._id}`}
            className="flex-1 text-center text-xs py-2 rounded-lg bg-white/5 hover:bg-primary border border-white/10 hover:border-transparent text-white transition-all font-medium"
          >
            View Details
          </Link>
          <button
            onClick={() => onRemove(property._id)}
            disabled={isRemoving}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
            title="Remove from favorites"
          >
            {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
