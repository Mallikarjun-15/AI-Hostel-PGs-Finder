'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Building, LogOut, Home, Edit2, Trash2, ToggleLeft, ToggleRight, X, UploadCloud, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import ChatSidebar from '@/components/ChatSidebar';

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

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', price: '', location: '', roomType: 'Single', gender: 'Boys',
    hasAC: false, hasWiFi: false, hasFood: false, hasAttachedBathroom: false, hasParking: false,
    ownerContact: '', facilities: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length + images.length > 5) {
        setFormError('Maximum 5 images allowed');
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'owner') {
      router.push('/owner/login');
      return;
    }
    fetchMyProperties();
  }, [isAuthenticated]);

  const fetchMyProperties = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/properties/my');
      setProperties(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string, current: boolean) => {
    try {
      await api.put(`/properties/${id}`, { availability: !current });
      setProperties(prev =>
        prev.map(p => p._id === id ? { ...p, availability: !current } : p)
      );
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties(prev => prev.filter(p => p._id !== id));
    } catch (e) { console.error(e); }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData(prev => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value.toString());
      });
      images.forEach((img) => {
        submitData.append('images', img);
      });

      await api.post('/properties', submitData);
      
      setShowForm(false);
      setImages([]);
      fetchMyProperties();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 min-h-screen glass border-r border-white/10 p-6 fixed left-0 top-0">
          <Link href="/">
            <div className="flex items-center gap-2 mb-10 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Stay<span className="text-blue-400">Finder</span></span>
            </div>
          </Link>

          <nav className="flex-1 space-y-2">
            <button className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/20 text-white border border-primary/30 w-full text-left">
              <Building className="w-5 h-5" /> My Listings
            </button>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
            >
              <MessageCircle className="w-5 h-5" /> Messages
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">Owner</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">My Listings</h1>
              <p className="text-gray-400 text-sm mt-1">Manage your hostel and PG listings</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] font-medium text-sm"
            >
              <Plus className="w-4 h-4" /> Add Listing
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card h-64 animate-pulse" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 glass-card rounded-2xl text-center">
              <Building className="w-12 h-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No listings yet</h3>
              <p className="text-gray-400 text-sm mb-4">Add your first hostel or PG to start receiving inquiries.</p>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium">
                <Plus className="w-4 h-4" /> Create First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
                  <div className="h-40 bg-white/5 relative">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} className="w-full h-full object-cover" alt={p.title} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Building className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold border ${p.availability ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                      {p.availability ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-white line-clamp-1">{p.title}</h3>
                      <span className="text-blue-400 font-bold text-sm ml-2">₹{p.price}/mo</span>
                    </div>
                    <p className="text-gray-400 text-xs mb-3">{p.location} · {p.gender} · {p.roomType}</p>
                    <div className="flex items-center gap-2 justify-between">
                      <button onClick={() => handleToggleAvailability(p._id, p.availability)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                        {p.availability ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                        Toggle
                      </button>
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Listing Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Listing</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Title *</label>
                  <input name="title" required value={formData.title} onChange={handleFormChange} placeholder="e.g. Premium Boys PG near ABC College" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-primary/50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Monthly Rent (₹) *</label>
                  <input name="price" type="number" required value={formData.price} onChange={handleFormChange} placeholder="8000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-primary/50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Location *</label>
                  <input name="location" required value={formData.location} onChange={handleFormChange} placeholder="e.g. Kothrud, Pune" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-primary/50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Room Type</label>
                  <select name="roomType" value={formData.roomType} onChange={handleFormChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary/50 text-sm appearance-none">
                    {['Single', 'Double', 'Triple', 'Dormitory'].map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleFormChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary/50 text-sm appearance-none">
                    {['Boys', 'Girls', 'Unisex'].map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Contact Number</label>
                  <input name="ownerContact" value={formData.ownerContact} onChange={handleFormChange} placeholder="10-digit number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-primary/50 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Facilities (comma separated)</label>
                  <input name="facilities" value={formData.facilities} onChange={handleFormChange} placeholder="e.g. Study table, Wardrobe, Hot water" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-primary/50 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { name: 'hasAC', label: 'AC' },
                    { name: 'hasWiFi', label: 'WiFi' },
                    { name: 'hasFood', label: 'Food Included' },
                    { name: 'hasAttachedBathroom', label: 'Attached Bathroom' },
                    { name: 'hasParking', label: 'Parking' },
                  ].map(({ name, label }) => (
                    <label key={name} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors">
                      <input type="checkbox" name={name} checked={(formData as any)[name]} onChange={handleFormChange} className="w-4 h-4 accent-primary" />
                      <span className="text-sm text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Room Photos (Max 5)</label>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 hover:border-primary/50 transition-all bg-white/5">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
                    </div>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                  </label>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {images.map((img, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden h-16 w-full">
                          <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 italic">💡 AI will auto-generate a description for your listing based on the details provided.</p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium text-sm transition-all disabled:opacity-70">
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Chat Sidebar */}
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
