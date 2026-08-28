'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin, Loader2, Home, Building } from 'lucide-react';
import api from '@/lib/api';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || searchParams.get('location') || '');
  const [gender, setGender] = useState(searchParams.get('gender') || '');

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const currentParams = new URLSearchParams(searchParams.toString());
      if (searchQuery) currentParams.set('keyword', searchQuery);
      if (gender) currentParams.set('gender', gender);
      const res = await api.get(`/properties?${currentParams.toString()}`);
      setProperties(res.data);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, [searchParams]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12 container mx-auto px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Find Hostels & PGs</h1>
          <form onSubmit={handleManualSearch} className="flex flex-col md:flex-row gap-4 glass-card p-4">
            <div className="flex-1 flex items-center bg-white/5 rounded-xl px-4 py-2 border border-white/10">
              <Search className="text-gray-400 w-5 h-5 mr-3" />
              <input
                type="text"
                placeholder="Search by location, college, or PG name..."
                className="w-full bg-transparent text-white outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select
                className="bg-white/5 text-white border border-white/10 rounded-xl px-4 py-2 outline-none appearance-none"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="" className="text-black">Any Gender</option>
                <option value="Boys" className="text-black">Boys</option>
                <option value="Girls" className="text-black">Girls</option>
                <option value="Unisex" className="text-black">Unisex</option>
              </select>
              <button type="submit" className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition-colors shadow-md font-medium">
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="glass-card p-5 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Room Type</h3>
                  <div className="space-y-2">
                    {['Single', 'Double', 'Triple', 'Dormitory'].map(type => (
                      <label key={type} className="flex items-center gap-3 text-white cursor-pointer">
                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 w-4 h-4" />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Amenities</h3>
                  <div className="space-y-2">
                    {['AC', 'WiFi', 'Food Included', 'Attached Bathroom', 'Parking'].map(amenity => (
                      <label key={amenity} className="flex items-center gap-3 text-white cursor-pointer">
                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 w-4 h-4" />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 glass-card rounded-2xl">
                <Home className="w-12 h-12 mb-4 text-gray-600" />
                <h3 className="text-xl font-medium text-white mb-2">No properties found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {properties.map((property, i) => (
                  <motion.div
                    key={property._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-colors duration-300 flex flex-col"
                  >
                    <div className="h-48 bg-white/5 relative overflow-hidden">
                      {property.images && property.images.length > 0 ? (
                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/10 flex items-center justify-center">
                          <Building className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      {property.availability && (
                        <div className="absolute top-3 left-3 bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs font-semibold backdrop-blur-md border border-green-500/30">Available</div>
                      )}
                      <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-md text-xs font-semibold backdrop-blur-md border border-white/10">
                        {property.gender}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{property.title}</h3>
                        <span className="text-lg font-bold text-blue-400 whitespace-nowrap ml-2">₹{property.price}<span className="text-sm text-gray-400 font-normal">/mo</span></span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" /> <span className="truncate">{property.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                        <span className="text-xs text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md">{property.roomType}</span>
                        {property.hasAC && <span className="text-xs text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md">AC</span>}
                        {property.hasWiFi && <span className="text-xs text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md">WiFi</span>}
                        {property.hasFood && <span className="text-xs text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md">Food</span>}
                      </div>
                      <Link href={`/properties/${property._id}`} className="block w-full py-2 bg-white/5 hover:bg-primary text-white rounded-lg transition-all border border-white/10 font-medium mt-2 text-center text-sm">
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Properties() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
