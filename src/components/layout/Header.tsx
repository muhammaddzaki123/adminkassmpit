'use client';

import React from 'react';
import { Bell, Menu, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-soft">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-neutral-50 rounded-xl text-neutral-600 transition-colors active:scale-95"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-neutral-900">
            Selamat Datang, Bendahara
          </h2>
          <p className="text-sm text-neutral-600 mt-0.5">Dashboard Treasury System - T-SMART</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative p-2.5 hover:bg-neutral-50 rounded-xl text-neutral-600 hover:text-neutral-900 transition-all active:scale-95">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-neutral-900">Ahmad Fauzi</p>
            <p className="text-xs text-neutral-600">Bendahara Utama</p>
          </div>
          <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-full flex items-center justify-center border-2 border-neutral-200 shadow-soft">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
