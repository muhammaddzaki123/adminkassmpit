'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard,
  Receipt,
  FileText, 
  LogOut,
  Database,
  RefreshCw,
  MessageCircle,
  History
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole = 'treasurer' }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getMenuItems = (role: string) => {
    const adminMenu = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { id: 'users', label: 'Kelola User', icon: Users, path: '/admin/users' },
      { id: 'backup', label: 'Backup Data', icon: Database, path: '/admin/backup' },
    ];

    const treasurerMenu = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/treasurer' },
      { id: 'students', label: 'Data Siswa', icon: Users, path: '/treasurer/students' },
      { id: 'spp', label: 'Pembayaran SPP', icon: CreditCard, path: '/treasurer/spp' },
      { id: 'expenses', label: 'Pengeluaran', icon: Receipt, path: '/treasurer/expenses' },
      { id: 're-registration', label: 'Daftar Ulang', icon: RefreshCw, path: '/treasurer/re-registration' },
      { id: 'reports', label: 'Laporan', icon: FileText, path: '/treasurer/reports' },
      { id: 'wa-reminder', label: 'WA Reminder', icon: MessageCircle, path: '/treasurer/wa-reminder' },
      { id: 'backup', label: 'Backup Data', icon: Database, path: '/treasurer/backup' },
    ];

    const parentMenu = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/parent' },
      { id: 'payment', label: 'Pembayaran', icon: CreditCard, path: '/parent/payment' },
      { id: 'history', label: 'Riwayat', icon: History, path: '/parent/history' },
    ];

    const headmasterMenu = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/headmaster' },
      { id: 'reports', label: 'Laporan', icon: FileText, path: '/headmaster/reports' },
      { id: 'students', label: 'Data Siswa', icon: Users, path: '/headmaster/students' },
    ];

    switch (role.toLowerCase()) {
      case 'admin': return adminMenu;
      case 'parent': return parentMenu;
      case 'headmaster': return headmasterMenu;
      case 'treasurer': return treasurerMenu;
      default: return treasurerMenu;
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    // Redirect to login
    router.push('/auth/login');
  };

  const menuItems = getMenuItems(userRole);

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-neutral-200 shadow-soft">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center shadow-md">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-neutral-900 text-xl leading-none tracking-tight">T-SMART</h1>
            <p className="text-xs text-neutral-600 mt-1 font-medium">Treasury System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-linear-to-r from-primary to-primary-600 text-white shadow-medium"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              <item.icon className={clsx(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive ? "text-white" : "text-neutral-400 group-hover:text-primary"
              )} />
              <span className="font-semibold text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 hover:shadow-soft font-semibold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
