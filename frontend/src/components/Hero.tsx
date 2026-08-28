'use client';

import { motion } from 'framer-motion';
import { Search, MapPin, Building, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsLoading(true);
      try {
        // Send natural language query to backend AI endpoint
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/ai/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        });
        
        const data = await response.json();
        
        // Convert the returned AI filters to a URL query string
        const searchParams = new URLSearchParams();
        if (data.filtersApplied) {
          if (data.filtersApplied.location) searchParams.append('location', data.filtersApplied.location);
          if (data.filtersApplied.minPrice) searchParams.append('minPrice', data.filtersApplied.minPrice);
          if (data.filtersApplied.maxPrice) searchParams.append('maxPrice', data.filtersApplied.maxPrice);
          if (data.filtersApplied.gender) searchParams.append('gender', data.filtersApplied.gender);
          if (data.filtersApplied.roomType) searchParams.append('roomType', data.filtersApplied.roomType);
          if (data.filtersApplied.hasWiFi !== null && data.filtersApplied.hasWiFi !== undefined) searchParams.append('hasWiFi', data.filtersApplied.hasWiFi);
          if (data.filtersApplied.hasAC !== null && data.filtersApplied.hasAC !== undefined) searchParams.append('hasAC', data.filtersApplied.hasAC);
        }
        
        router.push(`/properties?${searchParams.toString()}`);
      } catch (error) {
        console.error('AI Search failed', error);
        // Fallback to simple keyword search if AI fails
        router.push(`/properties?keyword=${encodeURIComponent(searchQuery)}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[150px] -z-10" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-blue-500/30 text-blue-300 text-sm mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            AI-Powered Recommendations
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
            Find Your Perfect <br className="hidden md:block" />
            <span className="text-gradient">Stay in Seconds</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl"
          >
            Discover the best hostels and PGs near your college or workplace. Real-time chat, AI recommendations, and verified owners.
          </motion.p>

          {/* AI Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-3xl glass-card p-2 md:p-4 rounded-2xl"
          >
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus-within:border-blue-500/50 transition-colors">
                <Search className="text-gray-400 w-5 h-5 mr-3" />
                <input
                  type="text"
                  placeholder="Ask AI: 'PG under ₹6000 near college with WiFi'"
                  className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Searching...
                  </span>
                ) : (
                  'Search'
                )}
              </button>
            </form>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-3xl"
          >
            {[
              { icon: <Building />, text: "1000+ Properties" },
              { icon: <MapPin />, text: "Prime Locations" },
              { icon: <DollarSign />, text: "Lowest Prices" },
              { icon: <Search />, text: "Smart AI Search" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-gray-400">
                <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-blue-400 mb-2">
                  {feature.icon}
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
