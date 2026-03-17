'use client';

import { useState, useEffect } from 'react';
import { Menu, Bell, User } from 'lucide-react';

interface StudentHeaderProps {
  onMenuClick: () => void;
}

export function StudentHeader({ onMenuClick }: StudentHeaderProps) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.nama || 'Siswa');
    }
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-20 shadow-soft">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-neutral-600" />
        </button>

        <div className="hidden md:flex rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 leading-tight">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">Portal Siswa</p>
            <p className="text-sm font-semibold text-neutral-800">SMP IT ANAK SOLEH MATARAM</p>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <Bell className="w-5 h-5 text-neutral-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-neutral-900">{userName}</p>
              <p className="text-xs text-neutral-600">Siswa</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-700 flex items-center justify-center shadow-soft">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
