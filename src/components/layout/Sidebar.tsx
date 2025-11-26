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
  Settings,
  LogOut,
  Database,
  RefreshCw,
  MessageCircle,
  History,
  Menu
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  userRole?: string;
  onNavigate?: (page: string) => void;
}

export function Sidebar({ userRole = 'treasurer', onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getMenuItems = (role: string) => {
    const common = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ];

    const treasurer = [
      { id: 'students', label: 'Data Siswa', icon: Users, path: '/students' },
      { id: 'spp', label: 'Pembayaran SPP', icon: CreditCard, path: '/spp' },
      { id: 'expenses', label: 'Pengeluaran', icon: Receipt, path: '/expenses' },
      { id: 'reports', label: 'Laporan', icon: FileText, path: '/reports' },
      { id: 'wa-reminder', label: 'WA Reminder', icon: MessageCircle, path: '/wa-reminder' },
      { id: 'backup', label: 'Backup Data', icon: Database, path: '/backup' },
    ];

    const admin = [
      ...treasurer,
      { id: 're-registration', label: 'Daftar Ulang', icon: RefreshCw, path: '/re-registration' },
    ];

    const parent = [
      { id: 'payment', label: 'Pembayaran', icon: CreditCard, path: '/payment' },
      { id: 'history', label: 'Riwayat', icon: History, path: '/history' },
    ];

    const headmaster = [
      { id: 'reports', label: 'Laporan', icon: FileText, path: '/reports' },
      { id: 'students', label: 'Data Siswa', icon: Users, path: '/students' },
    ];

    switch (role) {
      case 'admin': return [...common, ...admin];
      case 'parent': return [...common, ...parent];
      case 'headmaster': return [...common, ...headmaster];
      default: return [...common, ...treasurer];
    }
  };

  const handleLogout = () => {
    // Implement logout logic here
    router.push('/login');
  };

  const menuItems = getMenuItems(userRole);

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-[#e5e7eb]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#7ec242] rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-[#1c1c1c] text-lg leading-none">T-SMART</h1>
          <p className="text-xs text-[#4b5563] mt-1">Treasury System</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-[#7ec242] text-white shadow-md shadow-[#7ec242]/20"
                  : "text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#1c1c1c]"
              )}
            >
              <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-[#9ca3af] group-hover:text-[#1c1c1c]")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#e5e7eb]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[#ef4444] hover:bg-[#fee2e2] transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Keluar</span>
        </button>
      </div>
    </div>
  );
}
