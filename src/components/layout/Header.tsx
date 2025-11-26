'use client';

import React from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-[#f3f4f6] rounded-lg text-[#4b5563]"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold text-[#1c1c1c] hidden md:block">
          Selamat Datang, Bendahara
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-2 w-2 h-2 bg-[#ef4444] rounded-full ring-2 ring-white" />
        </Button>
        <div className="flex items-center gap-3 pl-4 border-l border-[#e5e7eb]">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-[#1c1c1c]">Ahmad Fauzi</p>
            <p className="text-xs text-[#4b5563]">Bendahara Utama</p>
          </div>
          <div className="w-10 h-10 bg-[#f3f4f6] rounded-full flex items-center justify-center border border-[#e5e7eb]">
            <User className="w-5 h-5 text-[#9ca3af]" />
          </div>
        </div>
      </div>
    </header>
  );
}
