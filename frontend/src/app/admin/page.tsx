'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Building, ShieldCheck, LogOut, Home, Loader2,
  Trash2, UserCheck, UserX, Eye, Plus, X, UploadCloud
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

type Tab = 'users' | 'properties';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, totalProperties: 0, students: 0, owners: 0 });

  // Property Form State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    ownerId: '', title: '', price: '', location: '', roomType: 'Single', gender: 'Boys',
    hasAC: false, hasWiFi: false, hasFood: false, hasAttachedBathroom: false, hasParking: false,
    ownerContact: '', facilities: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const [usersRes, propsRes] = await Promise.all([
        api.get('/users'),
        api.get('/properties/admin/all'), // Admin-only: returns ALL properties
      ]);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
      setStats({
        totalUsers: usersRes.data.length,
        totalProperties: propsRes.data.length,
        students: usersRes.data.filter((u: any) => u.role === 'student').length,
        owners: usersRes.data.filter((u: any) => u.role === 'owner').length,
      });
    } catch (e: any) {
      console.error(e);
      setFetchError(e?.response?.data?.message || 'Failed to load data. Make sure you are logged in as admin.');
    }
    finally { setIsLoading(false); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 5) {
        setFormError('You can only upload up to 5 images in total.');
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerId) {
      setFormError('Please select an owner to assign this property to.');
      return;
    }
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
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (e) { console.error(e); }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties(prev => prev.filter(p => p._id !== id));
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => { logout(); router.push('/'); };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Listings', value: stats.totalProperties, icon: <Building className="w-5 h-5" />, color: 'from-purple-500 to-purple-600' },
    { label: 'Students', value: stats.students, icon: <UserCheck className="w-5 h-5" />, color: 'from-green-500 to-green-600' },
    { label: 'Owners', value: stats.owners, icon: <UserX className="w-5 h-5" />, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
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
          {[
            { id: 'users', icon: <Users className="w-4 h-4" />, label: 'Users' },
            { id: 'properties', icon: <Building className="w-4 h-4" />, label: 'Properties' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all ${activeTab === tab.id ? 'bg-primary/20 text-white border border-primary/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all users and property listings</p>
        </div>

        {fetchError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 flex items-center gap-2">
            <span>⚠️</span> {fetchError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-gray-400 text-xs">{s.label}</p>
                <p className="text-2xl font-bold text-white">{isLoading ? '–' : s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : activeTab === 'users' ? (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-white font-semibold">All Users ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-white text-sm">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' : u.role === 'owner' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteUser(u._id)} disabled={u._id === user?._id} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-semibold">All Listings ({properties.length})</h2>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] font-medium text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Listing
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p, i) => (
                    <tr key={p._id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                      <td className="px-4 py-3 text-white text-sm font-medium">{p.title}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{p.location}</td>
                      <td className="px-4 py-3 text-blue-400 text-sm font-medium">₹{p.price?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.availability ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {p.availability ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/properties/${p._id}`}>
                            <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <button onClick={() => handleDeleteProperty(p._id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Listing Modal (Admin Mode) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Listing (On Behalf of Owner)</h2>
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
                  <label className="block text-xs font-medium text-gray-400 mb-1">Select Property Owner *</label>
                  <select name="ownerId" required value={formData.ownerId} onChange={handleFormChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary/50 text-sm appearance-none">
                    <option value="" disabled className="text-black">-- Choose an Owner --</option>
                    {users.filter(u => u.role === 'owner').map(u => (
                      <option key={u._id} value={u._id} className="text-black">{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
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
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-all disabled:opacity-70">
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
