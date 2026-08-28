'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Building, User, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Hostels & PGs', path: '/properties', icon: <Building className="w-4 h-4" /> },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'owner') return '/owner';
    return '/student';
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Stay<span className="text-blue-400">Finder</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.path}>
                  <span className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                    {link.icon}
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm text-white font-medium">{user.name?.split(' ')[0]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-red-500/20 text-red-300' : user.role === 'owner' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>
                      {user.role}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 glass-card p-2 rounded-xl shadow-xl"
                      >
                        <Link
                          href={getDashboardPath()}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-400" />
                          My Dashboard
                        </Link>
                        <div className="h-px bg-white/10 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/student/login">
                    <button className="text-sm font-medium text-white hover:text-blue-400 transition-colors cursor-pointer mr-4">
                      Student Login
                    </button>
                  </Link>
                  <Link href="/owner/login">
                    <button className="text-sm font-medium text-white hover:text-blue-400 transition-colors cursor-pointer mr-4">
                      Owner Login
                    </button>
                  </Link>
                  <Link href="/admin/login">
                    <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer mr-4">
                      Admin
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer">
                      Sign up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 mt-3"
          >
            <div className="flex flex-col px-4 py-6 gap-2">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.path} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 text-gray-300 p-2 rounded-lg hover:bg-white/10">
                    {link.icon}
                    <span>{link.name}</span>
                  </div>
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              {isAuthenticated && user ? (
                <>
                  <Link href={getDashboardPath()} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 text-white p-2 rounded-lg hover:bg-white/10">
                      <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      <span>My Dashboard</span>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 p-2 rounded-lg hover:bg-red-500/10 w-full text-left">
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/student/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 text-white p-2 rounded-lg hover:bg-white/10">
                      <LogIn className="w-4 h-4" />
                      <span>Student Login</span>
                    </div>
                  </Link>
                  <Link href="/owner/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 text-white p-2 rounded-lg hover:bg-white/10">
                      <Building className="w-4 h-4" />
                      <span>Owner Login</span>
                    </div>
                  </Link>
                  <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 text-gray-400 p-2 rounded-lg hover:bg-white/10">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Login</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
