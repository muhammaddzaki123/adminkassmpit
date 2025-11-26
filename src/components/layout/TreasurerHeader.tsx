'use client';

import { useEffect, useState } from 'react';
import { Menu, Bell, DollarSign } from 'lucide-react';

interface TreasurerHeaderProps {
  onMenuClick?: () => void;
}

export function TreasurerHeader({ onMenuClick }: TreasurerHeaderProps) {
  const [userName, setUserName] = useState('Bendahara');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.nama || 'Bendahara');
    }
  }, []);

  return (
    <header className="h-16 bg-white border-b border-neutral-200 fixed top-0 left-64 right-0 z-40 shadow-soft">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-neutral-700" />
        </button>

        {/* Quick Stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Pemasukan Hari Ini</p>
              <p className="text-sm font-bold text-neutral-900">Rp 2.500.000</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-red-50 rounded-lg">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Pengeluaran Hari Ini</p>
              <p className="text-sm font-bold text-neutral-900">Rp 750.000</p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-neutral-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-neutral-900">{userName}</p>
              <p className="text-xs text-neutral-600">Bendahara</p>
            </div>
            <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-full flex items-center justify-center shadow-soft">
              <span className="text-white font-bold text-sm">{userName.charAt(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
